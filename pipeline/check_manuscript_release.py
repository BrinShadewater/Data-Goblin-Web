"""Compare selected website content with the private manuscript, read-only."""

import argparse
import sys
from copy import deepcopy
from pathlib import Path

from authored_fr import localize_blocks, localize_chapter_blocks, localize_front_chapter, localize_passage, read_json, sync_recap
from build_content import VERIFY_RE, chapter_output, parse_appendix, parse_chapter, parse_front_matter, parse_ledger, split_chapters


def receipt_row(rows, receipt_id):
    matches = [row for row in rows if row["id"] == receipt_id]
    return matches[0] if len(matches) == 1 else None


def check(manuscript, website, chapter_numbers, receipt_ids):
    authored = read_json(manuscript / "French-Receipts.json")
    front, chapters, appendix = split_chapters((manuscript / "DataGoblin-Complete.md").read_text(encoding="utf-8"))
    chapter_bodies = dict(chapters)
    ledger = parse_ledger((manuscript / "Receipts-Ledger.md").read_text(encoding="utf-8"))
    expected_chapters = {}
    for number in chapter_numbers:
        if number == 0:
            chapter = parse_front_matter(front)
        elif number == 22:
            chapter = parse_appendix(appendix)
        else:
            chapter = parse_chapter(number, chapter_bodies[number])
        expected_chapters[number] = chapter_output(chapter)
    expected_receipts = {receipt_id: receipt_row(ledger, receipt_id) for receipt_id in receipt_ids}
    for receipt_id, row in expected_receipts.items():
        if row is None:
            raise ValueError(f"Manuscript receipt #{receipt_id} is missing or duplicated")
        row["links"] = [list(link) for link in row["links"]]

    reviewed_receipts = authored["receipts"]
    errors = []
    for directory in ("content", "app/public/content"):
        root = website / directory
        if 0 in expected_chapters:
            english_front = VERIFY_RE.sub("", front)
            if read_json(root / "book.json")["frontmatterMarkdown"] != english_front:
                errors.append(f"{directory}/book.json: English front matter differs from the manuscript")
            reviewed_front = authored.get("frontMatter", {})
            if reviewed_front:
                if not reviewed_front.keys() <= set(english_front.split("\n\n")):
                    raise ValueError("Reviewed French front matter has a stale English source block")
                french_front = read_json(root / "fr/book.json")["frontmatterMarkdown"]
                if localize_blocks(english_front, french_front, reviewed_front) != french_front:
                    errors.append(f"{directory}/fr/book.json: French front matter differs from the reviewed manuscript")
                french_chapter = read_json(root / "fr/chapters/ch00.json")
                expected_french = deepcopy(french_chapter)
                localize_front_chapter(expected_chapters[0], expected_french, reviewed_front)
                if expected_french != french_chapter:
                    errors.append(f"{directory}/fr/chapters/ch00.json: French front matter differs from the reviewed manuscript")
        for number, expected in expected_chapters.items():
            relative = f"chapters/ch{number:02}.json"
            if read_json(root / relative) != expected:
                errors.append(f"{directory}/{relative}: English Chapter {number} differs from the manuscript")
            french = read_json(root / "fr" / relative)
            synced_french = deepcopy(french)
            sync_recap(synced_french)
            if synced_french != french:
                errors.append(f"{directory}/fr/{relative}: inline French recap differs from the recap list")
            reviewed = authored["passages"].get(str(number), {})
            reviewed_blocks = authored.get("chapterBlocks", {}).get(str(number), {})
            if number == 22:
                english_appendix = VERIFY_RE.sub("", "# Source Library Appendix" + appendix)
                if read_json(root / "book.json")["appendixMarkdown"] != english_appendix:
                    errors.append(f"{directory}/book.json: English appendix differs from the manuscript")
                reviewed_appendix = {**reviewed_blocks, **authored.get("appendixBookBlocks", {})}
                if reviewed_appendix:
                    if not authored.get("appendixBookBlocks", {}).keys() <= set(english_appendix.split("\n\n")):
                        raise ValueError("Reviewed French appendix has a stale English source block")
                    french_appendix = read_json(root / "fr/book.json")["appendixMarkdown"]
                    if localize_blocks(english_appendix, french_appendix, reviewed_appendix) != french_appendix:
                        errors.append(f"{directory}/fr/book.json: French appendix differs from the reviewed manuscript")
            if not (reviewed or reviewed_blocks):
                continue
            if reviewed_blocks:
                expected_french = deepcopy(french)
                localize_chapter_blocks(expected, expected_french, reviewed_blocks)
                if expected_french != french:
                    errors.append(f"{directory}/fr/{relative}: French Chapter {number} differs from the reviewed manuscript")
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
