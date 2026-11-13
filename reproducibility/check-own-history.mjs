import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = fs.readFileSync(path.join(root, "data/own-history-eval.json"), "utf8");
const data = JSON.parse(raw);
const context = vm.createContext({window: {}});
vm.runInContext(fs.readFileSync(path.join(root, "data/own-history-eval.js"), "utf8"), context);
assert.equal(JSON.stringify(context.window.OWN_HISTORY_EVAL), JSON.stringify(data));
assert.equal(data.data_origin, "synthetic_llm_generated");
assert.equal(data.answer_model_called, false);
assert.equal(data.selected_source_ids_saved, false);
assert.equal(data.quote_budget_bytes, 4000);
assert.equal(data.histories.length, 6);
assert.equal(data.questions.length, 48);
assert.equal(data.rows.length, 192);
assert.equal(data.histories.flatMap(h => h.lessons.flatMap(l => l.turns)).length, 602);
const histories = new Map(data.histories.map(h => [h.history_id, h]));
const questions = new Map(data.questions.map(q => [q.request_id, q]));
assert.equal(questions.size, 48);
for (const question of data.questions) {
  const history = histories.get(question.history_id);
  assert.ok(history);
  const ids = new Set(history.lessons.flatMap(lesson => lesson.turns.map(turn => turn.turn_id)));
  assert.ok(question.gold_turn_ids.every(id => ids.has(id)));
  assert.equal(question.gold_turn_ids.length === 0, question.category === "absent_fact");
}
const methods = ["legacy_cosine+0.04exact", "vector_only", "rrf_cosine+bm25prefix5", "bm25_prefix5"];
const expectedMeans = [0.6647, 0.6706, 0.6389, 0.4960];
for (const [index, method] of methods.entries()) {
  const rows = data.rows.filter(row => row.method === method);
  assert.equal(rows.length, 48);
  assert.equal(new Set(rows.map(row => row.qid)).size, 48);
  for (const row of rows) {
    const question = questions.get(row.qid);
    assert.ok(question && question.history_id === row.archive && question.category === row.category);
    assert.equal(typeof row.returned_any, "boolean");
    if (question.gold_turn_ids.length) {
      assert.ok(typeof row.coverage === "number" && row.coverage >= 0 && row.coverage <= 1);
      assert.equal(row.hit, row.coverage > 0);
    } else assert.equal(row.coverage, null);
  }
  const answerable = rows.filter(row => row.coverage !== null);
  const absent = rows.filter(row => row.coverage === null);
  assert.equal(answerable.length, 42);
  assert.equal(absent.length, 6);
  const mean = answerable.reduce((sum, row) => sum + row.coverage, 0) / answerable.length;
  assert.ok(Math.abs(mean - expectedMeans[index]) < 0.0001);
  if (method !== "bm25_prefix5") assert.equal(absent.filter(row => row.returned_any).length, 6);
}
assert.equal(Object.keys(data.source_sha256).length, 13);
assert.ok(Object.values(data.source_sha256).every(value => /^[0-9a-f]{64}$/.test(value)));
console.log("Verified synthetic own-history data: 6 histories, 602 turns, 48 questions and 192 saved method rows.");
