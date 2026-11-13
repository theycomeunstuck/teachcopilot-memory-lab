import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = fs.readFileSync(path.join(root, "data/answer-eval-20261113.json"), "utf8");
const data = JSON.parse(raw);
const context = vm.createContext({window: {}});
vm.runInContext(fs.readFileSync(path.join(root, "data/answer-eval-20261113.js"), "utf8"), context);
assert.equal(JSON.stringify(context.window.ANSWER_EVAL_20261113), JSON.stringify(data));
assert.equal(data.format, "answer-eval-v1");
assert.equal(data.data_origin, "synthetic_llm_generated");
assert.equal(data.answer_model_called, true);
assert.equal(data.selected_source_ids_saved, true);
assert.equal(data.judging, "deterministic_key_terms_and_refusal_markers");
assert.equal(data.quote_budget_bytes, 4000);
assert.equal(data.model, "gemma4:12b");
assert.equal(data.histories.length, 6);
assert.equal(data.questions.length, 60);
assert.equal(data.rows.length, 60);
assert.equal(data.histories.flatMap(h => h.lessons.flatMap(l => l.turns)).length, 602);

const histories = new Map(data.histories.map(h => [h.history_id, h]));
const questions = new Map(data.questions.map(q => [q.request_id, q]));
assert.equal(questions.size, 60);
const ids = new Set([...histories.values()].flatMap(h => h.lessons.flatMap(l => l.turns.map(t => t.turn_id))));
const byOrigin = {november_fp: 0, new_scenario: 0};
let absent = 0;
for (const question of data.questions) {
  const history = histories.get(question.history_id);
  assert.ok(history, "history exists for every question");
  assert.ok(question.gold_turn_ids.every(id => ids.has(id)), "gold ids inside exported histories");
  assert.equal(question.gold_turn_ids.length === 0, question.category === "absent_fact");
  if (!question.gold_turn_ids.length) absent += 1;
  byOrigin[question.origin] += 1;
}
assert.deepEqual(byOrigin, {november_fp: 48, new_scenario: 12});
assert.equal(absent, 6);

let turnsCovered = 0;
for (const row of data.rows) {
  const question = questions.get(row.request_id);
  assert.ok(question && question.history_id === row.history_id && question.category === row.category);
  if (row.origin === "new_scenario") assert.equal(typeof row.answer_correct, "boolean");
  else assert.ok(row.answer_correct === null, "november rows stay unscored");
  assert.equal(typeof row.hedge_in_answer, "boolean");
  assert.equal(typeof row.refusal_marker, "boolean");
  assert.equal(typeof row.prompt_chars, "number");
  assert.ok(typeof row.model_context_packed === "string");
  assert.ok(row.answer.length > 0, "answer saved for every row");
  for (const id of row.quoted_turn_ids) assert.ok(ids.has(id), "quoted ids exist in history");
  if (question.gold_turn_ids.length) {
    assert.equal(typeof row.found_one, "boolean");
    assert.equal(typeof row.found_all, "boolean");
    assert.equal(row.found_one, row.quoted_turn_ids.some(id => question.gold_turn_ids.includes(id)));
    assert.equal(row.found_all, question.gold_turn_ids.every(id => row.quoted_turn_ids.includes(id)));
    assert.equal(row.correct_refusal, false);
    assert.equal(typeof row.refused_on_gold, "boolean");
    turnsCovered += row.quoted_turn_ids.length;
  } else {
    assert.equal(row.found_one, null);
    assert.equal(row.found_all, null);
    assert.equal(row.correct_refusal, row.refusal_marker);
  }
}
assert.equal(Object.keys(data.source_sha256).length, 8);
assert.ok(Object.values(data.source_sha256).every(value => /^[0-9a-f]{64}$/.test(value)));
console.log(`Verified answer-level eval data: 6 histories, 60 questions (6 without answers), 60 saved rows, ${turnsCovered} quoted turns total.`);
