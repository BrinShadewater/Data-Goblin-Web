// ---------------------------------------------------------------------------
// Reader context: viewport mode (phone / tablet / desktop) + the
// dyslexia-friendly reading mode, plus the derived type scale. Wraps the app
// so every component renders the right metrics for the active mode.
// ---------------------------------------------------------------------------

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { ReaderMode } from "./pagination";
import { TypeScale, typeScale } from "./theme";

function modeFor(width: number): ReaderMode {
  return width < 700 ? "phone" : width <= 1024 ? "tablet" : "desktop";
}

// Window height the page budget (pagination.ts PANEL_BUDGET) was tuned for.
// Shorter windows scale the budget down so pages pack fewer blocks and tall
// atomic callouts (Chapter Recap) stop overflowing the fixed-height panel.
const REFERENCE_VH = 820;
function heightScaleFor(vh: number): number {
  if (!vh) return 1;
  const raw = Math.max(0.62, Math.min(1.18, vh / REFERENCE_VH));
  // Quantize to coarse steps so mobile URL-bar show/hide jitter doesn't
  // re-trigger pagination on every resize tick.
  return Math.round(raw / 0.04) * 0.04;
}

// Window width the page budget was tuned for, and the reader chrome that
// never belongs to the text column: the two desktop sidebars (260 + 280) plus
// the centre well's horizontal padding (28 × 2). The spread is capped at
// 1400px wide and each page carries 66px of its own horizontal padding
// (36 + 30), so these constants track FieldGuidePage's grid and PagePanel's
// padding — change them together.
const REFERENCE_VW = 1920;
const READER_CHROME = 596;
const SPREAD_MAX = 1400;
const PANEL_PADDING = 66;

/** Width of one page's text column at a given window width, in CSS px. */
function textColumnWidth(vw: number): number {
  const well = Math.min(SPREAD_MAX, vw - READER_CHROME);
  return Math.max(120, well / 2 - PANEL_PADDING);
}

const REFERENCE_COL = textColumnWidth(REFERENCE_VW);

// Below ~1200px the spread's columns get so narrow that scaling the budget all
// the way down would leave pages too short to pack cleanly (and would push
// tall atomic callouts past the sanity gate's 2× ceiling). The floor stops
// there and the panel's overflow scroll — restored by the grid row fix in
// FieldGuidePage — absorbs the remainder rather than clipping it.
const MIN_WIDTH_SCALE = 0.46;

function widthScaleFor(vw: number): number {
  if (!vw || modeFor(vw) !== "desktop") return 1;
  const raw = Math.max(MIN_WIDTH_SCALE, Math.min(1.1, textColumnWidth(vw) / REFERENCE_COL));
  // Same coarse quantization as the height scale, so a drag-resize doesn't
  // re-paginate on every tick.
  return Math.round(raw / 0.04) * 0.04;
}

/** Live viewport mode: phone <700px, tablet 700–1024px, desktop >1024px. */
export function useViewport(): { mode: ReaderMode; heightScale: number; widthScale: number } {
  const read = () =>
    typeof window === "undefined"
      ? { mode: "desktop" as ReaderMode, heightScale: 1, widthScale: 1 }
      : {
          mode: modeFor(window.innerWidth),
          heightScale: heightScaleFor(window.innerHeight),
          widthScale: widthScaleFor(window.innerWidth),
        };
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () =>
      setVp((prev) => {
        const next = read();
        return next.mode === prev.mode &&
          next.heightScale === prev.heightScale &&
          next.widthScale === prev.widthScale
          ? prev
          : next;
      });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

interface ReaderCtx {
  mode: ReaderMode;
  /** Budget multiplier from the live viewport height (1 = reference height). */
  heightScale: number;
  /** Budget multiplier from the live text-column width (1 = reference width). */
  widthScale: number;
  /** Dyslexia-friendly type: Atkinson Hyperlegible, looser spacing, no italics. */
  dyslexic: boolean;
  toggleDyslexic: () => void;
  /** Type scale for the active mode + reading mode. */
  t: TypeScale;
}

const READING_KEY = "goblin-reading-mode";

const Ctx = createContext<ReaderCtx>({
  mode: "desktop",
  heightScale: 1,
  widthScale: 1,
  dyslexic: false,
  toggleDyslexic: () => {},
  t: typeScale("desktop", false),
});

export function ReaderProvider({ children }: { children: ReactNode }) {
  const { mode, heightScale, widthScale } = useViewport();
  const [dyslexic, setDyslexic] = useState<boolean>(() => {
    try {
      return localStorage.getItem(READING_KEY) === "dyslexic";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(READING_KEY, dyslexic ? "dyslexic" : "standard");
    } catch {
      /* private mode — ignore */
    }
  }, [dyslexic]);
  useEffect(() => {
    if (!dyslexic || typeof document === "undefined") return;
    const id = "dg-dyslexia-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap";
    document.head.appendChild(link);
  }, [dyslexic]);
  const value = useMemo<ReaderCtx>(
    () => ({
      mode,
      heightScale,
      widthScale,
      dyslexic,
      toggleDyslexic: () => setDyslexic((v) => !v),
      t: typeScale(mode, dyslexic),
    }),
    [mode, heightScale, widthScale, dyslexic]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReader = () => useContext(Ctx);
