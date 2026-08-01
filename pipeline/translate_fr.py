#!/usr/bin/env python3
"""
translate_fr.py - Build the French (machine-translated) edition of Data Goblin.

Reads the English content JSON in app/public/content/ and writes a parallel
French tree to app/public/content/fr/. Translation is CPU-only OPUS-MT
(en->fr) via CTranslate2 + SentencePiece (no torch). Markdown structure and
the renderer's callout markers are masked-and-restored so they survive MT.

This produces a *machine-translated* edition, labelled "under review" in the
UI. It is not a hand translation. Re-run with:  python pipeline/translate_fr.py
[targets...]  where targets are e.g. book ch00 chapters glossary receipts traps

Toolchain (see FRENCH-EDITION-HANDOFF.md):
  pip install ctranslate2 sentencepiece
  Argos en_fr model unpacked at $DG_MT_MODEL (model/ + sentencepiece.model)
"""
import os, re, sys, json, glob, time, hashlib

MODEL_DIR = os.environ.get("DG_MT_MODEL", "/tmp/en_fr_pkg/translate-en_fr-1_9")
SRC = os.environ.get("DG_CONTENT_SRC", "app/public/content")
OUT = os.environ.get("DG_CONTENT_OUT", "app/public/content/fr")

import ctranslate2, sentencepiece as spm

_sp = spm.SentencePieceProcessor(model_file=f"{MODEL_DIR}/sentencepiece.model")
_tr = ctranslate2.Translator(f"{MODEL_DIR}/model", device="cpu",
                             inter_threads=max(2, os.cpu_count() or 2))

# Callout marker keywords that MUST survive verbatim or the renderer stops
# detecting the callout (see app/src/components/MarkdownCallouts.tsx).
CALLOUT_KEYWORDS = ["\U0001f9cc GOBLIN CHECK", "\U0001f4e6 CHAPTER RECAP",
                    "GOBLIN CHECK", "CHAPTER RECAP",
                    "GOBLIN FACTS", "GOBLIN FACT", "EXAMPLE", "ALIGNMENT"]

_SENT_RE = re.compile(r'(?<=[.!?])\s+')
_cache = {}
_collect = None   # when a set(), _t_core only records sentences (no MT)
BEAM = int(os.environ.get("DG_MT_BEAM", "2"))

def _detok(toks):
    return "".join(toks).replace("▁", " ").strip()

def _t_core(text):
    """Two-mode core. Collect mode: record sentences that need MT. Real mode:
    substitute from the cache (filled by one batched pass). Sentinels pass
    through verbatim either way."""
    if not text.strip():
        return text
    sents = [p for p in _SENT_RE.split(text.strip()) if p]
    # Only translate sentences that contain actual words. A fragment that is
    # just a sentinel/number/punctuation (e.g. a line that is only a masked
    # URL) must never be sent to MT — the model mangles context-free tokens.
    def needs(s): return bool(re.search(r'[A-Za-z]', s))
    if _collect is not None:
        for s in sents:
            if needs(s) and s not in _cache:
                _collect.add(s)
        return text
    return " ".join(_cache.get(s, s) if needs(s) else s for s in sents)

_SENT_TOK = re.compile(r'XQZ\d+ZQX')

def _mt_one(text, beam=None):
    return _detok(_tr.translate_batch([_sp.encode(text, out_type=str)],
                                      beam_size=beam or BEAM)[0].hypotheses[0])

def _sentinels_ok(src, out):
    """Every sentinel in src appears exactly once in out, and no stray '@'."""
    want = _SENT_TOK.findall(src)
    if any(out.count(t) != 1 for t in want):
        return False
    # no fragmentary/mangled sentinel parts left over
    return out.count("XQZ") == len(want) and out.count("ZQX") == len(want)

def _seg_translate(s):
    """Guaranteed-safe fallback: split on sentinels and translate only the
    word-segments, so protected spans are never handed to MT."""
    parts = re.split(r'(XQZ\d+ZQX)', s)
    out = []
    for part in parts:
        if _SENT_TOK.fullmatch(part) or not re.search(r'[A-Za-z]', part):
            out.append(part)
        else:
            lead = " " if part[:1] == " " else ""
            trail = " " if part[-1:] == " " else ""
            out.append(lead + _mt_one(part.strip()) + trail)
    return "".join(out)

