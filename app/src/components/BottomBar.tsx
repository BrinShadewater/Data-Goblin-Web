import { Bookmark as BookmarkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { MONO, P, UI } from "../theme";
import { NavIcon } from "./GoblinMascot";
import { savePanel } from "../pagination";
import type { Book } from "../types";

export function BottomBar({
  book,
  activeChapter,
  page,
  pageCount,
  onPrev,
  onNext,
  bookmarked,
  onToggleBookmark,
}: {
  book: Book | null;
  activeChapter: number;
  /** Current page (spread on desktop, single page on phone/tablet), 0-based. */
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const { c } = useTheme();
  const { mode } = useReader();
  const navigate = useNavigate();

  const allChapters = book ? book.parts.flatMap((p) => p.chapters) : [];
  const totalChapters = allChapters.length || 19;
  const titleOf = (n: number) => allChapters.find((ch) => ch.number === n)?.title.split(" — ")[0] ?? "";

  // Document chain: Front Matter (0) ↔ Ch1 … Ch19 ↔ Appendix (20). The end
  // documents only join the chain once book.json advertises them.
  const firstDoc = book?.frontMatter ? book.frontMatter.number : 1;
  const lastDoc = book?.backMatter ? book.backMatter.number : totalChapters;
  const isFrontDoc = book?.frontMatter && activeChapter === book.frontMatter.number;
  const prevDoc = activeChapter - 1;
  const nextDoc = activeChapter + 1;

  /** "1. What AI Actually Is" for chapters; document title for front/back matter. */
  const docName = (n: number) =>
    book?.frontMatter && n === book.frontMatter.number
      ? book.frontMatter.title
      : book?.backMatter && n === book.backMatter.number
        ? book.backMatter.title
        : `${n}. ${titleOf(n)}`;

  const firstPage = page === 0;
  const lastPage = page >= pageCount - 1;
  const canPrev = !(activeChapter <= firstDoc && firstPage);
  const canNext = !(activeChapter >= lastDoc && lastPage);

  const green = c(...P.green);
  const muted = c(...P.faint);
  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);

  const bookmarkBtn = (size: number) => (
    <button
      onClick={onToggleBookmark}
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
        color: bookmarked ? green : muted,
        flexShrink: 0,
      }}
    >
      <BookmarkIcon size={size >= 44 ? 20 : 16} fill={bookmarked ? green : "none"} strokeWidth={2} />
    </button>
  );

  // ---- Compact phone/tablet bar: prev/next + page x/y + thin progress bar.
  if (mode !== "desktop") {
    // Progress through the whole 0…20 chain, including position in-document.
    const docSpan = lastDoc - firstDoc + 1;
    const frac = Math.min(1, Math.max(0, (activeChapter - firstDoc + (page + 1) / Math.max(1, pageCount)) / docSpan));
    const navBtn = (dir: "prev" | "next") => {
      const enabled = dir === "prev" ? canPrev : canNext;
      const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
      return (
        <button
          onClick={() => enabled && (dir === "prev" ? onPrev() : onNext())}
          disabled={!enabled}
          aria-label={dir === "prev" ? "Previous page" : "Next page"}
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
          <Icon size={24} color={green} strokeWidth={2} />
        </button>
      );
    };
    return (
      <div
        style={{
          background: bg,
          borderTop: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 6px",
          height: "56px",
          flexShrink: 0,
          zIndex: 40,
          boxShadow: c("0 -1px 4px rgba(0,0,0,0.04)", "0 -1px 8px rgba(0,0,0,0.2)"),
          transition: "background 0.3s",
        }}
      >
        {navBtn("prev")}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: green, whiteSpace: "nowrap" }}>
            Page {page + 1} of {pageCount}
          </div>
          <div style={{ width: "100%", maxWidth: "240px", height: "3px", borderRadius: "2px", background: c("#ccc2a8", "#222837"), overflow: "hidden" }}>
            <div style={{ width: `${Math.round(frac * 100)}%`, height: "100%", background: green, transition: "width 0.3s" }} />
          </div>
        </div>
        {bookmarkBtn(44)}
        {navBtn("next")}
      </div>
    );
  }

  // ---- Desktop bar: unchanged spread navigation + chapter dots + 🔖.
  const prevLabel = !firstPage
    ? "← Previous Page"
    : book?.frontMatter && prevDoc === book.frontMatter.number
      ? "← Front Matter"
      : book?.backMatter && activeChapter === book.backMatter.number
        ? `← Chapter ${prevDoc}`
        : "← Previous Chapter";
  const nextLabel = !lastPage
    ? "Next Page →"
    : isFrontDoc
      ? "Begin Chapter 1 →"
      : book?.backMatter && nextDoc === book.backMatter.number
        ? "Source Library →"
        : canNext
          ? "Next Chapter →"
          : "The End";
  // Hide the subtitle when the label itself already names the destination.
  const prevSub = firstPage
    ? canPrev && prevDoc !== book?.frontMatter?.number
      ? docName(prevDoc)
      : null
    : docName(activeChapter);
  const nextSub = lastPage
    ? canNext && nextDoc !== book?.backMatter?.number
      ? docName(nextDoc)
      : null
    : docName(activeChapter);

  return (
    <div
      style={{
        background: bg,
        borderTop: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "48px",
        flexShrink: 0,
        zIndex: 40,
        boxShadow: c("0 -1px 4px rgba(0,0,0,0.04)", "0 -1px 8px rgba(0,0,0,0.2)"),
        transition: "background 0.3s",
      }}
    >
      <button
        onClick={() => canPrev && onPrev()}
        disabled={!canPrev}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: canPrev ? "pointer" : "not-allowed", opacity: canPrev ? 1 : 0.3, padding: 0 }}
      >
        <ChevronLeft size={15} color={green} strokeWidth={2} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: UI, fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, lineHeight: 1, marginBottom: "2px" }}>
            {prevLabel}
          </div>
          {prevSub && (
            <div style={{ fontFamily: UI, fontSize: "10.5px", color: green, fontWeight: 500 }}>
              {prevSub}
            </div>
          )}
        </div>
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <NavIcon name="book-nav" size={16} />
          <div style={{ fontFamily: UI, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: muted }}>
            Your Progress Through the Guide
          </div>
        </div>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
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
                  width: isActive ? "10px" : "7px",
                  height: isActive ? "10px" : "7px",
                  borderRadius: "50%",
                  background: isActive ? green : isDone ? c("#7a9a58", "#4a7a5a") : c("#bcb29a", "#2a3040"),
                  border: isActive ? `2px solid ${c("#94b87e", "#3a6047")}` : "none",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
        <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: green }}>
          Page {page + 1} of {pageCount}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {bookmarkBtn(30)}
        <button
          onClick={() => canNext && onNext()}
          disabled={!canNext}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: canNext ? "pointer" : "not-allowed", opacity: canNext ? 1 : 0.3, padding: 0, textAlign: "right" }}
        >
          <div>
            <div style={{ fontFamily: UI, fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, lineHeight: 1, marginBottom: "2px" }}>
              {nextLabel}
            </div>
            {nextSub && (
              <div style={{ fontFamily: UI, fontSize: "10.5px", color: green, fontWeight: 500 }}>
                {nextSub}
              </div>
            )}
          </div>
          <ChevronRight size={15} color={green} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
