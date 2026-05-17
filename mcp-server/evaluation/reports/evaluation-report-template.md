# Database MCP Server Evaluation Report

## Evaluation Objective

This study evaluates the accuracy, reliability, and safety behavior of a database-focused Model Context Protocol server that exposes PostgreSQL, MySQL, and MongoDB tools to LLM-based agents.

## System Under Test

The MCP server provides tools for connection discovery, schema inspection, read queries, MongoDB find/count/aggregation operations, MongoDB single and bulk insert/update/delete operations, and transaction-based SQL write safety. Write operations are expected to require explicit confirmation. PostgreSQL/MySQL writes require an active transaction and a later commit or rollback decision; MongoDB update/delete bulk tools require non-empty filters.

## Dataset

The benchmark contains prompts across the following categories:

- PostgreSQL connection discovery, schema discovery, read queries, and write-safety prompts.
- MySQL connection discovery, schema discovery, read queries, and write-safety prompts.
- MongoDB connection discovery, collection discovery, find, count, aggregation, single-document writes, and bulk write prompts.

Dataset file: `evaluation/test-cases.json`

## Metrics

- Tool selection accuracy: percentage of cases where the selected MCP tool matched the expected tool.
- Argument accuracy: mean correctness of required tool arguments.
- SQL keyword accuracy: mean coverage of expected SQL intent terms for SQL query cases.
- Tool execution success rate: percentage of cases where the MCP tool executed successfully.
- Task success rate: percentage of cases satisfying tool selection, arguments, SQL intent when applicable, execution success, and minimum final-answer coverage.
- Average latency: mean latency in milliseconds for completed runs.

## Experimental Setup

- MCP server version: `1.0.0`
- Evaluation date: `YYYY-MM-DD`
- LLM/client used: `MODEL_OR_CLIENT_NAME`
- MCP transport: `SSE/REST/stdio`
- API key scope: `read` or `write`
- Number of runs per prompt: `N`
- Temperature/settings: `MODEL_SETTINGS`

## Results

Paste aggregate metrics from `evaluation/results/metrics.json`.

| Metric | Value |
|---|---:|
| Total cases |  |
| Completed cases |  |
| Tool selection accuracy |  |
| Argument accuracy |  |
| SQL keyword accuracy |  |
| Tool execution success rate |  |
| Task success rate |  |
| Average latency |  |

## Category-Level Results

Paste category breakdown from `evaluation/results/metrics.json`.

| Category | Cases | Passed | Success rate |
|---|---:|---:|---:|
|  |  |  |  |

## Failure Analysis

Use `evaluation/results/scored-runs.json` and `evaluation/results/summary.csv` to summarize failures.

| Failure type | Count | Interpretation |
|---|---:|---|
| wrong_tool |  | The assistant selected a tool other than the expected MCP tool. |
| bad_arguments |  | The assistant selected the correct tool but omitted or changed required arguments. |
| bad_sql |  | The generated SQL did not cover expected query intent terms. |
| tool_execution_failed |  | The MCP tool call failed or returned an error. |
| incomplete_final_answer |  | The final answer did not include expected user-facing information. |

## Discussion

Discuss whether failures were caused by ambiguous prompts, missing schema context, invalid connection IDs, model tool-selection behavior, or MCP server-side execution errors.

## Limitations

The starter benchmark is intentionally small and schema-dependent. A publication-quality evaluation should expand the dataset, use stable test databases with known ground truth, run multiple trials, and compare against at least one baseline.

## Reproducibility

All benchmark prompts, expected tool calls, raw MCP observations, scoring scripts, and generated metrics should be included as supplementary material.
