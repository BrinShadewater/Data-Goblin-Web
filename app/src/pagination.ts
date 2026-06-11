// ---------------------------------------------------------------------------
// Book pagination — pure logic, no React. Flattens a chapter into an ordered
// list of logical blocks, then greedily packs blocks into page panels using a
// character-count height heuristic. Two panels = one spread. Spread 0 is the
// chapter opener (title + mascot + Start Here), so panel 0 gets a reduced
// budget. Also owns the per-chapter "last spread read" localStorage store.
// ---------------------------------------------------------------------------

import type { Chapter, Trap } from "./types";

export type Block =
  | { kind: "heading"; heading: string }
  | { kind: "md"; text: string }
  | { kind: "trap"; trap: Trap }
  | { kind: "bias"; text: string };

export interface Spread {
  left: Block[];
  right: Block[];
}

/** Estimated character budget for a full flowing panel. */
export const PANEL_BUDGET = 1800;
/** Reduced budget for the opener panel (title + mascot eat most of it). */
export const OPENER_BUDGET = 850;

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
      return 150;
    case "trap":
      return Math.round((block.trap.trapTitle.length + block.trap.text.length) * 1.15) + 120;
    case "bias":
      return block.text.length + 80;
    case "md": {
      const t = block.text.trimStart();
      const isCalloutOrTable = t.startsWith(">") || t.startsWith("|");
      return Math.round(block.text.length * (isCalloutOrTable ? 1.15 : 1)) + 40;
    }
  }
}

/**
 * Flatten a chapter into its ordered block list: Start-Here intro blocks,
 * then per section a heading block + its content blocks. The Goblin Trap is
 * inserted as an atomic block after the first section; the bias label is the
 * final block.
 */
export function flattenChapter(chapter: Chapter, trap: Trap | null): Block[] {
  const blocks: Block[] = [];
  for (const text of splitBlocks(chapter.startHere)) blocks.push({ kind: "md", text });
  chapter.sections.forEach((section, i) => {
    blocks.push({ kind: "heading", heading: section.heading });
    for (const text of splitBlocks(section.markdown)) blocks.push({ kind: "md", text });
    if (i === 0 && trap) blocks.push({ kind: "trap", trap });
  });
  if (chapter.biasLabel) blocks.push({ kind: "bias", text: chapter.biasLabel });
  return blocks;
}

/**
 * Greedily pack blocks into panels, then pair panels into spreads.
 * Panel 0 (the opener's left page) gets the reduced opener budget.
 * A section heading is never left as the last block of a panel — it is
 * carried over to the next panel instead.
 */
export function paginateChapter(chapter: Chapter, trap: Trap | null): Spread[] {
  const blocks = flattenChapter(chapter, trap);
  const panels: Block[][] = [];
  let cur: Block[] = [];
  let used = 0;

  for (const block of blocks) {
    const cost = blockCost(block);
    const budget = panels.length === 0 ? OPENER_BUDGET : PANEL_BUDGET;
    if (cur.length > 0 && used + cost > budget) {
      const lastIsHeading = cur[cur.length - 1].kind === "heading";
      if (lastIsHeading && cur.length === 1) {
        // The panel holds only a heading and the next block alone exceeds the
        // budget: keep them together (small overflow) rather than orphan it.
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
  if (panels.length % 2 === 1) panels.push([]);

  const spreads: Spread[] = [];
  for (let i = 0; i < panels.length; i += 2) {
    spreads.push({ left: panels[i], right: panels[i + 1] });
  }
  return spreads;
}

// ---------------------------------------------------------------------------
// Per-chapter reading-position persistence. Saved indices are clamped to the
// current spread count on load, so the reader recovers gracefully if the
// pagination changes between visits.
// ---------------------------------------------------------------------------

/** Sentinel meaning "open the chapter at its last spread" (clamped on load). */
export const LAST_SPREAD = 1_000_000;

const spreadKey = (chapter: number) => `goblin-spread-ch${chapter}`;

export function getSavedSpread(chapter: number): number {
  try {
    const raw = localStorage.getItem(spreadKey(chapter));
    const v = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}

export function saveSpread(chapter: number, index: number): void {
  try {
    localStorage.setItem(spreadKey(chapter), String(index));
  } catch {
    /* storage unavailable — position just won't persist */
  }
}
