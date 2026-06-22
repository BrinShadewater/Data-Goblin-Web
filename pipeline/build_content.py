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
    (range(8, 17),  "Part III — Hard Questions",    "The Weather"),
    (range(17, 19), "Part IV — Governance",         "The Map"),
    (range(19, 22), "Part V — Path Forward",        "The Tools"),
]
def part_of(n):
    for rng, part, region in PARTS:
        if n in rng: return part, region
    return "", ""

VERIFY_RE = re.compile(r"<!--\s*VERIFY[^>]*-->")
GOBLIN_RE = re.compile(r"^> \*\*🧌 GOBLIN CHECK[^\n]*(?:\n>[^\n]*)*", re.M)
# Chapter freshness marker, e.g. <!-- STATUS: updated 2026-06-18 -->
# Placed on its own line under "# Chapter N". The reader shows a NEW/UPDATED
# badge in the table of contents; it auto-expires client-side ~30 days after
# the date, so a stale tag never lingers even if the site is not rebuilt.
STATUS_RE = re.compile(r"<!--\s*STATUS:\s*(new|updated)\s+(\d{4}-\d{2}-\d{2})\s*-->", re.I)

SUBTITLE = "A Field Guide to AI, Power, and Data in Canada"

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
    # Freshness marker (NEW/UPDATED badge in the TOC). Read it, then drop it
    # from the body so it never reaches the reader's display text.
    sm = STATUS_RE.search(body)
    status = sm.group(1).lower() if sm else None
    status_date = sm.group(2) if sm else None
    body = STATUS_RE.sub("", body)

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

    # Opener is the first section, whatever its heading says. Chapter opener
    # headings now vary per chapter (de-template pass); the reader still renders
    # this section as the branded "Start Here" trail marker.
    start_here = sections[0]["markdown"] if sections else ""

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
        "sections": sections[1:] if sections else [],
        "goblinChecks": goblin_checks,
        "recap": recap,
        "biasLabel": bias_label,
        "sources": src_list,
        "verifyFlags": verify_flags,
        "status": status,
        "statusDate": status_date,
    }

# ---------------------------------------------------------------------------
# Front matter (ch00) and Source Library Appendix (ch21) — same schema as
# chapters so the app's pagination engine can render them unchanged.
# ---------------------------------------------------------------------------

def _split_on(prefix, text):
    """Split text into (preamble, [{heading, markdown:[lines]}]) on a heading prefix."""
    pre, secs, cur = [], [], None
    for l in text.split("\n"):
        if l.startswith(prefix):
            if cur: secs.append(cur)
            cur = {"heading": l[len(prefix):].strip(), "markdown": []}
        elif cur is None:
            pre.append(l)
        else:
            cur["markdown"].append(l)
    if cur: secs.append(cur)
    return "\n".join(pre), secs

def _clean(md):
    """Strip VERIFY comments and standalone --- rules; collapse extra blank lines."""
    md = VERIFY_RE.sub("", md)
    md = re.sub(r"^\s*---\s*$", "", md, flags=re.M)
    return re.sub(r"\n{3,}", "\n\n", md).strip()

def _goblin_checks(sections):
    checks = []
    for s in sections:
        for m in GOBLIN_RE.finditer(s["markdown"]):
            txt = re.sub(r"^> ?", "", m.group(0), flags=re.M).strip()
            checks.append({"section": s["heading"], "markdown": txt})
    return checks

def parse_front_matter(front):
    """Front matter -> chapter-shaped doc 0. Sections split on '## ' headings;
    the title-page block (title, subtitle heading, byline) becomes startHere;
    the prose '## Table of contents' is skipped (the app has a live TOC)."""
    verify_flags = [v.strip() for v in VERIFY_RE.findall(front)]
    pre, secs = _split_on("## ", front)
    start = _clean(pre)
    # The manuscript subtitle is itself a '## ' heading on line 2 — fold it
    # (and its byline body) back into the title-page block.
    if secs and secs[0]["heading"] == SUBTITLE:
        sub = secs.pop(0)
        body = _clean("\n".join(sub["markdown"]))
        start = f"{start}\n\n## {sub['heading']}" + (f"\n\n{body}" if body else "")
    sections = [
        {"heading": s["heading"], "markdown": _clean("\n".join(s["markdown"]))}
        for s in secs
        if not s["heading"].lower().startswith("table of contents")
    ]
    return {
        "number": 0,
        "title": "Front Matter",
        "part": "Front Matter",
        "region": "The Trailhead",
        "startHere": start.strip(),
        "sections": sections,
        "goblinChecks": _goblin_checks(sections),
        "recap": [],
        "biasLabel": "",
        "sources": [],
        "verifyFlags": verify_flags,
    }

