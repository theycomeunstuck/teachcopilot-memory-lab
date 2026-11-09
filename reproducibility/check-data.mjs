import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The same checker works in the local source checkout and the public site repo.
const dataPath = fs.existsSync(path.join(site,"dist","data","audit-data.json"))
  ? path.join(site,"dist","data") : path.join(site,"data");
const context = vm.createContext({window:{}});
for (const name of ["audit-data.js","saved-retrieval-trace.js","controlled-comparison.js"]) {
  vm.runInContext(fs.readFileSync(path.join(dataPath,name),"utf8"),context,{filename:name});
}
const data = context.window.TEACHCOPILOT_AUDIT;
const trace = context.window.SAVED_RETRIEVAL_TRACE;
const control = context.window.CONTROLLED_COMPARISON;
const hash = raw => crypto.createHash("sha256").update(raw).digest("hex");
const rawAudit = fs.readFileSync(path.join(dataPath,"audit-data.json"));
assert.equal(data.publicData,"synthetic_only");
assert.equal(trace.auditSha256,hash(rawAudit));
assert.equal(control.manifest.sourceAuditSha256,hash(rawAudit));
assert.equal(trace.count,90);
assert.equal(Object.keys(trace.traces).length,90);
assert.equal(control.records.length,54);
assert.equal(control.manifest.status,"complete");
assert.equal(control.manifest.failed,0);
const byCase = new Map(data.cases.map(item => [item.caseId,item]));
const hybrid = data.cases.filter(item => item.modeId === "hybrid");
assert.equal(hybrid.length,18);
const withExpected = hybrid.filter(item => item.expectedSourceIds.length);
const hits = item => item.expectedSourceIds.filter(id => item.selectedSourceIds.includes(id));
assert.equal(withExpected.length,15);
assert.equal(withExpected.filter(item => hits(item).length > 0).length,10);
assert.equal(withExpected.filter(item => hits(item).length === item.expectedSourceIds.length).length,10);
assert.equal(hybrid.filter(item => item.review.newVerdict === "correct" && item.review.newSourceSupport === "supported").length,7);
assert.equal(hybrid.filter(item => !item.expectedSourceIds.length && item.review.newVerdict === "correct").length,3);
for (const item of data.cases) {
  const saved = trace.traces[item.caseId];
  assert.ok(saved && saved.status === "ok");
  assert.deepEqual(Array.from(saved.selectedSourceIds),Array.from(item.selectedSourceIds));
  assert.equal(hash(Buffer.from(item.memoryRaw,"utf8")),item.memorySha256);
  assert.ok(item.citedSourceIds.every(id => item.selectedSourceIds.includes(id)));
}
const first = byCase.get("pm-h07:pm-h07-q01:hybrid");
const chronological = byCase.get("pm-h07:pm-h07-q01:chronological");
assert.equal(hits(first).length,0);
assert.equal(hits(chronological).length,4);
const seen = new Set();
for (const row of control.records) {
  const key = `${row.historyId}:${row.requestId}:${row.arm}`;
  assert.ok(!seen.has(key),`duplicate ${key}`);
  seen.add(key);
  assert.equal(row.status,"ok");
  assert.equal(hash(Buffer.from(row.memoryRaw,"utf8")),row.memorySha256);
  assert.ok(row.citedSourceIds.every(id => row.selectedSourceIds.includes(id)));
  const original = byCase.get(`${row.historyId}:${row.requestId}:hybrid`);
  assert.equal(row.question,original.question);
  if (row.arm === "hybrid") assert.equal(row.memoryRaw,original.memoryRaw);
  if (row.arm === "no_memory") assert.equal(row.memoryRaw,"");
  if (row.arm === "oracle") assert.deepEqual([...row.selectedSourceIds].sort(),[...original.expectedSourceIds].sort());
}
assert.equal(seen.size,54);
console.log("Verified 90 saved traces, 54 separate comparison answers, source hashes, hybrid metric denominators and failure example.");
