"""Export the Russian synthetic subset of the saved 12 November retrieval run.

Usage: python reproducibility/build-own-history.py PATH_TO_TEACHCOPILOT_WORK
Existing public files are never overwritten; compare or move them explicitly.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys


SITE = Path(__file__).resolve().parents[1]
METHODS = ("legacy_cosine+0.04exact", "vector_only", "rrf_cosine+bm25prefix5", "bm25_prefix5")


def load(path, hashes, label):
    raw = path.read_bytes()
    hashes[label] = hashlib.sha256(raw).hexdigest()
    return json.loads(raw.decode("utf-8"))


def build(work):
    hashes, histories, questions = {}, [], []
    for number in range(1, 7):
        history_id = f"ru-n{number:02d}"
        raw = load(work / "dialogues" / "raw" / f"{history_id}.json", hashes, f"history/{history_id}")
        variants = load(work / "dialogues" / "questions_fp" / f"{history_id}.json", hashes, f"questions/{history_id}")
        if (raw.get("history_id") != history_id or raw.get("language") != "ru"
                or raw.get("generator") != "haiku-5.5" or variants.get("history_id") != history_id):
            raise ValueError("unexpected synthetic source identity")
        lessons = [{"lesson_id": lesson["lesson_id"], "observed_on": lesson["observed_on"],
                    "turns": [{"turn_id": turn["turn_id"], "role": turn["role"], "text": turn["text"]}
                              for turn in lesson["turns"]]}
                   for lesson in raw["lessons"]]
        ids = [turn["turn_id"] for lesson in lessons for turn in lesson["turns"]]
        if len(lessons) != 10 or len(ids) != len(set(ids)):
            raise ValueError("unexpected lesson or turn identifiers")
        selected = [question for question in variants["questions"] if question.get("variant") == "fp"]
        if len(selected) != 8 or any(not set(question["gold_turn_ids"]) <= set(ids) for question in selected):
            raise ValueError("unexpected first-person questions or gold identifiers")
        histories.append({"history_id": history_id, "lessons": lessons})
        questions.extend({"history_id": history_id, **{key: question[key] for key in
            ("request_id", "category", "text", "gold_turn_ids", "expected")}} for question in selected)
    raw_rows = load(work / "benchmark" / "rows_fp-vec.json", hashes, "saved-results/rows_fp-vec.json")
    rows = [row for row in raw_rows if row.get("lang") == "ru" and row.get("method") in METHODS]
    expected_keys = {(q["request_id"], method) for q in questions for method in METHODS}
    actual_keys = [(row["qid"], row["method"]) for row in rows]
    if len(actual_keys) != len(expected_keys) or set(actual_keys) != expected_keys:
        raise ValueError("saved result rows do not match the selected synthetic questions")
    if sum(not q["gold_turn_ids"] for q in questions) != 6:
        raise ValueError("unexpected number of unanswerable questions")
    return {"format": "own-history-eval-v1", "data_origin": "synthetic_llm_generated",
            "run_date": "2026-11-12", "language": "ru", "generator": "haiku-5.5",
            "question_variant": "first_person", "quote_budget_bytes": 4000,
            "max_candidate_chunks": 12, "answer_model_called": False,
            "selected_source_ids_saved": False, "source_sha256": hashes,
            "histories": histories, "questions": questions, "rows": rows}


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    payload = build(Path(sys.argv[1]).resolve())
    encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    target = SITE / "data" / "own-history-eval.json"
    javascript = SITE / "data" / "own-history-eval.js"
    if target.exists() or javascript.exists():
        raise SystemExit("output exists; refusing to overwrite")
    with target.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(encoded)
    with javascript.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write("window.OWN_HISTORY_EVAL = " + encoded + ";\n")
    print(f"Exported {len(payload['histories'])} synthetic histories, {len(payload['questions'])} questions and {len(payload['rows'])} saved method rows")


if __name__ == "__main__":
    main()