def parse_appendix(appendix):
    """Appendix body (text after the '# Source Library Appendix' line) ->
    chapter-shaped doc 21. Sections split on '### '; the 'How to use this
    appendix' intro becomes startHere (with the byline block prepended)."""
    verify_flags = [v.strip() for v in VERIFY_RE.findall(appendix)]
    pre, secs = _split_on("### ", appendix)
    sub_m = re.search(r"^## (.+)$", pre, flags=re.M)
    subtitle = sub_m.group(1).strip() if sub_m else ""
    byline = _clean(re.sub(r"^##? .*$", "", pre, flags=re.M))
    start_parts = [byline] if byline else []
    sections = []
    intro_found = False
    for s in secs:
        body = _clean("\n".join(s["markdown"]))
        if not intro_found and s["heading"].lower().startswith("how to use this appendix"):
            start_parts.append(body)
            intro_found = True
        else:
            sections.append({"heading": s["heading"], "markdown": body})
    if not intro_found and sections:
        # Fallback: promote the first block of the first section.
        start_parts.append(sections[0]["markdown"].split("\n\n")[0])
    return {
        "number": 22,
        "title": "Source Library Appendix" + (f" — {subtitle}" if subtitle else ""),
        "part": "Back Matter",
        "region": "The Hoard",
        "startHere": "\n\n".join(p for p in start_parts if p).strip(),
        "sections": sections,
        "goblinChecks": _goblin_checks(sections),
        "recap": [],
        "biasLabel": "",
        "sources": [],
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

LINK_LINE_RE = re.compile(r"^- (.+?) — (.+)$", re.M)
URL_RE = re.compile(r"https?://[^\s)\"'<>]+")

def parse_links(appendix, receipts):
    """links.json — [{"name", "url"}] for the app's clickable references.
    Extracted from the appendix's 'Links and URL References' section
    (lines '- Name — https://url'; the first URL on a line wins, entries
    without a public URL are skipped), then merged with the receipts
    ledger's [label](url) pairs. Deduped by case-insensitive name."""
    links, seen = [], set()
    def add(name, url):
        name = name.replace("*", "").strip()
        key = name.lower()
        if not name or not url or key in seen:
            return
        seen.add(key)
        links.append({"name": name, "url": url})
    sec = re.search(r"^### Links and URL References\s*$(.*?)(?=^### |\Z)",
                    appendix, flags=re.M | re.S)
    if sec:
        for lm in LINK_LINE_RE.finditer(sec.group(1)):
            um = URL_RE.search(lm.group(2))
            if um:
                add(lm.group(1), um.group(0).rstrip(".,;"))
    for r in receipts:
        for label, url in r["links"]:
            if url.startswith("http"):
                add(label, url)
    return links

def parse_glossary(text):
    terms = []
    for m in re.finditer(r"^\*\*(.+?)\*\*\s+(.+?)(?=\n\n\*\*|\Z)", text, flags=re.M | re.S):
        term = m.group(1).strip().rstrip(".")
        if term.lower().startswith(("statuses", "chapter recap")):  # safety
            continue
        d = " ".join(m.group(2).split())
        # Optional trailing source link, authored as <https://...> at the very end.
        url = ""
        um = re.search(r"\s*<(https?://[^>]+)>\s*$", d)
        if um:
            url = um.group(1)
            d = d[:um.start()].strip()
        ref = re.search(r"\((Chs?\.[^)]+)\)\s*$", d)
        terms.append({
            "term": term,
            "def": re.sub(r"\((Chs?\.[^)]+)\)\s*$", "", d).strip(),
            "chapters": ref.group(1) if ref else "",
            "letter": term[0].upper(),
            "url": url,
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

    # Front matter (doc 0) and appendix (doc 21) share the chapter schema so
    # the reader paginates them with the same engine. They are NOT added to
    # the 20-chapter parts array — anything counting chapters stays at 20.
    front_doc = parse_front_matter(front)
    appendix_doc = parse_appendix(appendix) if appendix else None
    extra_docs = [front_doc] + ([appendix_doc] if appendix_doc else [])

    # The freshness marker only needs to ride along in book.json (the TOC reads
    # it there). Keep it out of the per-chapter docs so those files don't churn.
    for ch in chapters + extra_docs:
        out_ch = {k: v for k, v in ch.items() if k not in ("status", "statusDate")}
        with open(os.path.join(OUT, "chapters", f"ch{ch['number']:02d}.json"), "w", encoding="utf-8") as f:
            json.dump(out_ch, f, ensure_ascii=False, indent=1)

    book = {
        "title": "Data Goblin",
        "subtitle": SUBTITLE,
        "asOf": "June 2026",
        "frontMatter": {"number": 0, "title": "Front Matter", "region": "The Trailhead"},
        "parts": [{"part": p, "region": r, "chapters": [
                    {"number": c["number"], "title": c["title"],
                     "goblinChecks": len(c["goblinChecks"]),
                     "openVerifyFlags": len(c["verifyFlags"]),
                     **({"status": c["status"], "statusDate": c["statusDate"]}
                        if c.get("status") else {})}
                    for c in chapters if c["number"] in rng]}
                  for rng, p, r in PARTS],
        "backMatter": {"number": 22, "title": "Source Library Appendix", "region": "The Hoard"}
                      if appendix_doc else None,
        "frontmatterMarkdown": VERIFY_RE.sub("", front),
        "appendixMarkdown": VERIFY_RE.sub("", "# Source Library Appendix" + appendix) if appendix else "",
    }
    if book["backMatter"] is None:
        del book["backMatter"]
    json.dump(book, open(os.path.join(OUT, "book.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    receipts = parse_ledger(open(LEDG, encoding="utf-8").read())
    json.dump(receipts, open(os.path.join(OUT, "receipts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # links.json — clickable reference URLs (appendix link list + ledger links).
    # Also copied straight into the app's public content so the reader can
    # fetch it without a separate sync step.
    links = parse_links(appendix, receipts)
    json.dump(links, open(os.path.join(OUT, "links.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    app_content = os.path.normpath(os.path.join(HERE, "..", "app", "public", "content"))
    if os.path.isdir(app_content):
        json.dump(links, open(os.path.join(app_content, "links.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    glossary = parse_glossary(open(GLOS, encoding="utf-8").read())
    json.dump(glossary, open(os.path.join(OUT, "glossary.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    traps_path = os.path.join(ROOT, "Goblin-Traps.md")
    traps = parse_traps(open(traps_path, encoding="utf-8").read()) if os.path.exists(traps_path) else {}
    json.dump(traps, open(os.path.join(OUT, "traps.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"goblin traps: {len(traps)}" + ("" if len(traps) == 20 else "  ← WARN: expected 20"))

    # ---- stats.json — live counts for the About page (single source of truth,
    # so the "by the numbers" cards never drift from the manuscript again) ----
    def _count(pat):
        return len(re.findall(pat, text, flags=re.M))
    # figures = unique base figure srcs registered in the art-map (light-EN; the
    # reader derives the dark/FR variants at runtime).
    figures = 0
    art_map_path = os.path.join(OUT, "art-map.json")
    if os.path.exists(art_map_path):
        am = json.load(open(art_map_path, encoding="utf-8"))
        figs = set()
        for doc in (am.get("docs") or {}).values():
            for panel in doc.get("panels", []) or []:
                src = panel.get("src", "")
                if src.startswith("figures/"):
                    figs.add(src)
        figures = len(figs)
    stats = {
        "chapters": len(chapters),
        "words": f"{round(len(text.split()) / 1000)}k",
        "figures": figures,
        "receipts": len(receipts),
        "links": len(links),
        "glossary": len(glossary),
        "goblinChecks": sum(len(c["goblinChecks"]) for c in chapters),
        "goblinTraps": len(traps),
        "goblinFacts": _count(r"^> \*\*GOBLIN FACT"),
        "alignments": _count(r"^> \*\*ALIGNMENT"),
        "examples": _count(r"^> \*\*EXAMPLE"),
    }
    json.dump(stats, open(os.path.join(OUT, "stats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if os.path.isdir(app_content):
        json.dump(stats, open(os.path.join(app_content, "stats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"stats: {stats}")

    # ---- validation report ----
    print(f"chapters: {len(chapters)}")
    print(f"front matter (ch00): {len(front_doc['sections'])} sections — "
          + "; ".join(s["heading"] for s in front_doc["sections"]))
    if appendix_doc:
        print(f"appendix (ch{appendix_doc['number']:02d}): {len(appendix_doc['sections'])} sections — "
              + "; ".join(s["heading"].split(".")[0] for s in appendix_doc["sections"]))
    else:
        print("WARN: no appendix found — ch20.json not emitted")
    print(f"goblin checks total: {sum(len(c['goblinChecks']) for c in chapters)}")
    print(f"recap chapters: {sum(1 for c in chapters if c['recap'])} (bullets: {sum(len(c['recap']) for c in chapters)})")
    print(f"verify flags remaining: {sum(len(c['verifyFlags']) for c in chapters)}")
    print(f"bias labels found: {sum(1 for c in chapters if c['biasLabel'])}")
    print(f"source blocks found: {sum(1 for c in chapters if c['sources'])}")
    print(f"receipts rows: {len(receipts)} | glossary terms: {len(glossary)}")
    print(f"reference links extracted: {len(links)}")
    missing = [c["number"] for c in chapters if not c["startHere"]]
    if missing: print("WARN: chapters missing Start here:", missing)

if __name__ == "__main__":
    main()
