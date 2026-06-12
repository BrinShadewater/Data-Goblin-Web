/**
 * Pagination sanity check. Run from site/app with:
 *   npm run check:pagination
 *
 * For the front matter (0), chapters 2, 8, 15, and the appendix (20) it
 * verifies, for every reader mode (desktop / tablet / phone / phone+dyslexic):
 *  (a) every logical block appears exactly once across pages — the
 *      concatenated paginated text equals the concatenated source text
 *      (NO BLOCK LOSS is the invariant);
 *  (b) the chapter produces more than one page;
 *  (c) desktop only: no panel's estimated cost exceeds ~2× the panel budget
 *      (smaller modes share the desktop packing logic; single atomic blocks
 *      such as merged tables can legitimately exceed tiny phone budgets).
 *  (d) desktop balanced fill: the last panel is not a stub (≥25% of target)
 *      unless the chapter has only one panel.
 */
const fs = require("fs");
const path = require("path");
const {
  flattenChapter,
  paginatePanels,
  paginateChapter,
  splitBlocks,
  blockCost,
  budgetsFor,
  PANEL_BUDGET,
  OPENER_BUDGET,
} = require("./.build/pagination.cjs");

const CONTENT = path.join(__dirname, "..", "public", "content");
const traps = JSON.parse(fs.readFileSync(path.join(CONTENT, "traps.json"), "utf8"));

// Section-heading accents from art-map.json (the production config) — checks
// run with the art cost charged, plus a no-art control run. Falls back to a
// synthetic accent list when the map is missing.
let artMap = null;
try {
  artMap = JSON.parse(fs.readFileSync(path.join(CONTENT, "art-map.json"), "utf8"));
} catch {
  /* no art map — synthetic accents below */
}
const accentsFor = (num) =>
  (artMap && artMap.docs && artMap.docs[String(num)] && artMap.docs[String(num)].accents) ||
  ["small/a.png", "small/b.png", "small/c.png"];

const blockText = (b) => {
  switch (b.kind) {
    case "heading": return `## ${b.heading}${b.accent ? ` ⟐${b.accent}` : ""}`;
    case "md": return b.text;
    case "trap": return `[TRAP] ${b.trap.trapTitle} ${b.trap.text}`;
    case "bias": return b.text;
    default: throw new Error(`unknown block kind ${b.kind}`);
  }
};

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const MODES = [
  { name: "desktop", budgets: budgetsFor("desktop", false) },
  { name: "tablet", budgets: budgetsFor("tablet", false) },
  { name: "phone", budgets: budgetsFor("phone", false) },
  { name: "phone+dyslexic", budgets: budgetsFor("phone", true) },
];

console.log(
  `Budgets: desktop ${PANEL_BUDGET}/${OPENER_BUDGET}` +
  MODES.slice(1).map((m) => ` · ${m.name} ${m.budgets.panel}/${m.budgets.opener}`).join("")
);

for (const num of [0, 2, 8, 15, 20]) {
  const ch = JSON.parse(
    fs.readFileSync(path.join(CONTENT, "chapters", `ch${String(num).padStart(2, "0")}.json`), "utf8")
  );
  const trap = traps[String(num)] ?? null;
  const accents = accentsFor(num);
  console.log(`\nChapter ${num}: ${ch.title.split(" — ")[0]} (${accents.length} accents)`);

  // Expected block sequence straight from the source JSON, with the art-map
  // accents applied — the production rendering path.
  const expected = flattenChapter(ch, trap, accents).map(blockText);
  const sourceProse = [ch.startHere, ...ch.sections.map((s) => s.markdown)]
    .flatMap((md) => splitBlocks(md))
    .join("\n\n");

  // Art-cost coherence: accented headings must cost more than bare ones.
  {
    const bare = blockCost({ kind: "heading", heading: "x" });
    const accented = blockCost({ kind: "heading", heading: "x", accent: "small/a.png" });
    check("accented heading is charged extra", accented > bare, `${bare} -> ${accented}`);
  }

  for (const { name, budgets } of MODES) {
    const panels = paginatePanels(ch, trap, budgets, accents);
    const actualBlocks = panels.flat();
    const actual = actualBlocks.map(blockText);

    // (a) no loss, no duplication, order preserved.
    check(
      `[${name}] blocks appear exactly once (no loss/duplication)`,
      actual.length === expected.length && actual.join("\n \n") === expected.join("\n \n"),
      `${actual.length} paginated vs ${expected.length} source blocks across ${panels.length} pages`
    );

    // Belt-and-braces: paginated prose covers the full source markdown.
    const paginatedProse = actualBlocks
      .filter((b) => b.kind === "md")
      .map((b) => b.text)
      .join("\n\n");
    check(`[${name}] paginated prose matches source markdown`, paginatedProse === sourceProse);

    // (b) page count.
    check(`[${name}] page count > 1`, panels.length > 1, `${panels.length} pages`);
  }

  // No-art control: pagination must also hold with accents disabled (the
  // pre-art behaviour and the art-map "accents": [] case).
  {
    const budgets = budgetsFor("desktop", false);
    const bare = paginatePanels(ch, trap, budgets).flat().map(blockText);
    const bareExpected = flattenChapter(ch, trap).map(blockText);
    check(
      "[desktop, no art] blocks appear exactly once",
      bare.length === bareExpected.length && bare.join("\n \n") === bareExpected.join("\n \n"),
      `${bare.length} vs ${bareExpected.length} blocks`
    );
  }

  // (c) desktop 2× ceiling + (d) no stub last page, via the spread pairing —
  // with the art-map accents charged.
  const budgets = budgetsFor("desktop", false);
  const spreads = paginateChapter(ch, trap, budgets, accents);
  const panelsList = spreads.flatMap((s, i) => [
    { cost: s.left.reduce((t, b) => t + blockCost(b), 0), budget: i === 0 ? budgets.opener : budgets.panel, id: `spread ${i} left` },
    { cost: s.right.reduce((t, b) => t + blockCost(b), 0), budget: budgets.panel, id: `spread ${i} right` },
  ]);
  const over = panelsList.filter((p) => p.cost > 2 * p.budget);
  const worst = panelsList.reduce((a, b) => (b.cost / b.budget > a.cost / a.budget ? b : a));
  check(
    "[desktop] no panel exceeds 2x budget",
    over.length === 0,
    `worst: ${worst.id} at ${(100 * worst.cost / worst.budget).toFixed(0)}% of budget`
  );

  const flat = paginatePanels(ch, trap, budgets, accents);
  if (flat.length > 1) {
    const lastCost = flat[flat.length - 1].reduce((t, b) => t + blockCost(b), 0);
    check(
      "[desktop] balanced fill: last page is not a stub",
      lastCost >= 0.25 * budgets.panel,
      `last page at ${(100 * lastCost / budgets.panel).toFixed(0)}% of budget`
    );
  }
}

console.log(failures === 0 ? "\nAll sanity checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
