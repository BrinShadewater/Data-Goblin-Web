/**
 * Evidence for each dead English claim anchor, so re-anchoring is a decision
 * made on facts rather than a guess.
 *
 *   node scripts/dead-anchor-report.cjs
 *
 * For every anchor that no longer resolves, prints the ledger claim it belongs
 * to, every chapter whose prose still contains the phrase, how many times, and
 * the surrounding sentence in each candidate. One candidate means the fix is
 * mechanical; more than one means someone has to decide which sentence the
 * receipt actually verifies.
 */
const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "public", "content");
const anchors = JSON.parse(fs.readFileSync(path.join(CONTENT, "claim-anchors.json"), "utf8"));
const receipts = JSON.parse(fs.readFileSync(path.join(CONTENT, "receipts.json"), "utf8"));
const book = JSON.parse(fs.readFileSync(path.join(CONTENT, "book.json"), "utf8"));

const titles = {};
for (const part of book.parts || []) for (const ch of part.chapters || []) titles[ch.number] = ch.title;

const prose = {};
for (let i = 0; i <= 21; i++) {
  const p = path.join(CONTENT, "chapters", `ch${String(i).padStart(2, "0")}.json`);
  if (!fs.existsSync(p)) continue;
  const ch = JSON.parse(fs.readFileSync(p, "utf8"));
  prose[i] = [ch.startHere, ...(ch.sections || []).map((s) => s.markdown)].join("\n\n");
}

const sentenceAround = (text, phrase) => {
  const i = text.indexOf(phrase);
  if (i < 0) return null;
  const start = Math.max(0, text.lastIndexOf(".", i - 1) + 1);
  const endDot = text.indexOf(".", i + phrase.length);
  const end = endDot < 0 ? Math.min(text.length, i + 220) : Math.min(endDot + 1, i + 260);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
};

let n = 0;
for (const [num, list] of Object.entries(anchors)) {
  for (const a of list) {
    if (prose[num] && prose[num].includes(a.anchor)) continue;
    n++;
    const rec = receipts.find((r) => r.id === a.id);
    const candidates = Object.entries(prose)
      .filter(([, t]) => t.includes(a.anchor))
      .map(([c, t]) => ({
        chapter: Number(c),
        title: titles[c] || (c === "0" ? "Front Matter" : `ch${c}`),
        hits: t.split(a.anchor).length - 1,
        sentence: sentenceAround(t, a.anchor),
      }));

    console.log("=".repeat(76));
    console.log(`#${a.id}  anchored to ch${num}, which no longer contains it`);
    console.log(`  ledger claim : ${rec ? rec.claim : "(no ledger entry!)"}`);
    console.log(`  status       : ${a.status}`);
    console.log(`  phrase       : ${JSON.stringify(a.anchor)}`);
    if (candidates.length === 0) {
      console.log(`  candidates   : NONE — phrase is in no chapter`);
    } else {
      console.log(`  candidates   : ${candidates.length === 1 ? "1 (mechanical)" : `${candidates.length} (needs a decision)`}`);
      for (const c of candidates) {
        console.log(`     ch${String(c.chapter).padStart(2)}  ${c.title}   [${c.hits} hit${c.hits === 1 ? "" : "s"}]`);
        console.log(`         …${(c.sentence || "").slice(0, 210)}`);
      }
    }
  }
}
console.log("=".repeat(76));
console.log(`${n} dead anchors`);
