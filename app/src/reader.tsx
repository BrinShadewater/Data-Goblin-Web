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
  return Math.max(0.62, Math.min(1.18, vh / REFERENCE_VH));
}

/** Live viewport mode: phone <700px, tablet 700–1024px, desktop >1024px. */
export function useViewport(): { mode: ReaderMode; heightScale: number } {
  const read = () =>
    typeof window === "undefined"
      ? { mode: "desktop" as ReaderMode, heightScale: 1 }
      : { mode: modeFor(window.innerWidth), heightScale: heightScaleFor(window.innerHeight) };
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

interface ReaderCtx {
  mode: ReaderMode;
  /** Budget multiplier from the live viewport height (1 = reference height). */
  heightScale: number;
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
  dyslexic: false,
  toggleDyslexic: () => {},
  t: typeScale("desktop", false),
});

export function ReaderProvider({ children }: { children: ReactNode }) {
  const { mode, heightScale } = useViewport();
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
      dyslexic,
      toggleDyslexic: () => setDyslexic((v) => !v),
      t: typeScale(mode, dyslexic),
    }),
    [mode, heightScale, dyslexic]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReader = () => useContext(Ctx);
