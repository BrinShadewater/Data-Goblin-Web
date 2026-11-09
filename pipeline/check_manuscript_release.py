"""Compare selected website content with the private manuscript, read-only."""

import argparse
import sys
from pathlib import Path

from authored_fr import localize_passage, read_json
from build_content import chapter_output, parse_chapter, parse_ledger, split_chapters


def receipt_row(rows, receipt_id):
    matches = [row for row in rows if row["id"] == receipt_id]
    return matches[0] if len(matches) == 1 else None


def check(manuscript, website, chapter_numbers, receipt_ids):
    authored = read_json(manuscript / "French-Receipts.json")
    _, chapters, _ = split_chapters((manuscript / "DataGoblin-Complete.md").read_text(encoding="utf-8"))
    chapter_bodies = dict(chapters)
    ledger = parse_ledger((manuscript / "Receipts-Ledger.md").read_text(encoding="utf-8"))
    expected_chapters = {
        number: chapter_output(parse_chapter(number, chapter_bodies[number]))
        for number in chapter_numbers
    }
    expected_receipts = {receipt_id: receipt_row(ledger, receipt_id) for receipt_id in receipt_ids}
    for receipt_id, row in expected_receipts.items():
        if row is None:
            raise ValueError(f"Manuscript receipt #{receipt_id} is missing or duplicated")
        row["links"] = [list(link) for link in row["links"]]

    reviewed_receipts = authored["receipts"]
    errors = []
    for directory in ("content", "app/public/content"):
        root = website / directory
        for number, expected in expected_chapters.items():
            relative = f"chapters/ch{number:02}.json"
            if read_json(root / relative) != expected:
                errors.append(f"{directory}/{relative}: English Chapter {number} differs from the manuscript")
            reviewed = authored["passages"].get(str(number), {})
            if not reviewed:
                continue
            french = read_json(root / "fr" / relative)
            sections = french["sections"]
            if len(sections) != len(expected["sections"]):
                errors.append(f"{directory}/fr/{relative}: French Chapter {number} section count differs")
                continue
            positions = {section["heading"]: index for index, section in enumerate(expected["sections"])}
            for heading, passages in reviewed.items():
                index = positions[heading]
                source = expected["sections"][index]["markdown"]
                prefix = localize_passage(source, passages, lambda _: "")
                published = sections[index]
                markdown = published["markdown"]
                if published.get("authoredParagraphs") != len(passages) or (
                    markdown != prefix and not markdown.startswith(prefix + "\n\n")
                ):
                    errors.append(f"{directory}/fr/{relative}: French Chapter {number}, {heading}, differs from the reviewed manuscript")

        english = read_json(root / "receipts.json") if receipt_ids else []
        french = read_json(root / "fr/receipts.json") if any(str(i) in reviewed_receipts for i in receipt_ids) else []
        for receipt_id, expected in expected_receipts.items():
            if receipt_row(english, receipt_id) != expected:
                errors.append(f"{directory}/receipts.json: English receipt #{receipt_id} differs from the manuscript")
            reviewed = reviewed_receipts.get(str(receipt_id))
            if reviewed and receipt_row(french, receipt_id) != {**expected, **reviewed}:
                errors.append(f"{directory}/fr/receipts.json: French receipt #{receipt_id} differs from the reviewed manuscript")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manuscript", type=Path, help="Private manuscript checkout")
    parser.add_argument("--website", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--chapter", type=int, action="append", default=[], help="Chapter number, repeatable")
    parser.add_argument("--receipt", type=int, action="append", default=[], help="Receipt ID, repeatable")
    args = parser.parse_args()
    if not (args.chapter or args.receipt):
        parser.error("Select at least one --chapter or --receipt.")
    try:
        errors = check(args.manuscript, args.website, sorted(set(args.chapter)), sorted(set(args.receipt)))
    except (OSError, KeyError, ValueError) as error:
        print(f"Cannot verify manuscript release: {error}", file=sys.stderr)
        return 1
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Manuscript release check passed for both website copies (English and available reviewed French source).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
