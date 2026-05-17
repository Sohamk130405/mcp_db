import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.join(root, "test-cases.json");
const runsPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, "results", "raw-runs.jsonl");
const outputDir = path.join(root, "results");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line)
    .map(({ line, lineNumber }) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        const preview = line.length > 220 ? `${line.slice(0, 220)}...` : line;
        throw new Error(
          `Invalid JSONL at line ${lineNumber}: ${error.message}\nLine preview: ${preview}`,
        );
      }
    });
}

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

function isPlaceholder(value) {
  return typeof value === "string" && value.startsWith("{{") && value.endsWith("}}");
}

function subsetScore(expected, actual) {
  const entries = Object.entries(expected ?? {});
  if (entries.length === 0) {
    return { score: 1, matched: 0, total: 0, missing: [] };
  }

  const missing = [];
  let matched = 0;

  for (const [key, expectedValue] of entries) {
    const actualValue = actual?.[key];
    const ok = isPlaceholder(expectedValue)
      ? actualValue !== undefined && actualValue !== null && actualValue !== ""
      : JSON.stringify(actualValue) === JSON.stringify(expectedValue);

    if (ok) {
      matched += 1;
    } else {
      missing.push({ key, expected: expectedValue, actual: actualValue });
    }
  }

  return {
    score: matched / entries.length,
    matched,
    total: entries.length,
    missing,
  };
}

function containsScore(expectedTerms, text) {
  const terms = expectedTerms ?? [];
  if (terms.length === 0) {
    return { score: 1, missing: [] };
  }

  const normalized = normalize(text);
  const missing = terms.filter((term) => !normalized.includes(normalize(term)));

  return {
    score: (terms.length - missing.length) / terms.length,
    missing,
  };
}

function classifyFailure(row) {
  if (!row.toolCorrect) return "wrong_tool";
  if (row.argumentScore < 1) return "bad_arguments";
  if (row.sqlScore < 1) return "bad_sql";
  if (!row.toolSucceeded) return "tool_execution_failed";
  if (row.answerScore < 1) return "incomplete_final_answer";
  return "";
}

function mean(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function percent(value) {
  return Number((value * 100).toFixed(2));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const headers = [
    "id",
    "category",
    "expectedTool",
    "actualTool",
    "toolCorrect",
    "argumentScore",
    "sqlScore",
    "toolSucceeded",
    "answerScore",
    "passed",
    "failureType",
    "latencyMs",
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

const testCases = readJson(casesPath);

if (!fs.existsSync(runsPath)) {
  console.error(`Missing run log: ${runsPath}`);
  console.error("Create it from your MCP client logs, or copy results/raw-runs.example.jsonl as a starting point.");
  process.exit(1);
}

const runs = new Map(readJsonl(runsPath).map((run) => [run.id, run]));
const rows = testCases.map((testCase) => {
  const run = runs.get(testCase.id) ?? {};
  const args = subsetScore(testCase.expectedArgsSubset, run.actualArgs);
  const sql = containsScore(testCase.expectedSqlContains, run.actualArgs?.sql);
  const answer = containsScore(testCase.expectedAnswerContains, run.finalAnswer);
  const toolCorrect = run.actualTool === testCase.expectedTool;
  const toolSucceeded = run.toolSucceeded === true;
  const passed =
    toolCorrect &&
    args.score === 1 &&
    sql.score === 1 &&
    toolSucceeded &&
    answer.score >= 0.5;

  const row = {
    id: testCase.id,
    category: testCase.category,
    expectedTool: testCase.expectedTool,
    actualTool: run.actualTool ?? "",
    toolCorrect,
    argumentScore: Number(args.score.toFixed(3)),
    sqlScore: Number(sql.score.toFixed(3)),
    toolSucceeded,
    answerScore: Number(answer.score.toFixed(3)),
    passed,
    failureType: "",
    latencyMs: run.latencyMs ?? "",
    safetyExpectation: testCase.expectedSafety,
    missingArgs: args.missing,
    missingSqlTerms: sql.missing,
    missingAnswerTerms: answer.missing,
  };

  row.failureType = classifyFailure(row);
  return row;
});

const completedRows = rows.filter((row) => row.actualTool);
const total = rows.length;
const completed = completedRows.length;
const summary = {
  generatedAt: new Date().toISOString(),
  totalCases: total,
  completedCases: completed,
  completionRate: percent(completed / total),
  toolSelectionAccuracy: percent(mean(rows.map((row) => (row.toolCorrect ? 1 : 0)))),
  argumentAccuracy: percent(mean(rows.map((row) => row.argumentScore))),
  sqlKeywordAccuracy: percent(mean(rows.map((row) => row.sqlScore))),
  taskSuccessRate: percent(mean(rows.map((row) => (row.passed ? 1 : 0)))),
  toolExecutionSuccessRate: percent(mean(rows.map((row) => (row.toolSucceeded ? 1 : 0)))),
  averageLatencyMs: Number(mean(completedRows.map((row) => Number(row.latencyMs))).toFixed(2)),
  failuresByType: rows.reduce((acc, row) => {
    if (row.failureType) acc[row.failureType] = (acc[row.failureType] ?? 0) + 1;
    return acc;
  }, {}),
  categoryBreakdown: Object.values(
    rows.reduce((acc, row) => {
      acc[row.category] ??= { category: row.category, cases: 0, passed: 0 };
      acc[row.category].cases += 1;
      if (row.passed) acc[row.category].passed += 1;
      return acc;
    }, {}),
  ).map((item) => ({
    ...item,
    successRate: percent(item.passed / item.cases),
  })),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "summary.csv"), toCsv(rows));
fs.writeFileSync(path.join(outputDir, "metrics.json"), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "scored-runs.json"), `${JSON.stringify(rows, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
