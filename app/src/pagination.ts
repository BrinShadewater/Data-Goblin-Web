// ---------------------------------------------------------------------------
// Book pagination — pure logic, no React. Flattens a chapter into an ordered
// list of logical blocks, then packs blocks into page panels using a
// character-count height heuristic with BALANCED fill: total cost is measured
// first, a page count derived, and blocks are packed toward an even per-page
// target so the last page is never a stub. On desktop two panels = one
// spread; on phone/tablet each panel is its own page. Panel 0 is the chapter
// opener (title + mascot + Start Here) and carries a fixed overhead.
// Also owns the per-chapter "last panel read" localStorage store.
// ---------------------------------------------------------------------------

import type { ArtPanel, Chapter, Trap } from "./types";

export type Block =
  | { kind: "heading"; heading: string; accent?: string; breakBefore?: boolean }
  | { kind: "md"; text: string; breakBefore?: boolean }
  | { kind: "trap"; trap: Trap }
  | { kind: "bias"; text: string }
  /** Near-full-page art plate (art-map.json `panels`); always gets its own page. */
  | { kind: "panel"; src: string; caption?: string | null }
  /** Inline data figure (art-map.json `panels` with a `figures/` src); flows
   *  between paragraphs with its caption directly underneath, not a full page. */
  | { kind: "figure"; src: string; caption?: string | null };

export type ReaderMode = "phone" | "tablet" | "desktop";

export interface Budgets {
  /** Estimated character budget for a full flowing panel. */
  panel: number;
  /** Reduced budget for the opener panel (title + mascot eat most of it). */
  opener: number;
}

// Desktop budgets, calibrated for the 16px/1.65 reader type and the taller
// illustrated opener. The balanced packer should fill a page before turning,
// while still leaving overflow scroll as a rare fallback for atomic callouts.
export const PANEL_BUDGET = 1650;
export const OPENER_BUDGET = 900;
/** Height cost of an inline figure (contained image + caption), in budget
 *  characters: about half a page, so it packs alongside prose rather than
 *  taking a page to itself. */
export const FIGURE_COST = 720;

/**
 * Extra budget cost charged to a section heading that carries an accent
 * ornament (small art PNG rendered beside the heading, see art-map.json).
 * ~72px of image against the ~1.9 chars/px panel metric, less the heading's
 * own row height that the image shares.
 */
export const ACCENT_COST = 180;

/**
 * Budget for the active viewport mode + reading mode. Phone panels hold
 * ≈60% of a desktop panel; tablet single pages ≈85%; the dyslexia-friendly
 * face (larger metrics, 1.8 line-height) costs a further ~15%.
 */
export function budgetsFor(mode: ReaderMode, dyslexic: boolean, heightScale = 1): Budgets {
  const scale =
    (mode === "phone" ? 0.6 : mode === "tablet" ? 0.85 : 1) * (dyslexic ? 0.85 : 1) * heightScale;
  return {
    panel: Math.round(PANEL_BUDGET * scale),
    opener: Math.round(OPENER_BUDGET * scale),
  };
}

const DEFAULT_BUDGETS: Budgets = { panel: PANEL_BUDGET, opener: OPENER_BUDGET };

/**
 * Split markdown into logical blocks on blank lines, but keep multi-line
 * blockquote runs (🧌 GOBLIN CHECK / 📦 CHAPTER RECAP callouts) and markdown
 * tables atomic — they must never be broken across pages.
 */
