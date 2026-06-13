import { Bookmark as BookmarkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { MONO, P, TOKENS, UI } from "../theme";
import { savePanel } from "../pagination";
import { NavIcon } from "./GoblinMascot";

export function ReaderBookmarkButton({
  bookmarked,
  onToggle,
  size,
}: {
  bookmarked: boolean;
  onToggle: () => void;
  size: number;
}) {
  const { c } = useTheme();
  const red = c(...P.red);
  return (
    <button
      onClick={onToggle}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"}
      aria-pressed={bookmarked}
      title={bookmarked ? "Remove bookmark" : "Bookmark this page"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: red,
        flexShrink: 0,
      }}
    >
      <BookmarkIcon size={size >= 36 ? 28 : 22} fill={bookmarked ? red : "none"} strokeWidth={2.2} />
    </button>
  );
}

export function CompactPageTurnButton({
  direction,
  enabled,
  onTurn,
}: {
  direction: "prev" | "next";
  enabled: boolean;
  onTurn: () => void;
}) {
  const { c } = useTheme();
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={() => enabled && onTurn()}
      disabled={!enabled}
      aria-label={direction === "prev" ? "Previous page" : "Next page"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "44px",
        height: "44px",
        background: "none",
        border: "none",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.3,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <Icon size={24} color={c(...P.green)} strokeWidth={2} />
    </button>
  );
}

export function CompactPageProgress({
  page,
  pageCount,
  progress,
}: {
  page: number;
  pageCount: number;
  progress: number;
}) {
  const { c } = useTheme();
  const progressBlue = c(...TOKENS.color.progressBlue);
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: progressBlue, whiteSpace: "nowrap" }}>
        Page {page + 1} of {pageCount}
      </div>
      <div style={{ width: "100%", maxWidth: "240px", height: "3px", borderRadius: "2px", background: c("#ccc2a8", "#222837"), overflow: "hidden" }}>
        <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: progressBlue, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export function ChapterTurnButton({
  direction,
  enabled,
  label,
  subtitle,
  onTurn,
}: {
  direction: "prev" | "next";
  enabled: boolean;
  label: string;
  subtitle: string | null;
  onTurn: () => void;
}) {
  const { c } = useTheme();
  const green = c(...P.green);
  const muted = c(...P.faint);
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const text = (
    <div style={{ textAlign: direction === "prev" ? "left" : "right" }}>
      <div style={{ fontFamily: UI, fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, lineHeight: 1, marginBottom: "3px" }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontFamily: UI, fontSize: "12px", color: green, fontWeight: 600 }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <button
      onClick={() => enabled && onTurn()}
      disabled={!enabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.3,
        padding: 0,
        textAlign: direction === "prev" ? "left" : "right",
      }}
    >
      {direction === "prev" && <Icon size={20} color={green} strokeWidth={2} />}
      {text}
      {direction === "next" && <Icon size={20} color={green} strokeWidth={2} />}
    </button>
  );
}

export function ProgressGuide({
  totalChapters,
  activeChapter,
  titleOf,
  page,
  pageCount,
}: {
  totalChapters: number;
  activeChapter: number;
  titleOf: (chapter: number) => string;
  page: number;
  pageCount: number;
}) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const progressBlue = c(...TOKENS.color.progressBlue);
  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", rowGap: "0px", alignItems: "center", minWidth: "360px", paddingLeft: `${TOKENS.icon.progressBook + 9}px` }}>
      <div style={{ fontFamily: UI, fontSize: "9px", fontWeight: TOKENS.weight.toolLabel, letterSpacing: "0.12em", textTransform: "uppercase", color: progressBlue, textAlign: "center", zIndex: 1 }}>
        Your Progress Through the Guide
      </div>
      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-42%)" }}>
        <NavIcon name="book-nav" size={TOKENS.icon.progressBook} />
      </div>
      <div style={{ display: "flex", gap: "5px", alignItems: "center", justifyContent: "center", minHeight: "18px" }}>
        {Array.from({ length: totalChapters }, (_, i) => {
          const ch = i + 1;
          const isActive = ch === activeChapter;
          const isDone = ch < activeChapter;
          return (
            <button
              key={ch}
              onClick={() => {
                savePanel(ch, 0);
                navigate(`/chapter/${ch}`);
              }}
              title={`${ch}. ${titleOf(ch)}`}
              style={{
                width: isActive ? "15px" : "8px",
                height: isActive ? "15px" : "8px",
                borderRadius: "50%",
                background: isActive
                  ? `radial-gradient(circle at 35% 30%, ${c(...TOKENS.color.progressCrystalLight)} 0%, ${c(...TOKENS.color.progressCrystalMid)} 42%, ${progressBlue} 76%)`
                  : isDone ? c(...TOKENS.color.progressDone) : c("#bcb29a", "#2a3040"),
                border: isActive ? `1px solid ${c(...TOKENS.color.progressCrystalBorder)}` : "none",
                boxShadow: isActive
                  ? c("0 0 0 3px rgba(143, 215, 255, 0.24), 0 0 17px rgba(26, 46, 74, 0.58)", "0 0 0 3px rgba(143, 215, 255, 0.18), 0 0 20px rgba(122, 180, 232, 0.78)")
                  : "none",
                transition: "all 0.2s",
                flexShrink: 0,
                cursor: "pointer",
                padding: 0,
              }}
            />
          );
        })}
      </div>
      <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: progressBlue, textAlign: "center" }}>
        Page {page + 1} of {pageCount}
      </div>
    </div>
  );
}
