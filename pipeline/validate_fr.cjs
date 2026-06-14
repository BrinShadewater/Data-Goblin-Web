// Validate the French edition against the English source (Windows-native).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "app", "public", "content");
const texts = (d, o = []) => {
  if (typeof d === "string") o.push(d);
  else if (Array.isArray(d)) d.forEach((v) => texts(v, o));
  else if (d && typeof d === "object") Object.values(d).forEach((v) => texts(v, o));
  return o;
};
const MARKERS = ["\u{1F9CC} GOBLIN CHECK", "\u{1F4E6} CHAPTER RECAP", "GOBLIN FACTS", "EXAMPLE", "ALIGNMENT"];
const files = ["book.json", "glossary.json", "receipts.json", "traps.json"]
  .concat(fs.readdirSync(path.join(root, "chapters")).filter((f) => /^ch\d+\.json$/.test(f)).map((f) => "chapters/" + f));
let problems = [], present = 0;
for (const f of files) {
  const frp = path.join(root, "fr", f), enp = path.join(root, f);
  if (!fs.existsSync(frp)) { problems.push("MISSING " + f); continue; }
  present++;
  let en, fr;
  try { en = JSON.parse(fs.readFileSync(enp, "utf8")); fr = JSON.parse(fs.readFileSync(frp, "utf8")); }
  catch (e) { problems.push(f + ": JSON parse error " + e.message); continue; }
  const te = texts(en).join("\n"), tf = texts(fr).join("\n");
  if (tf.includes("XQZ") || tf.includes("ZQX")) problems.push(f + ": sentinel fragments present");
  const cnt = (s, sub) => s.split(sub).length - 1;
  for (const m of MARKERS) if (cnt(te, m) !== cnt(tf, m)) problems.push(`${f}: marker ${JSON.stringify(m)} en=${cnt(te,m)} fr=${cnt(tf,m)}`);
  const urls = (s) => new Set((s.match(/https?:\/\/[^\s)\]]+/g) || []));
  const ue = urls(te), uf = urls(tf);
  for (const u of ue) if (!uf.has(u)) problems.push(`${f}: URL missing ${u}`);
}
console.log("FR files present:", present, "/", files.length);
console.log("PROBLEMS:", problems.length);
problems.slice(0, 40).forEach((p) => console.log("  - " + p));
if (!problems.length) console.log("  none - ALL CHECKS PASS (Windows-native)");