export function splitBlocks(markdown: string): string[] {
  const chunks = markdown
    .split(/\n[ \t]*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Merge consecutive blockquote chunks (or table chunks) into one atomic
  // block so a callout split by a stray blank line still moves as a unit.
  const merged: string[] = [];
  const startsAs = (s: string) => (s.startsWith(">") ? "quote" : s.startsWith("|") ? "table" : "text");
  for (const chunk of chunks) {
    const prev = merged[merged.length - 1];
    const kind = startsAs(chunk);
    if (prev !== undefined && kind !== "text" && startsAs(prev) === kind) {
      merged[merged.length - 1] = `${prev}\n\n${chunk}`;
    } else {
      merged.push(chunk);
    }
  }
  return merged;
}

/** Heuristic "height" cost of a block, in budget characters. */
export function blockCost(block: Block): number {
  switch (block.kind) {
    case "heading":
      return 150 + (block.accent ? ACCENT_COST : 0);
    case "trap":
      return Math.round((block.trap.trapTitle.length + block.trap.text.length) * 1.15) + 120;
    case "bias":
      return block.text.length + 80;
    case "md": {
      const t = block.text.trimStart();
      if (t.startsWith(">")) {
        // Callout cards (Goblin Check / Chapter Recap) render far taller than
        // their character count: a header, padded chrome, and one full line per
        // bullet. Charge for the chrome and each quoted line so the packer never
        // over-fills a page with a tall recap.
        const lines = (block.text.match(/\n/g)?.length ?? 0) + 1;
        return Math.round(block.text.length * 1.2) + lines * 22 + 130;
      }
      if (t.startsWith("|")) return Math.round(block.text.length * 1.15) + 40;
      return block.text.length + 40;
    }
    case "panel":
      // Never packed with prose — paginatePanels appends plates as their
      // own pages — but cost a full panel for safety if one ever flows.
      return PANEL_BUDGET;
    case "figure":
      // Inline figure: contained image + caption, ~half a page; packs with prose.
      return FIGURE_COST;
  }
}

/**
 * If a Chapter Recap blockquote is taller than one page, split its bullets into
 * "continued" parts that each fit a page, so a long recap paginates across pages
 * instead of being clipped. A recap that already fits is returned unchanged.
 */
function splitRecap(text: string, budget: number): string[] {
  if (blockCost({ kind: "md", text }) <= budget) return [text];
  const headerLines: string[] = [];
  const bullets: string[] = [];
  let inBullets = false;
  for (const ln of text.split("\n")) {
    if (/^>\s*[-*]\s/.test(ln)) {
      inBullets = true;
      bullets.push(ln);
    } else if (inBullets && bullets.length > 0) {
      bullets[bullets.length - 1] += "\n" + ln;
    } else {
      headerLines.push(ln);
    }
  }
  if (bullets.length <= 1) return [text];
  const header = headerLines.join("\n");
  const contHeader = header.replace("CHAPTER RECAP", "CHAPTER RECAP (continued)");
  const limit = budget * 0.9;
  const parts: string[][] = [];
  let cur: string[] = [];
  for (const b of bullets) {
    const h = parts.length === 0 ? header : contHeader;
    if (cur.length > 0 && blockCost({ kind: "md", text: [h, ...cur, b].join("\n") }) > limit) {
      parts.push(cur);
      cur = [];
    }
    cur.push(b);
  }
  if (cur.length > 0) parts.push(cur);
  return parts.map((bs, i) => [i === 0 ? header : contHeader, ...bs].join("\n"));
}

/**
 * Flatten a chapter into its ordered block list: Start-Here intro blocks,
 * then per section a heading block + its content blocks. The Goblin Trap is
 * inserted as an atomic block after the first section; the bias label is the
 * final block. When `accents` (art-map paths like "small/water.png") is
 * non-empty, section headings carry them as ornaments, cycling in order.
 */
export function flattenChapter(
  chapter: Chapter,
  trap: Trap | null,
  accents: string[] = [],
  figures: ArtPanel[] = []
): Block[] {
  const blocks: Block[] = [];
  for (const text of splitBlocks(chapter.startHere)) blocks.push({ kind: "md", text });
  // Spread inline figures across the chapter's sections in order, so each
  // figure lands among the paragraphs it relates to instead of clustering at
  // the chapter's end. Figure k anchors after section floor((k+1)*S/(K+1)),
  // which distributes K figures evenly over S sections.
  const S = chapter.sections.length;
  const K = figures.length;
  const figsAfter = new Map<number, ArtPanel[]>();
  figures.forEach((fig, k) => {
    const i = S > 0 ? Math.min(S - 1, Math.floor(((k + 1) * S) / (K + 1))) : -1;
    const arr = figsAfter.get(i) ?? [];
    arr.push(fig);
    figsAfter.set(i, arr);
  });
  chapter.sections.forEach((section, i) => {
    // A section that *is* the Chapter Recap (its markdown carries the recap
    // callout) starts on a fresh page, so the recap's title, icon, and most of
    // its body always land together instead of the header stranding at the
    // bottom of the previous page.
    const isRecapSection = /CHAPTER RECAP/.test(section.markdown);
    blocks.push({
      kind: "heading",
      heading: section.heading,
      ...(accents.length > 0 ? { accent: accents[i % accents.length] } : {}),
      ...(isRecapSection ? { breakBefore: true } : {}),
    });
    for (const text of splitBlocks(section.markdown)) blocks.push({ kind: "md", text });
    if (i === 0 && trap) blocks.push({ kind: "trap", trap });
    for (const f of figsAfter.get(i) ?? [])
      blocks.push({ kind: "figure", src: f.src, caption: f.caption ?? null });
  });
  // Fallback for a sectionless chapter: append any unplaced figures at the end.
  for (const f of figsAfter.get(-1) ?? [])
    blocks.push({ kind: "figure", src: f.src, caption: f.caption ?? null });
  if (chapter.biasLabel) blocks.push({ kind: "bias", text: chapter.biasLabel });
  return blocks;
}

/**
 * Balanced-fill packer. Computes the total cost (the opener header counts as
 * fixed overhead on panel 0), derives pageCount = ceil(total / budget), then
 * packs toward target = total / pageCount: a panel closes when adding the
 * next block would overshoot the target by more than stopping undershoots
 * it. This keeps pages visually even and avoids a stub last page. A section
 * heading is never left as the last block of a panel — it is carried over to
 * the next panel instead.
 */
export function paginatePanels(
  chapter: Chapter,
  trap: Trap | null,
  budgets: Budgets = DEFAULT_BUDGETS,
  accents: string[] = [],
  artPanels: ArtPanel[] = []
): Block[][] {
  // All art — data figures AND decorative plates — flows inline between
  // paragraphs at ~half a page, placed near relevant text. Nothing gets its
  // own full page anymore, so no image can ever span two pages.
  const figures = artPanels;
  // Split any over-tall Chapter Recap into "continued" parts that each fit a
  // page (forced onto their own page below) so a long recap is never clipped.
  const blocks = flattenChapter(chapter, trap, accents, figures).flatMap((b): Block[] => {
    if (b.kind === "md" && b.text.trimStart().startsWith(">") && /CHAPTER RECAP/.test(b.text)) {
      const parts = splitRecap(b.text, budgets.panel);
      // First part follows the recap heading on its fresh page; only the
      // "continued" parts force their own additional page break.
      if (parts.length > 1) return parts.map((t, i) => ({ kind: "md", text: t, breakBefore: i > 0 }));
    }
    return [b];
  });
  const openerOverhead = Math.max(0, budgets.panel - budgets.opener);
  const total = blocks.reduce((t, b) => t + blockCost(b), 0) + openerOverhead;
  // Fill tolerance: allow a page to run up to ~10% over budget before a new
  // page is opened, so content that's just past a boundary stays on fewer,
  // fuller pages (target ~80%+) instead of splitting into two half-full ones.
  // The reader's overflow-scroll fallback absorbs the small over-budget cases.
  const FILL_TOLERANCE = 0.1;
  const pageCount = Math.max(1, Math.ceil(total / budgets.panel - FILL_TOLERANCE));
  const target = total / pageCount;

  const panels: Block[][] = [];
  let cur: Block[] = [];
  let used = openerOverhead; // panel 0 is pre-charged with the opener header

  for (const block of blocks) {
    if ((block.kind === "md" || block.kind === "heading") && block.breakBefore && cur.length > 0) {
      // Forced page break (a split recap part always starts its own page).
      panels.push(cur);
      cur = [];
      used = 0;
    }
    const cost = blockCost(block);
    const overshoot = used + cost - target;
    const undershoot = target - used;
    if (cur.length > 0 && overshoot > 0 && overshoot > undershoot) {
      const lastIsHeading = cur[cur.length - 1].kind === "heading";
      if (lastIsHeading && cur.length === 1) {
        // The panel holds only a heading and the next block alone exceeds the
        // target: keep them together (small overflow) rather than orphan it.
      } else {
        // Close the panel — but never orphan a heading at a page bottom.
        let carry: Block | null = null;
        if (lastIsHeading) {
          carry = cur.pop() as Block;
        }
        panels.push(cur);
        cur = carry ? [carry] : [];
        used = carry ? blockCost(carry) : 0;
      }
    }
    cur.push(block);
    used += cost;
  }
  if (cur.length > 0) panels.push(cur);
  if (panels.length === 0) panels.push([]);
  return panels;
}

// ---------------------------------------------------------------------------
// Memoized pagination. Chapter JSON objects are cached per session
// (useContent), so a WeakMap keyed on the chapter object plus a small string
// key for (budgets, trap, accents) gives one packing per (doc, viewport mode,
// reading mode) — page turns and remounts reuse the same panel arrays.
// ---------------------------------------------------------------------------

const panelCache = new WeakMap<Chapter, Map<string, Block[][]>>();

export function paginatePanelsCached(
  chapter: Chapter,
  trap: Trap | null,
  budgets: Budgets = DEFAULT_BUDGETS,
  accents: string[] = [],
  artPanels: ArtPanel[] = []
): Block[][] {
  let inner = panelCache.get(chapter);
  if (!inner) {
    inner = new Map();
    panelCache.set(chapter, inner);
  }
  const key = `${budgets.panel}|${budgets.opener}|${trap ? trap.trapTitle : ""}|${accents.join(",")}|${artPanels
    .map((p) => p.src)
    .join(",")}`;
  const hit = inner.get(key);
  if (hit) return hit;
  const panels = paginatePanels(chapter, trap, budgets, accents, artPanels);
  inner.set(key, panels);
  return panels;
}

// ---------------------------------------------------------------------------
// Per-chapter reading-position persistence. Positions are stored as a PANEL
// index (stable packing order across modes; desktop derives the spread).
// Saved indices are clamped to the current panel count on load, so the
// reader recovers gracefully if the pagination changes between visits.
// Legacy goblin-spread-ch{n} keys (spread indices) are migrated on read.
// ---------------------------------------------------------------------------

/** Sentinel meaning "open the chapter at its last panel" (clamped on load). */
export const LAST_PANEL = 1_000_000;

const panelKey = (chapter: number) => `goblin-panel-ch${chapter}`;
const legacyKey = (chapter: number) => `goblin-spread-ch${chapter}`;

export function getSavedPanel(chapter: number): number {
  try {
    const raw = localStorage.getItem(panelKey(chapter));
    if (raw != null) {
      const v = parseInt(raw, 10);
      return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    // Migrate the pre-responsive store: one spread = two panels.
    const legacy = localStorage.getItem(legacyKey(chapter));
    if (legacy != null) {
      const v = parseInt(legacy, 10);
      return Number.isFinite(v) && v >= 0 ? Math.min(v * 2, LAST_PANEL) : 0;
    }
  } catch {
    /* storage unavailable */
  }
  return 0;
}

export function savePanel(chapter: number, index: number): void {
  // NaN/negative guard: never persist an unusable position.
  const safe = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  try {
    localStorage.setItem(panelKey(chapter), String(safe));
  } catch {
    /* storage unavailable — position just won't persist */
  }
}

/**
 * True if any reading position has ever been saved on this device. Used by
 * the "/" route: first-time visitors land on the Front Matter title page;
 * returning readers resume where they left off.
 */
export function hasAnySavedPosition(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("goblin-panel-ch") || key.startsWith("goblin-spread-ch"))) return true;
    }
  } catch {
    /* storage unavailable — treat as first visit */
  }
  return false;
}
