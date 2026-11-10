"""Apply reviewed French passages and receipts from the private manuscript.

Run from the site root with `python pipeline/authored_fr.py PATH_TO_MANUSCRIPT`
to refresh the checked-in French edition without rerunning machine translation.
"""

import argparse
import json
import re
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


def localize_blocks(english, french, reviewed, matched=None):
    source = english.split("\n\n")
    localized = french.split("\n\n")
    replacements = {index: reviewed[block] for index, block in enumerate(source) if block in reviewed}
    if replacements and len(source) != len(localized):
        raise ValueError("English and French content blocks are no longer aligned")
    for index, block in replacements.items():
        localized[index] = block
        if matched is not None:
            matched.add(source[index])
    return "\n\n".join(localized)


def localize_front_chapter(english, french, reviewed):
    french["startHere"] = localize_blocks(english["startHere"], french["startHere"], reviewed)
    for source, localized in zip(english["sections"], french["sections"], strict=True):
        localized["markdown"] = localize_blocks(source["markdown"], localized["markdown"], reviewed)


def sync_recap(chapter):
    """Use the reviewed recap bullets in the inline reader callout too."""
    if not chapter["recap"]:
        return
    callout = re.compile(r"(?m)(^>[^\n]*CHAPTER RECAP[^\n]*\n)((?:>[^\n]*\n?)+)")
    bullet = re.compile(r"(?m)^> - [^\n]*")
    matches = [
        (section, match)
        for section in chapter["sections"]
        for match in callout.finditer(section["markdown"])
    ]
    if len(matches) != 1:
        raise ValueError(f"French Chapter {chapter['number']} needs exactly one recap callout")
    section, match = matches[0]
    if len(bullet.findall(match[2])) != len(chapter["recap"]):
        raise ValueError(f"French Chapter {chapter['number']} recap bullet counts differ")
    entries = iter(chapter["recap"])
    body = bullet.sub(lambda _: "> - " + next(entries), match[2])
    section["markdown"] = section["markdown"][:match.start(2)] + body + section["markdown"][match.end(2):]


def localize_chapter_blocks(english, french, reviewed):
    matched = set()
    for field in ("startHere", "biasLabel"):
        french[field] = localize_blocks(english[field], french[field], reviewed, matched)
    for field in ("sections", "goblinChecks"):
        for source, localized in zip(english[field], french[field], strict=True):
            localized["markdown"] = localize_blocks(source["markdown"], localized["markdown"], reviewed, matched)
            if field == "sections":
                localized["heading"] = localize_blocks(source["heading"], localized["heading"], reviewed, matched)
    french["recap"] = [
        localize_blocks(source, localized, reviewed, matched)
        for source, localized in zip(english["recap"], french["recap"], strict=True)
    ]
    if matched != reviewed.keys():
        raise ValueError(f"Reviewed French Chapter {english['number']} has a stale English source block")
    sync_recap(french)


def refresh(content, authored):
    reviewed = authored.get("frontMatter", {})
    if reviewed:
        for path in (Path("book.json"), Path("chapters/ch00.json")):
            en, fr = (read_json(content / locale / path) for locale in ("", "fr"))
            if path.name == "book.json":
                fr["frontmatterMarkdown"] = localize_blocks(
                    en["frontmatterMarkdown"], fr["frontmatterMarkdown"], reviewed
                )
            else:
                localize_front_chapter(en, fr, reviewed)
            write_json(content / "fr" / path, fr)

    for chapter, blocks in authored.get("chapterBlocks", {}).items():
        path = Path("chapters") / f"ch{int(chapter):02}.json"
        en, fr = (read_json(content / locale / path) for locale in ("", "fr"))
        localize_chapter_blocks(en, fr, blocks)
        write_json(content / "fr" / path, fr)
        if chapter == "22":
            en_book, fr_book = (read_json(content / locale / "book.json") for locale in ("", "fr"))
            fr_book["appendixMarkdown"] = localize_blocks(
                en_book["appendixMarkdown"], fr_book["appendixMarkdown"],
                {**blocks, **authored.get("appendixBookBlocks", {})},
            )
            write_json(content / "fr/book.json", fr_book)

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
