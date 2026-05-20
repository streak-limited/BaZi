#!/usr/bin/env python3
"""Add `prompt` field to all type=ai entries in ai_generated_content.json."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# Import prompts from companion module
from prompt_templates import PROMPTS_BY_DESCRIPTION  # noqa: E402

def main():
    path = ROOT / "refereence" / "ai_generated_content.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    missing = []
    added = 0
    for e in data["entries"]:
        if e.get("type") != "ai":
            continue
        desc = e["description"]
        if desc in PROMPTS_BY_DESCRIPTION:
            e["prompt"] = PROMPTS_BY_DESCRIPTION[desc]
            added += 1
        else:
            missing.append(desc)

    data["metadata"]["prompt_variables"] = [
        "name",
        "birth_date",
        "birth_time",
        "gender",
        "sexuality",
        "job_status",
        "four_pillars",
        "day_master",
        "day_master_strength",
        "five_elements",
        "ten_gods_summary",
        "hidden_stems",
        "major_luck_current",
        "major_luck_next",
        "current_age",
        "current_year",
        "current_year_stem_branch",
        "favorable_elements",
        "unfavorable_elements",
        "relationship_status",
    ]
    data["metadata"]["prompt_note"] = (
        "Each AI entry includes a prompt template. "
        "{{var}} placeholders are filled from user form + BaZi engine before calling the LLM."
    )

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Added prompts to {added} AI entries")
    if missing:
        print("MISSING:", missing)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
