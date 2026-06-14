import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { P } from "../theme";
import { tr } from "../i18n";
import {
  ChapterTurnButton,
  CompactPageProgress,
  CompactPageTurnButton,
  ProgressGuide,
  ReaderBookmarkButton,
} from "./ReaderChrome";
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

  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);

  // ---- Compact phone/tablet bar: prev/next + page x/y + thin progress bar.
  if (mode !== "desktop") {
    // Progress through the whole 0…20 chain, including position in-document.
    const docSpan = lastDoc - firstDoc + 1;
    const frac = Math.min(1, Math.max(0, (activeChapter - firstDoc + (page + 1) / Math.max(1, pageCount)) / docSpan));
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
        <CompactPageTurnButton direction="prev" enabled={canPrev} onTurn={onPrev} />
        <CompactPageProgress page={page} pageCount={pageCount} progress={frac} />
        <ReaderBookmarkButton bookmarked={bookmarked} onToggle={onToggleBookmark} size={44} />
        <CompactPageTurnButton direction="next" enabled={canNext} onTurn={onNext} />
      </div>
    );
  }

  // ---- Desktop bar: unchanged spread navigation + chapter dots + 🔖.
  const prevLabel = !firstPage
    ? tr("← Previous Page")
    : book?.frontMatter && prevDoc === book.frontMatter.number
      ? tr("← Front Matter")
      : book?.backMatter && activeChapter === book.backMatter.number
        ? `← ${tr("Chapter")} ${prevDoc}`
        : tr("← Previous Chapter");
  const nextLabel = !lastPage
    ? tr("Next Page →")
    : isFrontDoc
      ? tr("Begin Chapter 1 →")
      : book?.backMatter && nextDoc === book.backMatter.number
        ? tr("Source Library →")
        : canNext
          ? tr("Next Chapter →")
          : tr("The End");
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
        height: "56px",
        flexShrink: 0,
        zIndex: 40,
        boxShadow: c("0 -1px 4px rgba(0,0,0,0.04)", "0 -1px 8px rgba(0,0,0,0.2)"),
        transition: "background 0.3s",
      }}
    >
      <ChapterTurnButton direction="prev" enabled={canPrev} label={prevLabel} subtitle={prevSub} onTurn={onPrev} />

      <ProgressGuide
        totalChapters={totalChapters}
        activeChapter={activeChapter}
        titleOf={titleOf}
        page={page}
        pageCount={pageCount}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <ReaderBookmarkButton bookmarked={bookmarked} onToggle={onToggleBookmark} size={36} />
        <ChapterTurnButton direction="next" enabled={canNext} label={nextLabel} subtitle={nextSub} onTurn={onNext} />
      </div>
    </div>
  );
}
