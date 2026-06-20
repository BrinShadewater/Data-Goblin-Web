import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { P } from "../theme";
import { tr } from "../i18n";

/**
 * Large page-turn buttons pinned to the vertical centre of each page edge,
 * a backup for readers who miss the bottom-corner controls. Rendered inside a
 * position:relative page container so they sit on the page edges, not the
 * screen edges. Hidden (and non-interactive) at the very first / last page.
 */
export function EdgeNav({
  onPrev,
  onNext,
  canPrev,
  canNext,
  outset = 8,
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  /** Horizontal offset in px. Positive = inset over the page; negative = nudged
   *  out past the page edge into the side gutter (must be rendered outside any
   *  overflow:hidden page container). */
  outset?: number;
}) {
  const { c } = useTheme();
  const base = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    width: "46px",
    height: "78px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    zIndex: 45,
    padding: 0,
    color: c(...P.ink),
    background: c("rgba(251,246,233,0.86)", "rgba(22,26,36,0.8)"),
    border: `1px solid ${c(...P.borderSoft)}`,
    boxShadow: c("0 2px 12px rgba(60,50,30,0.28)", "0 2px 12px rgba(0,0,0,0.55)"),
    transition: "opacity 0.2s, background 0.2s",
  };
  return (
    <>
      <button
        aria-label={tr("Previous page")}
        onClick={onPrev}
        disabled={!canPrev}
        style={{
          ...base,
          left: `${outset}px`,
          opacity: canPrev ? 0.9 : 0,
          pointerEvents: canPrev ? "auto" : "none",
          cursor: canPrev ? "pointer" : "default",
        }}
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>
      <button
        aria-label={tr("Next page")}
        onClick={onNext}
        disabled={!canNext}
        style={{
          ...base,
          right: `${outset}px`,
          opacity: canNext ? 0.9 : 0,
          pointerEvents: canNext ? "auto" : "none",
          cursor: canNext ? "pointer" : "default",
        }}
      >
        <ChevronRight size={28} strokeWidth={2.5} />
      </button>
    </>
  );
}