def _flush_batch():
    """Translate every collected sentence in one batched CPU pass, then repair
    any sentence where MT dropped/mangled a sentinel."""
    todo = [s for s in _collect if s not in _cache]
    if not todo:
        return
    res = _tr.translate_batch([_sp.encode(s, out_type=str) for s in todo],
                              beam_size=BEAM, max_batch_size=64)
    for s, r in zip(todo, res):
        fr = _detok(r.hypotheses[0])
        if not _sentinels_ok(s, fr):
            fr = _mt_one(s, beam=5)               # 1st repair: stronger beam
            if not _sentinels_ok(s, fr):
                fr = _seg_translate(s)            # 2nd repair: segment split (guaranteed)
        _cache[s] = fr

def _batched(fn, *args):
    """Run fn in collect mode, batch-translate, then run for real."""
    global _collect
    _collect = set()
    fn(*args)            # populate _collect (output discarded)
    _flush_batch()
    _collect = None
    return fn(*args)     # cache hits only

def _t_inline(text, is_callout=False):
    """Translate inline markdown, masking structure that must not be MT'd."""
    if not text.strip():
        return text
    store = []
    def mask(lit):
        store.append(lit)
        return f" XQZ{len(store)-1}ZQX "
    # 1. images (kept verbatim, incl. alt text)
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', lambda m: mask(m.group(0)), text)
    # 2. links: translate anchor text, keep URL, rebuild, then mask whole
    def link_repl(m):
        anchor, url = m.group(1), m.group(2)
        return mask(f"[{_t_inline(anchor)}]({url})")
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link_repl, text)
    # 3. inline code
    text = re.sub(r'`[^`]+`', lambda m: mask(m.group(0)), text)
    # 4. bare URLs
    text = re.sub(r'https?://\S+', lambda m: mask(m.group(0)), text)
    # 5. callout marker keywords (only on callout lines) - verbatim
    if is_callout:
        for kw in CALLOUT_KEYWORDS:
            text = re.sub(re.escape(kw), lambda m: mask(m.group(0)), text)
    # 6. emphasis: translate inner, rebuild markers (bold before italic)
    text = re.sub(r'\*\*(.+?)\*\*', lambda m: mask("**" + _t_core(m.group(1)) + "**"), text)
    text = re.sub(r'(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)', lambda m: mask("*" + _t_core(m.group(1)) + "*"), text)
    # translate the remaining prose
    out = _t_core(text)
    # restore (reverse order so @@10@@ isn't clobbered by @@1@@)
    for i in range(len(store) - 1, -1, -1):
        tok = f"XQZ{i}ZQX"
        if _collect is None and out.count(tok) != 1:
            raise ValueError(f"sentinel {tok} corrupted/lost (found {out.count(tok)}x) | {text!r}")
        out = out.replace(tok, store[i])
    # 'XQZ'/'ZQX' never occur in the English source, so any residual fragment
    # means MT mangled a sentinel -> fail loudly rather than ship a broken span.
    if _collect is None and ("XQZ" in out or "ZQX" in out):
        raise ValueError(f"residual sentinel fragment after restore | {out!r}")
    return out

def _is_callout_line(content):
    u = content.lstrip("*_ ").upper()
    return (u.startswith(("GOBLIN CHECK", "CHAPTER RECAP", "GOBLIN FACT",
                          "EXAMPLE", "ALIGNMENT"))
            or "GOBLIN CHECK" in content.upper()
            or "CHAPTER RECAP" in content.upper())

def _translate_line(line):
    m = re.match(r'^(\s*)(.*)$', line, re.S)
    indent, rest = m.group(1), m.group(2)
    bq = ""
    mq = re.match(r'^((?:>\s?)+)(.*)$', rest, re.S)
    if mq:
        bq, rest = mq.group(1), mq.group(2)
    # table row
    if rest.startswith("|") and rest.rstrip().endswith("|"):
        if re.match(r'^\|[\s:\-|]+\|?\s*$', rest):   # separator row
            return line
        cells = rest.split("|")
        for i, cell in enumerate(cells):
            if cell.strip():
                cells[i] = " " + _t_inline(cell.strip()) + " "
        return indent + bq + "|".join(cells)
    # heading
    mh = re.match(r'^(#{1,6}\s+)(.*)$', rest, re.S)
    if mh:
        return indent + bq + mh.group(1) + _t_inline(mh.group(2))
    # list marker
    prefix = ""
    ml = re.match(r'^([-*+]\s+|\d+\.\s+)(.*)$', rest, re.S)
    if ml:
        prefix, rest = ml.group(1), ml.group(2)
    is_callout = _is_callout_line(rest)  # markers also live in non-blockquote fields (goblinChecks[])
    return indent + bq + prefix + _t_inline(rest, is_callout=is_callout)

