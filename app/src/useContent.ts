import { useEffect, useState } from "react";
import { RESPONSIVE_ART } from "./imageRegistry";
import type { ArtMap, Book, Chapter, GlossaryEntry, LinkEntry, Receipt, Traps } from "./types";

// Runtime JSON loader with a module-level cache so each file is fetched once
// per session. Content lives in public/content/ and is produced by the
// pipeline (site/pipeline/build_content.py) — never hardcoded in the app.

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

const BASE = `${import.meta.env.BASE_URL}content/`;

export function fetchJson<T>(relPath: string): Promise<T> {
  if (cache.has(relPath)) return Promise.resolve(cache.get(relPath) as T);
  const existing = inflight.get(relPath);
  if (existing) return existing as Promise<T>;
  const p = fetch(BASE + relPath)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${relPath}: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(relPath, data);
      inflight.delete(relPath);
      return data;
    })
    .catch((err) => {
      inflight.delete(relPath);
      throw err;
    });
  inflight.set(relPath, p);
  return p as Promise<T>;
}

export function useJson<T>(relPath: string | null): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(
    relPath && cache.has(relPath) ? (cache.get(relPath) as T) : null
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!relPath) {
      setData(null);
      setError(null);
      return;
    }
    let live = true;
    if (cache.has(relPath)) {
      setData(cache.get(relPath) as T);
      return;
    }
    setData(null);
    setError(null);
    fetchJson<T>(relPath)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [relPath]);
  return { data, error };
}

export const chapterPath = (num: number) => `chapters/ch${String(num).padStart(2, "0")}.json`;

export const useBook = () => useJson<Book>("book.json");
export const useChapter = (num: number | null) =>
  useJson<Chapter>(num == null ? null : chapterPath(num));
export const useTraps = () => useJson<Traps>("traps.json");
export const useReceipts = () => useJson<Receipt[]>("receipts.json");
export const useGlossary = () => useJson<GlossaryEntry[]>("glossary.json");
export const useLinks = () => useJson<LinkEntry[]>("links.json");
export const useArtMap = () => useJson<ArtMap>("art-map.json");

/** URL of an art asset; `rel` is an art-map path like "small/water.png". */
export const artUrl = (rel: string) => `${import.meta.env.BASE_URL}art/${rel}`;

export function artDimensions(rel: string) {
  const entry = RESPONSIVE_ART[rel];
  return entry ? { width: entry.width, height: entry.height } : undefined;
}

export function artAspectRatio(rel: string) {
  const entry = RESPONSIVE_ART[rel];
  return entry ? `${entry.width} / ${entry.height}` : undefined;
}

export function artSrcSet(rel: string) {
  const widths = RESPONSIVE_ART[rel]?.widths;
  if (!widths) return undefined;
  const ext = rel.slice(rel.lastIndexOf("."));
  const base = rel.slice(0, -ext.length);
  return widths
    .map((width) => `${artUrl(width === 1024 ? rel : `${base}-${width}w.webp`)} ${width}w`)
    .join(", ");
}
