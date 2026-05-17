# MCP Accuracy Evaluation

This folder contains a repeatable evaluation kit for the database MCP server. It is designed to produce logs, metrics, tables, and wording that can be reused in a research paper.

## What It Measures

- Tool selection accuracy: whether the assistant chose the expected MCP tool.
- Argument accuracy: whether required arguments were present and correct.
- SQL intent accuracy: whether generated SQL contains expected domain terms for SQL test cases.
- MongoDB write-safety coverage: whether insert/update/delete prompts select the appropriate single or bulk MongoDB write tool with confirmation arguments.
- Tool execution success: whether the MCP tool call succeeded.
- End-to-end task success: whether tool, arguments, execution, SQL intent, and final answer passed.
- Latency: milliseconds per tool call.

## Files

- `test-cases.json`: benchmark prompts and expected behavior.
- `results/raw-runs.example.jsonl`: example raw run format.
- `scorer.mjs`: converts raw runs into metrics.
- `results/summary.csv`: generated per-test results.
- `results/metrics.json`: generated aggregate metrics.
- `results/scored-runs.json`: generated detailed scoring output.
- `reports/evaluation-report-template.md`: research-paper-friendly report template.
- `mcp-evaluator-prompt.md`: prompt to run the benchmark through an MCP-capable assistant.

## Run The Evaluation

1. Replace placeholder IDs in `test-cases.json` or tell the MCP-capable assistant what the active connection IDs are.
2. Run each prompt in `test-cases.json` through your MCP client.
3. Save observations as JSON Lines in `results/raw-runs.jsonl`.

Each line should look like this:

```json
{"id":"PG-001","actualTool":"pg_list_connections","actualArgs":{},"toolSucceeded":true,"latencyMs":214,"finalAnswer":"I found the available PostgreSQL connections."}
```

Then score the results:

```bash
node evaluation/scorer.mjs
```

Or score a custom log file:

```bash
node evaluation/scorer.mjs evaluation/results/my-run.jsonl
```

The scorer writes:

```text
evaluation/results/summary.csv
evaluation/results/metrics.json
evaluation/results/scored-runs.json
```

## Recommended Paper Method

Run the benchmark at least three times using the same model and MCP configuration. Report mean and standard deviation for the primary metrics. For stronger results, compare:

- MCP enabled vs. MCP disabled.
- Read-only API key vs. write-scoped API key.
- Different LLMs.
- Different prompt templates.
- Old MCP version vs. current MCP version.

## Notes

The included test cases are starter cases. For a publishable benchmark, expand the dataset with real database schemas, realistic user questions, edge cases, and adversarial write-safety prompts.
