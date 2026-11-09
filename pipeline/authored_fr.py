"""Apply reviewed French passages and receipts from the private manuscript.

Run from the site root with `python pipeline/authored_fr.py PATH_TO_MANUSCRIPT`
to refresh the checked-in French edition without rerunning machine translation.
"""

import argparse
import json
from pathlib import Path


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_authored(manuscript):
    path = Path(manuscript) / "French-Receipts.json"
    return read_json(path) if path.is_file() else {"passages": {}, "receipts": {}}


def localize_passage(markdown, passages, translate):
    english = "\n\n".join(p["en"] for p in passages)
    if markdown != english and not markdown.startswith(english + "\n\n"):
        raise ValueError(f"Reviewed French passage does not match the English source: {english}")
    french = "\n\n".join(p["fr"] for p in passages)
    rest = translate(markdown[len(english):].lstrip("\n"))
    return "\n\n".join(filter(None, [french, rest]))


def refresh(content, authored):
    for chapter, passages in authored["passages"].items():
        path = Path("chapters") / f"ch{int(chapter):02}.json"
        en, fr = (read_json(content / locale / path) for locale in ("", "fr"))
        sections = dict(zip((s["heading"] for s in en["sections"]), fr["sections"], strict=True))
        for heading, items in passages.items():
            source = next(s["markdown"] for s in en["sections"] if s["heading"] == heading)
            section = sections[heading]
            # Keep the existing translation of the rest of the section.
            count = section.get("authoredParagraphs", 0)
            parts = section["markdown"].split("\n\n", count)
            markdown = parts[count] if len(parts) > count else ""
            section["markdown"] = localize_passage(source, items, lambda _: markdown)
            section["authoredParagraphs"] = len(items)
        write_json(content / "fr" / path, fr)

    en, fr = (read_json(content / locale / "receipts.json") for locale in ("", "fr"))
    english = {str(row["id"]): row for row in en}
    authored_rows = authored["receipts"]
    fr = [row for row in fr if str(row["id"]) not in authored_rows]
    fr.extend({**english[key], **row} for key, row in authored_rows.items())
    write_json(content / "fr" / "receipts.json", fr)


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manuscript", type=Path)
    parser.add_argument("--content", type=Path, help="Refresh one tree before publishing its mirror.")
    args = parser.parse_args()
    authored = load_authored(args.manuscript)
    if not authored["receipts"]:
        parser.error("No authored French receipts found in the manuscript directory.")
    for folder in [args.content] if args.content else [Path("content"), Path("app/public/content")]:
        refresh(folder, authored)