def translate_markdown(md):
    if not md or not md.strip():
        return md
    out, in_code = [], False
    for line in md.split("\n"):
        st = line.strip()
        if st.startswith("```"):
            in_code = not in_code; out.append(line); continue
        if in_code or st == "":
            out.append(line); continue
        out.append(_translate_line(line))
    return "\n".join(out)

# ----- field-level helpers ---------------------------------------------------
_FR_PROTECT = ["\U0001f9cc GOBLIN CHECK", "GOBLIN CHECK", "CHAPTER RECAP",
               "GOBLIN FACTS", "GOBLIN FACT", "GOBLIN TRAP", "Data Goblin", "AI for All"]
_FR_PROT_RE = re.compile("|".join(re.escape(p) for p in sorted(_FR_PROTECT, key=len, reverse=True)))

def _post_fr(text):
    """Deterministic terminology correction applied after MT: lean->biais,
    goblin->gobelin, AI->IA — while protecting brand, callout keywords, URLs,
    inline code, images, and the datagoblin domain. Idempotent."""
    if not isinstance(text, str) or not text.strip():
        return text
    store = []
    def mask(m):
        store.append(m.group(0)); return "\x01%dZ" % (len(store) - 1)
    text = re.sub(r"`[^`]*`", mask, text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", mask, text)
    text = re.sub(r"https?://\S+", mask, text)
    text = _FR_PROT_RE.sub(mask, text)
    text = re.sub(r"datagoblin", mask, text, flags=re.I)
    text = re.sub(r"\bAI\b", "IA", text)
    text = text.replace("Goblin", "Gobelin").replace("goblin", "gobelin").replace("GOBLIN", "GOBELIN")
    text = re.sub(r"\bsources maigres\b", "sources orientées", text)
    text = re.sub(r"\bsource maigre\b", "source orientée", text)
    text = re.sub(r"\bmaigres?\b", "biais", text)
    for i in range(len(store) - 1, -1, -1):
        text = text.replace("\x01%dZ" % i, store[i])
    return text

def tr_text(s):
    return _post_fr(translate_markdown(s)) if isinstance(s, str) else s

def translate_book(b):
    b = json.loads(json.dumps(b))  # deep copy
    b["subtitle"] = tr_text(b.get("subtitle", ""))   # title kept (masthead brand)
    b["asOf"] = tr_text(b.get("asOf", ""))
    for key in ("frontMatter", "backMatter"):
        if isinstance(b.get(key), dict):
            for f in ("title", "region"):
                if f in b[key]:
                    b[key][f] = tr_text(b[key][f])
    for part in b.get("parts", []):
        if "part" in part:   part["part"] = tr_text(part["part"])
        if "region" in part: part["region"] = tr_text(part["region"])
        for ch in part.get("chapters", []):
            if "title" in ch: ch["title"] = tr_text(ch["title"])
    for f in ("frontmatterMarkdown", "appendixMarkdown"):
        if f in b: b[f] = tr_text(b[f])
    return b

def translate_chapter(d):
    d = json.loads(json.dumps(d))
    for f in ("title", "part", "region", "startHere", "biasLabel"):
        if isinstance(d.get(f), str):
            d[f] = tr_text(d[f])
    for sec in d.get("sections", []):
        if "heading" in sec: sec["heading"] = tr_text(sec["heading"])
        if "markdown" in sec: sec["markdown"] = tr_text(sec["markdown"])
    for g in d.get("goblinChecks", []):
        if "markdown" in g: g["markdown"] = tr_text(g["markdown"])
    if isinstance(d.get("recap"), list):
        d["recap"] = [tr_text(x) if isinstance(x, str) else x for x in d["recap"]]
    # sources[] left in original language (citations / proper nouns)
    return d

def translate_glossary(arr):
    arr = json.loads(json.dumps(arr))
    for e in arr:
        if "term" in e: e["term"] = tr_text(e["term"])
        if "def" in e:  e["def"] = tr_text(e["def"])
    return arr

def translate_receipts(arr):
    arr = json.loads(json.dumps(arr))
    for e in arr:
        if "claim" in e:  e["claim"] = tr_text(e["claim"])
        if "detail" in e: e["detail"] = tr_text(e["detail"])
    return arr

def translate_traps(obj):
    obj = json.loads(json.dumps(obj))
    for k, v in obj.items():
        if isinstance(v, dict):
            if "chapterTitle" in v: v["chapterTitle"] = tr_text(v["chapterTitle"])
            if "trapTitle" in v: v["trapTitle"] = tr_text(v["trapTitle"])
            if "text" in v:      v["text"] = tr_text(v["text"])
    return obj

_CORRECTIONS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                 "fr-corrections.json")

