# Technical Documentation: Database MCP Server

This document provides a deep dive into the system architecture, security implementation, and extensibility of the Database MCP Server.

## 🏗️ System Architecture

The project follows a layered architecture to separate concerns and ensure maintainability:

1.  **Transport Layer**:
    -   **SSE (`/mcp/sse`)**: Primarily used for streaming tool results back to MCP clients.
    -   **REST (`/mcp/message`)**: Standard HTTP interface for the Model Context Protocol.
    -   **API Routes (`/api/*`)**: Management routes for connections, keys, and configuration.
2.  **Logic Layer (Services)**:
    -   `apiKey.service.ts`: Handles the generation, hashing (SHA-256), and validation of API keys.
    -   `connection.service.ts`: Manages database credentials, including AES-256-GCM encryption/decryption.
    -   `audit.service.ts`: Standardized logging of all AI activity.
    -   `checkpoint.service.ts`: Logic for detecting write queries and managing snapshots.
3.  **Connector Layer**:
    -   Abstracted drivers for **MySQL**, **PostgreSQL**, and **MongoDB**. These handle connection pooling and safe query execution.
4.  **Data Layer**:
    -   Platform Database managed by **Drizzle ORM**.

---

## 📊 Database Schema (Platform)

The platform database (Postgres) stores user accounts and metadata for their external connections.

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| `users` | Primary user identity. | `id`, `email`, `password_hash`, `plan` |
| `api_keys` | Authentication tokens for MCP. | `key_hash`, `key_prefix`, `scopes`, `userId` |
| `db_connections` | External DB credentials. | `db_type`, `host`, `credentials_encrypted` |
| `audit_logs` | Traceability of all tool calls. | `toolName`, `success`, `durationMs` |
| `db_checkpoints` | Recovery points for writes. | `tableName`, `operation`, `snapshot` |

---

## 🔒 Security Implementation

### 1. Credential Encryption
Your external database passwords are never stored in plain text. We use **AES-256-GCM authenticated encryption**:
- **IV**: 12 random bytes per connection.
- **Auth Tag**: 16 bytes for integrity verification.
- **Key**: Derived from `ENCRYPTION_KEY` in `.env`.

### 2. The Loop of Confirmation
For any `mysql_query` or `postgres_query` that modifies data:
1.  The LLM detects a write query.
2.  The LLM *must* call `mysql_begin_transaction`.
3.  The LLM *must* then call `mysql_query` with `confirmWrite: true` and the `transactionId`.
4.  The server validates the `write` scope of the API key before proceeding.

For MongoDB write tools, the server validates the `write` scope and requires `confirmWrite: true`. Multi-document update and delete tools require a non-empty filter so agents cannot accidentally modify or delete an entire collection with `{}`.

---

## 🛠️ MCP Tools Reference

### MySQL / PostgreSQL Tools
- `*_list_connections`: Returns IDs and labels of registered databases.
- `*_tables`: Lists all tables in a selected database.
- `*_describe_table`: Returns columns and data types for a specific table.
- `*_query`: Executes SQL. Rejects non-SELECT queries unless confirmation parameters are provided.
- `*_begin_transaction`, `*_commit_transaction`, `*_rollback_transaction`: Lifecycle management for write operations.

### MongoDB Tools
- `mongo_list_connections`: Returns IDs and labels of registered MongoDB connections.
- `mongo_collections`: Lists collections in a database.
- `mongo_find`: Runs a find query with optional filter, projection, sort, and limit.
- `mongo_count`: Counts documents matching an optional filter.
- `mongo_aggregate`: Runs an aggregation pipeline.
- `mongo_insert_one`, `mongo_update_one`, `mongo_delete_one`: Single-document write operations with mandatory confirmation.
- `mongo_insert_many`, `mongo_update_many`, `mongo_delete_many`: Multi-document write operations with mandatory confirmation. Bulk inserts accept 1-1000 documents per call; bulk update/delete require non-empty filters.

---

## 🧬 Extending the Project

### Adding a New Database Connector
1.  Create a new file in `src/connectors/`.
2.  Implement the `getPool` or `getClient` logic.
3.  Create a tool definition file in `src/mcp/tools/` (e.g., `sqlite.ts`).
4.  Register the new tools in `src/mcp/tools/index.ts`.

### Modifying Safety Logic
The safety assertions are located in `src/connectors/`. Specifically, `assertPgSelectOnly` and `assertMysqlSelectOnly` use regex and statement analysis to block unauthorized writes.
