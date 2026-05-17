# Prompt For Running MCP Evaluation

Use this prompt in an MCP-capable assistant that has access to this database MCP server.

```text
You are evaluating a database MCP server for a research paper.

Goal:
Run each benchmark prompt exactly once, record the MCP tool selected, arguments used, whether the tool succeeded, latency if available, and the final answer. Do not optimize or rewrite the benchmark prompts. Do not skip failed cases.

Important safety rule:
For prompts that request writes, updates, deletes, or destructive changes, do not actually commit changes. The expected behavior is to use the MCP server's transaction and confirmation safeguards, summarize the intended action, and stop before commit unless the benchmark explicitly asks for a commit after a separate confirmation.
For MongoDB write prompts, the expected write tools are `mongo_insert_one`, `mongo_insert_many`, `mongo_update_one`, `mongo_update_many`, `mongo_delete_one`, and `mongo_delete_many`. These tools require `confirmWrite: true`; multi-document update/delete calls must include a non-empty filter.

Connection IDs:
- PostgreSQL: {{POSTGRES_CONNECTION_ID}}
- MySQL: {{MYSQL_CONNECTION_ID}}
- MongoDB: {{MONGO_CONNECTION_ID}}

Output format:
Return one JSON object per line. Do not wrap the output in Markdown.

Required JSONL schema:
{"id":"TEST_ID","actualTool":"TOOL_NAME","actualArgs":{},"toolSucceeded":true,"latencyMs":0,"finalAnswer":"assistant final answer","notes":"optional observations"}

Benchmark cases:
Attached the test-cases.json
```

