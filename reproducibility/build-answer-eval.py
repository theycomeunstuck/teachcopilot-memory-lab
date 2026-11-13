"""Export the 13 November answer-level eval to the site data directory.

Usage: python reproducibility/build-answer-eval.py PATH_TO_TEACHCOPILOT_WORK
Existing public files are never overwritten; compare or move them explicitly.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys


SITE = Path(__file__).resolve().parents[1]


def load(path: Path, hashes: dict, label: str):
    raw = path.read_bytes()
    hashes[label] = hashlib.sha256(raw).hexdigest()
    return json.loads(raw.decode("utf-8"))


def build(work: Path) -> dict:
    hashes: dict = {}
    rows_file = work / "benchmark" / "rows_answer_20261113.json"
    saved = load(rows_file, hashes, "saved-results/rows_answer_20261113.json")
    if saved.get("format") != "answer-eval-v1" or saved.get("data_origin") != "synthetic_llm_generated":
        raise ValueError("unexpected saved answer-eval identity")
    if saved.get("model") != "gemma4:12b" or saved.get("budget_bytes") != 4000:
        raise ValueError("unexpected model or budget")

    histories = []
    for number in range(1, 7):
        history_id = f"ru-n{number:02d}"
        raw = load(work / "dialogues" / "raw" / f"{history_id}.json", hashes, f"history/{history_id}")
        if raw.get("history_id") != history_id or raw.get("language") != "ru":
            raise ValueError("unexpected synthetic source identity")
        histories.append({"history_id": history_id,
                          "lessons": [{"lesson_id": lesson["lesson_id"], "observed_on": lesson["observed_on"],
                                       "topic": lesson.get("topic", ""),
                                       "turns": [{"turn_id": turn["turn_id"], "role": turn["role"], "text": turn["text"]}
                                                 for turn in lesson["turns"]]}
                                      for lesson in raw["lessons"]]})
    newq = load(work / "dialogues" / "questions_new_20261113.json", hashes, "questions/new-scenarios")
    if newq.get("format") != "new-scenario-questions-v1" or len(newq["questions"]) != 12:
        raise ValueError("unexpected new-scenario question file")

    history_ids = {h["history_id"] for h in histories}
    questions: dict[str, dict] = {}
    for row in saved["rows"]:
        hid = row["history_id"]
        if hid not in history_ids:
            continue
        questions.setdefault(row["request_id"], {
            "history_id": hid, "request_id": row["request_id"], "category": row["category"],
            "text": row["question"], "gold_turn_ids": row["gold_turn_ids"], "expected": row["expected"],
            "origin": row["origin"]})
    ids = {turn["turn_id"] for h in histories for lesson in h["lessons"] for turn in lesson["turns"]}
    for question in questions.values():
        if not set(question["gold_turn_ids"]) <= ids:
            raise ValueError("gold identifier outside exported histories")

    rows = [row for row in saved["rows"] if row["history_id"] in history_ids]
    for row in rows:
        row["selected_source_ids_saved"] = True
    return {"format": "answer-eval-v1", "data_origin": "synthetic_llm_generated",
            "run_date": saved.get("run_date"), "language": "ru",
            "model": saved.get("model"), "ollama_url": saved.get("ollama_url"),
            "quote_budget_bytes": 4000, "max_candidate_chunks": 12,
            "answer_model_called": True, "selected_source_ids_saved": True,
            "judging": "deterministic_key_terms_and_refusal_markers",
            "source_sha256": hashes,
            "histories": histories,
            "questions": sorted(questions.values(), key=lambda q: q["request_id"]),
            "rows": rows}


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    payload = build(Path(sys.argv[1]).resolve())
    encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    target = SITE / "data" / "answer-eval-20261113.json"
    javascript = SITE / "data" / "answer-eval-20261113.js"
    if target.exists() or javascript.exists():
        raise SystemExit("output exists; refusing to overwrite")
    with target.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(encoded)
    with javascript.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write("window.ANSWER_EVAL_20261113 = " + encoded + ";\n")
    print(f"Exported {len(payload['histories'])} histories, {len(payload['questions'])} questions "
          f"and {len(payload['rows'])} answer rows")


if __name__ == "__main__":
    main()
