# Database MCP Server

A specialized Model Context Protocol (MCP) server that provides AI agents with secure, audited, and safety-first access to a variety of databases (MySQL, PostgreSQL, MongoDB).

## 🚀 Overview

This server acts as a gateway between Large Language Models (LLMs) and your database infrastructure. It not only provides tools for querying and managing data but also enforces strict security protocols, including:
- **Write-Safety**: Mandatory user confirmation for destructive operations.
- **Transactional Integrity**: Support for chat-scoped transactions.
- **Audit Logging**: Every tool call is logged for compliance and security.
- **Multi-Database Support**: Single interface for different database types.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **ORM**: Drizzle ORM (PostgreSQL for platform management)
- **Database Support**:
  - **MySQL**: (via `mysql2`)
  - **PostgreSQL**: (via `pg`)
  - **MongoDB**: (via `mongodb`)
- **Protocol**: Model Context Protocol (MCP) v1.0.0
- **Caching/Rate Limiting**: Redis

## 📋 Quick Start

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL (for the platform database)
- Redis (optional, for rate limiting)

### 2. Installation
```bash
cd mcp-server
npm install
```

### 3. Environment Setup
Create a `.env` file from the following template:
```env
DATABASE_URL=postgresql://user:pass@host/db  # Platform DB
ENCRYPTION_KEY=<64-char-hex-key>             # For encrypting DB creds
REDIS_URL=redis://localhost:6379 
PORT=3001
API_KEY_PREFIX=mcp_live_
```

### 4. Database Setup
```bash
npm run db:migrate  # Run platform migrations
npm run db:seed     # Create initial test user and API key
```

### 5. Running the Server
```bash
npm run dev
```

## 🔐 Security

- **API Keys**: All requests must include a valid `Authorization: Bearer <key>` header.
- **Scopes**: Keys can have `read` or `write` scopes.
- **Encryption**: Database credentials stored in the platform DB are encrypted using AES-256-GCM.
- **Confirmation**: Write operations require the `confirmWrite: true` parameter and an active transaction.

## 📄 Documentation
For detailed technical documentation, including architecture and API specifications, see [SYSTEM_DOCS.md](./SYSTEM_DOCS.md).

## 🤝 Contributing
Refer to [SYSTEM_DOCS.md](./SYSTEM_DOCS.md) for instructions on adding new database connectors or modifying the MCP toolset.
