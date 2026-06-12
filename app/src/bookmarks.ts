// ---------------------------------------------------------------------------
// Bookmarks + last-read location. Both stores keep PANEL indices (the packing
// order is identical across modes; each mode derives its own page/spread and
// clamps out-of-range indices gracefully).
//   goblin-last-location : { doc, panelIndex, ts } — updated on every page turn
//   goblin-bookmarks     : Bookmark[] — manual 🔖 bookmarks, newest first
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

export interface Bookmark {
  doc: number;
  panelIndex: number;
  chapterTitle: string;
  snippet: string;
  ts: number;
}

export interface LastLocation {
  doc: number;
  panelIndex: number;
  ts: number;
}

const BM_KEY = "goblin-bookmarks";
const LOC_KEY = "goblin-last-location";
const BM_EVENT = "goblin-bookmarks-changed";

// --- last location ----------------------------------------------------------

export function getLastLocation(): LastLocation | null {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as LastLocation;
    if (
      typeof v?.doc === "number" &&
      Number.isFinite(v.doc) &&
      typeof v?.panelIndex === "number" &&
      Number.isFinite(v.panelIndex) &&
      v.panelIndex >= 0
    ) {
      return v;
    }
  } catch {
    /* malformed or unavailable — ignore */
  }
  return null;
}

export function saveLastLocation(doc: number, panelIndex: number): void {
  try {
    localStorage.setItem(LOC_KEY, JSON.stringify({ doc, panelIndex, ts: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

// --- bookmarks ---------------------------------------------------------------

export function getBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BM_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (b): b is Bookmark =>
        b &&
        typeof b.doc === "number" &&
        Number.isFinite(b.doc) &&
        typeof b.panelIndex === "number" &&
        Number.isFinite(b.panelIndex) &&
        b.panelIndex >= 0 &&
        typeof b.ts === "number"
    );
  } catch {
    return [];
  }
}

function writeBookmarks(list: Bookmark[]): void {
  try {
    localStorage.setItem(BM_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(BM_EVENT));
}

/** Add the bookmark, or remove it if one already exists at doc+panelIndex. */
export function toggleBookmark(bm: Bookmark): void {
  const list = getBookmarks();
  const without = list.filter((b) => !(b.doc === bm.doc && b.panelIndex === bm.panelIndex));
  if (without.length === list.length) {
    writeBookmarks([bm, ...list]);
  } else {
    writeBookmarks(without);
  }
}

export function removeBookmark(doc: number, panelIndex: number): void {
  writeBookmarks(getBookmarks().filter((b) => !(b.doc === doc && b.panelIndex === panelIndex)));
}

/** Live bookmark list, kept in sync across all mounted components/tabs. */
export function useBookmarks(): Bookmark[] {
  const [list, setList] = useState<Bookmark[]>(getBookmarks);
  useEffect(() => {
    const refresh = () => setList(getBookmarks());
    window.addEventListener(BM_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BM_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return list;
}
