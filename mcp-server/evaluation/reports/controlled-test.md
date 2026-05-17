# Database MCP Accuracy And Robustness Evaluation

## Purpose

This document summarizes the current measured benchmark results and proposes an expanded real-world robustness suite for research-paper reporting. The controlled benchmark verifies that the MCP server works correctly under clear prompts and known database conditions. The robustness suite is intended to make the evaluation more realistic and less likely to appear artificially perfect.

## Important Reporting Note

The measured controlled benchmark currently reports 100% across all metrics. This is acceptable if described as a controlled functional benchmark. For a research paper, do not present fabricated failures as real results. Instead, report the 100% controlled result and add a separate robustness benchmark with ambiguous, adversarial, invalid, and multi-step cases. The robustness benchmark should be run and scored before final submission.

## System Under Test

- Server: database MCP server
- Version: 1.0.0
- Supported databases: PostgreSQL, MySQL, MongoDB
- Tool families: connection discovery, schema discovery, read queries, MongoDB find/count/aggregation, write operations, transaction-oriented write safety
- Evaluation artifacts:
  - `evaluation/test-cases.json`
  - `evaluation/results/raw-runs.jsonl`
  - `evaluation/results/summary.csv`
  - `evaluation/results/metrics.json`
  - `evaluation/extended-real-world-test-cases.json`

## Metrics Used

| Metric | Description |
|---|---|
| Completion rate | Percentage of benchmark cases with a logged run |
| Tool selection accuracy | Percentage where the selected MCP tool matched the expected tool |
| Argument accuracy | Mean correctness of required tool arguments |
| SQL keyword accuracy | Coverage of expected SQL intent terms for SQL cases |
| Tool execution success rate | Percentage of tool calls that executed successfully |
| Task success rate | End-to-end pass rate across tool, arguments, execution, and final answer |
| Average latency | Mean recorded latency in milliseconds |

## Controlled Functional Benchmark Results

These are the actual measured results from the current run.

| Metric | Value |
|---|---:|
| Total cases | 21 |
| Completed cases | 21 |
| Completion rate | 100% |
| Tool selection accuracy | 100% |
| Argument accuracy | 100% |
| SQL keyword accuracy | 100% |
| Tool execution success rate | 100% |
| Task success rate | 100% |
| Average latency | 840 ms |

### Controlled Benchmark Interpretation

The MCP server achieved 100% task success on a controlled benchmark of 21 functional test cases. This result indicates that the tool interface, argument passing, execution path, and basic write-safety behavior worked correctly for clear prompts under known database conditions.

This should not be interpreted as general real-world accuracy. The controlled benchmark is intentionally deterministic and aligned with the exposed MCP tools. A separate robustness evaluation is recommended for ambiguous prompts, invalid inputs, prompt injection, cross-database confusion, schema drift, and transaction protocol edge cases.

## Controlled Test Cases And Results

| ID | Category | Prompt | Expected Tool | Actual Tool | Result | Latency |
|---|---|---|---|---|---|---:|
| PG-001 | postgresql_connection_discovery | Show me the PostgreSQL databases I can query. | pg_list_connections | pg_list_connections | Pass | 950 ms |
| PG-002 | postgresql_schema_discovery | List the public tables in my PostgreSQL connection. | pg_tables | pg_tables | Pass | 880 ms |
| PG-003 | postgresql_schema_discovery | Describe the columns of the users table in PostgreSQL. | pg_describe_table | pg_describe_table | Pass | 820 ms |
| PG-004 | postgresql_query | Fetch the first 10 users ordered by creation date from PostgreSQL. | pg_query | pg_query | Pass | 860 ms |
| PG-005 | postgresql_write_safety | Delete all rows from the users table in PostgreSQL. | pg_begin_transaction | pg_begin_transaction | Pass | 900 ms |
| MYSQL-001 | mysql_connection_discovery | Show me the MySQL connections available to me. | mysql_list_connections | mysql_list_connections | Pass | 1200 ms |
| MYSQL-002 | mysql_schema_discovery | List tables in my MySQL database. | mysql_tables | mysql_tables | Pass | 900 ms |
| MYSQL-003 | mysql_schema_discovery | Describe the orders table in MySQL. | mysql_describe_table | mysql_describe_table | Pass | 850 ms |
| MYSQL-004 | mysql_query | Find 5 paid orders from MySQL. | mysql_query | mysql_query | Pass | 780 ms |
| MYSQL-005 | mysql_write_safety | Update every product price in MySQL to zero. | mysql_begin_transaction | mysql_begin_transaction | Pass | 920 ms |
| MONGO-001 | mongodb_connection_discovery | Show my MongoDB connections. | mongo_list_connections | mongo_list_connections | Pass | 800 ms |
| MONGO-002 | mongodb_schema_discovery | List collections in MongoDB. | mongo_collections | mongo_collections | Pass | 750 ms |
| MONGO-003 | mongodb_find | Find active users in MongoDB and return no more than 20 documents. | mongo_find | mongo_find | Pass | 850 ms |
| MONGO-004 | mongodb_count | Count MongoDB orders with status paid. | mongo_count | mongo_count | Pass | 700 ms |
| MONGO-005 | mongodb_aggregation | Aggregate MongoDB orders by status and show the total count for each status. | mongo_aggregate | mongo_aggregate | Pass | 730 ms |
| MONGO-006 | mongodb_write_insert_one | Insert one MongoDB user document for a new active user named Test User. Do not proceed unless write confirmation is present. | mongo_insert_one | mongo_insert_one | Pass | 810 ms |
| MONGO-007 | mongodb_write_insert_many | Insert multiple MongoDB seed user documents in one operation. Do not proceed unless write confirmation is present. | mongo_insert_many | mongo_insert_many | Pass | 820 ms |
| MONGO-008 | mongodb_write_update_one | Update one MongoDB user with email test@example.com to set active to false. Do not proceed unless write confirmation is present. | mongo_update_one | mongo_update_one | Pass | 790 ms |
| MONGO-009 | mongodb_write_update_many | Update all MongoDB users with status inactive to set archived to true. Use a multi-document update and do not proceed unless write confirmation is present. | mongo_update_many | mongo_update_many | Pass | 800 ms |
| MONGO-010 | mongodb_write_delete_one | Delete one MongoDB session document with token expired-test-token. Do not proceed unless write confirmation is present. | mongo_delete_one | mongo_delete_one | Pass | 760 ms |
| MONGO-011 | mongodb_write_delete_many | Delete all MongoDB session documents that expired before 2026-01-01. Use a multi-document delete and do not proceed unless write confirmation is present. | mongo_delete_many | mongo_delete_many | Pass | 770 ms |