def _load_corrections():
    """Hand corrections for MT output, keyed by output file (see the readme in
    fr-corrections.json). These exist for cases where MT changed a FACT, not
    just the phrasing — a wrong number in a sentence a receipt points at cannot
    be left standing in a book whose argument is that its claims are checkable."""
    try:
        with open(_CORRECTIONS_PATH, encoding="utf-8") as f:
            return json.load(f).get("corrections", [])
    except FileNotFoundError:
        return []

def _apply_corrections(rel_path, data):
    """Literal find/replace over string values, scoped to one output file."""
    fixes = [c for c in _load_corrections()
             if c.get("file", "").replace("\\", "/") == rel_path.replace("\\", "/")]
    if not fixes:
        return data, 0
    n = 0
    def walk(o):
        nonlocal n
        if isinstance(o, str):
            s = o
            for c in fixes:
                if c["find"] in s:
                    s = s.replace(c["find"], c["replace"])
                    n += 1
            return s
        if isinstance(o, list):
            return [walk(v) for v in o]
        if isinstance(o, dict):
            return {k: walk(v) for k, v in o.items()}
        return o
    return walk(data), n

def _write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    rel = os.path.relpath(path, OUT).replace("\\", "/")
    data, n = _apply_corrections(rel, data)
    if n:
        print(f"  [corrections] {rel}: applied {n}")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

# ----- change detection ------------------------------------------------------
# A full resync retranslates all ~23 docs (~7 min). Most edits touch one chapter.
# We fingerprint each EN source file and only retranslate the ones whose source
# changed since the last run, recorded in fr/.translation-manifest.json.
MANIFEST = f"{OUT}/.translation-manifest.json"

def _src_fingerprint(path):
    """SHA-256 of the EN source file's bytes. Missing file -> None."""
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except FileNotFoundError:
        return None

def _load_manifest():
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_manifest(m):
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=1, sort_keys=True)

def _units():
    """Ordered (name, group, src_path, translate_fn, out_path). group lets a
    target like 'chapters' select every chapter unit at once."""
    u = [("book", None, f"{SRC}/book.json", translate_book, f"{OUT}/book.json")]
    for cf in sorted(glob.glob(f"{SRC}/chapters/ch*.json")):
        nm = os.path.basename(cf)[:-5]
        u.append((nm, "chapters", cf, translate_chapter, f"{OUT}/chapters/{nm}.json"))
    u.append(("glossary", None, f"{SRC}/glossary.json", translate_glossary, f"{OUT}/glossary.json"))
    u.append(("receipts", None, f"{SRC}/receipts.json", translate_receipts, f"{OUT}/receipts.json"))
    return u

def main(argv):
    # Split flags from positional targets so existing callers (a list of target
    # names) keep working unchanged; flags are additive.
    flags = {a for a in argv if a.startswith("--")}
    targets = [a for a in argv if not a.startswith("--")]
    changed_only = "--changed" in flags
    list_only = "--list-changed" in flags
    if "--help" in flags or "-h" in flags:
        print("usage: translate_fr.py [book|chapters|chNN|glossary|receipts ...] "
              "[--changed] [--list-changed]")
        print("  --changed       only retranslate docs whose EN source changed since last run")
        print("  --list-changed  print what --changed would do, then exit (no MT)")
        return 0
    t0 = time.time()
    def want(name, group): return (not targets) or name in targets or (group and group in targets)

    manifest = _load_manifest()
    units = _units()
    selected = [(n, g, s, fn, o, _src_fingerprint(s)) for (n, g, s, fn, o) in units if want(n, g)]
    # Under --changed, keep only docs whose fingerprint differs from the manifest
    # (or that were never translated). A None fingerprint means the source is gone.
    stale = [t for t in selected if t[5] is not None and manifest.get(t[0]) != t[5]]

    if list_only:
        names = [t[0] for t in (stale if changed_only else selected)]
        print(f"would translate {len(names)} doc(s): {names}")
        return 0

    todo = stale if changed_only else [t for t in selected if t[5] is not None]
    if changed_only and not todo:
        print("Nothing changed since last run — French edition is up to date.")
        return 0

    for name, group, src, fn, out, fp in todo:
        print(f"{name} ...", flush=True)
        _write(out, _batched(fn, json.load(open(src, encoding="utf-8"))))
        manifest[name] = fp
        _save_manifest(manifest)   # persist incrementally so a crash keeps progress
    print(f"done — {len(todo)} doc(s) in {time.time() - t0:.1f}s", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
