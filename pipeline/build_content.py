#!/usr/bin/env python3
"""
DATA GOBLIN content pipeline
Parses the manuscript, Receipts Ledger, and Glossary into JSON for the
interactive edition (schema matched to the Figma Make mockup components).

Run from anywhere:  python3 build_content.py
Outputs to:         ../content/*.json
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
MS   = os.path.join(ROOT, "DataGoblin-Complete.md")
LEDG = os.path.join(ROOT, "Receipts-Ledger.md")
GLOS = os.path.join(ROOT, "Glossary-Draft.md")
OUT  = os.path.normpath(os.path.join(HERE, "..", "content"))
os.makedirs(os.path.join(OUT, "chapters"), exist_ok=True)

# Part / region mapping (region names from the mockup TOC — editable)
PARTS = [
    (range(1, 5),   "Part I — Foundations",        "The Land"),
    (range(5, 8),   "Part II — Canadian Landscape", "The Creatures"),
    (range(8, 15),  "Part III — Hard Questions",    "The Weather"),
    (range(15, 17), "Part IV — Governance",         "The Map"),
    (range(17, 20), "Part V — Path Forward",        "The Tools"),
]
def part_of(n):
    for rng, part, region in PARTS:
        if n in rng: return part, region
    return "", ""

VERIFY_RE = re.compile(r"<!--\s*VERIFY[^>]*-->")

def split_chapters(text):
    """Return (frontmatter, [(num, body)], appendix)."""
    parts = re.split(r"^# Chapter (\d+)\s*$", text, flags=re.M)
    front = parts[0]
    chapters = []
    for i in range(1, len(parts), 2):
        num, body = int(parts[i]), parts[i + 1]
        chapters.append((num, body))
    # appendix lives at the tail of chapter 19's split
    last_num, last_body = chapters[-1]
    if "# Source Library Appendix" in last_body:
        last_body, appendix = last_body.split("# Source Library Appendix", 1)
        chapters[-1] = (last_num, last_body)
    else:
        appendix = ""
    return front, chapters, appendix

def parse_chapter(num, body):
    lines = body.split("\n")
    # Title = first '## ' line
    title = next((l[3:].strip() for l in lines if l.startswith("## ")), f"Chapter {num}")
    part, region = part_of(num)

    # Sections on '### '
    sections, cur = [], None
    for l in lines:
        if l.startswith("### "):
            if cur: sections.append(cur)
            cur = {"heading": l[4:].strip(), "markdown": []}
        elif cur is not None:
            cur["markdown"].append(l)
    if cur: sections.append(cur)

    goblin_checks, recap, verify_flags = [], [], []
    bias_label, primary_sources = "", ""

    for s in sections:
        md = "\n".join(s["markdown"]).strip()
        # collect verify flags then strip from display text
        verify_flags += [v.strip() for v in VERIFY_RE.findall(md)]
        md = VERIFY_RE.sub("", md)

        # goblin checks (blockquote paragraphs starting with the marker)
        for m in re.finditer(r"^> \*\*🧌 GOBLIN CHECK[^\n]*(?:\n>[^\n]*)*", md, flags=re.M):
            txt = re.sub(r"^> ?", "", m.group(0), flags=re.M).strip()
            goblin_checks.append({"section": s["heading"], "markdown": txt})

        # recap box bullets
        for m in re.finditer(r"^> - (.+)$", md, flags=re.M):
            if "CHAPTER RECAP" in md:
                recap.append(m.group(1).strip())

        # bias label + sources live in trailing italic paragraphs
        for para in md.split("\n\n"):
            p = para.strip()
            if p.startswith("*Bias label for this chapter:"):
                bias_label = p.strip("*").strip()
            elif p.startswith("*Primary sources cited"):
                primary_sources = p.strip("*").strip()

        s["markdown"] = md

    start_here = next((s["markdown"] for s in sections if s["heading"].lower().startswith("start here")), "")

    # sources -> list of strings for the Show Receipts panel
    src_list = []
    if primary_sources:
        body_src = re.sub(r"^Primary sources cited or relied on in this chapter:\s*", "", primary_sources)
        body_src = re.sub(r"\s*Detailed citations in the Sources appendix\.?$", "", body_src)
        src_list = [x.strip() for x in body_src.split(";") if x.strip()]

    return {
        "number": num,
        "title": title,
        "part": part,
        "region": region,
        "startHere": start_here,
        "sections": [s for s in sections if not s["heading"].lower().startswith("start here")],
        "goblinChecks": goblin_checks,
        "recap": recap,
        "biasLabel": bias_label,
        "sources": src_list,
        "verifyFlags": verify_flags,
    }

def parse_ledger(text):
    rows, section = [], ""
    for l in text.split("\n"):
        if l.startswith("## "):
            section = l[3:].strip()
        m = re.match(r"^\|\s*(\d+)\s*\|(.+)\|$", l)
        if m:
            cells = [c.strip() for c in m.group(2).split("|")]
            row = {"id": int(m.group(1)), "section": section, "claim": cells[0]}
            rest = " | ".join(cells[1:])
            row["status"] = ("resolved" if "✅" in rest or "RESOLVED" in rest
                             else "open" if section.startswith("C.") else "fixed")
            row["detail"] = rest
            row["links"] = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", rest)
            rows.append(row)
    return rows

def parse_glossary(text):
    terms = []
    for m in re.finditer(r"^\*\*(.+?)\*\*\s+(.+?)(?=\n\n\*\*|\Z)", text, flags=re.M | re.S):
        term = m.group(1).strip().rstrip(".")
        if term.lower().startswith(("statuses", "chapter recap")):  # safety
            continue
        d = " ".join(m.group(2).split())
        ref = re.search(r"\((Chs?\.[^)]+)\)\s*$", d)
        terms.append({
            "term": term,
            "def": re.sub(r"\((Chs?\.[^)]+)\)\s*$", "", d).strip(),
            "chapters": ref.group(1) if ref else "",
            "letter": term[0].upper(),
        })
    return terms

def parse_traps(text):
    traps = {}
    for m in re.finditer(
        r"^## Chapter (\d+) — (.+?)\n\n\*\*TRAP: (.+?)\*\*\n(.+?)(?=\n## Chapter |\Z)",
        text, flags=re.M | re.S):
        num = int(m.group(1))
        traps[num] = {
            "chapter": num,
            "chapterTitle": m.group(2).strip(),
            "trapTitle": m.group(3).strip(),
            "text": " ".join(m.group(4).split()),
        }
    return traps

def main():
    text = open(MS, encoding="utf-8").read()
    front, raw_chapters, appendix = split_chapters(text)

    chapters = [parse_chapter(n, b) for n, b in raw_chapters]
    for ch in chapters:
        with open(os.path.join(OUT, "chapters", f"ch{ch['number']:02d}.json"), "w", encoding="utf-8") as f:
            json.dump(ch, f, ensure_ascii=False, indent=1)

    book = {
        "title": "Data Goblin",
        "subtitle": "A Field Guide to AI, Power, and Data in Canada",
        "asOf": "June 2026",
        "parts": [{"part": p, "region": r, "chapters": [
                    {"number": c["number"], "title": c["title"],
                     "goblinChecks": len(c["goblinChecks"]),
                     "openVerifyFlags": len(c["verifyFlags"])}
                    for c in chapters if c["number"] in rng]}
                  for rng, p, r in PARTS],
        "frontmatterMarkdown": VERIFY_RE.sub("", front),
        "appendixMarkdown": VERIFY_RE.sub("", "# Source Library Appendix" + appendix) if appendix else "",
    }
    json.dump(book, open(os.path.join(OUT, "book.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    receipts = parse_ledger(open(LEDG, encoding="utf-8").read())
    json.dump(receipts, open(os.path.join(OUT, "receipts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    glossary = parse_glossary(open(GLOS, encoding="utf-8").read())
    json.dump(glossary, open(os.path.join(OUT, "glossary.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    traps_path = os.path.join(ROOT, "Goblin-Traps.md")
    traps = parse_traps(open(traps_path, encoding="utf-8").read()) if os.path.exists(traps_path) else {}
    json.dump(traps, open(os.path.join(OUT, "traps.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"goblin traps: {len(traps)}" + ("" if len(traps) == 19 else "  ← WARN: expected 19"))

    # ---- validation report ----
    print(f"chapters: {len(chapters)}")
    print(f"goblin checks total: {sum(len(c['goblinChecks']) for c in chapters)}")
    print(f"recap chapters: {sum(1 for c in chapters if c['recap'])} (bullets: {sum(len(c['recap']) for c in chapters)})")
    print(f"verify flags remaining: {sum(len(c['verifyFlags']) for c in chapters)}")
    print(f"bias labels found: {sum(1 for c in chapters if c['biasLabel'])}")
    print(f"source blocks found: {sum(1 for c in chapters if c['sources'])}")
    print(f"receipts rows: {len(receipts)} | glossary terms: {len(glossary)}")
    missing = [c["number"] for c in chapters if not c["startHere"]]
    if missing: print("WARN: chapters missing Start here:", missing)

if __name__ == "__main__":
    main()
