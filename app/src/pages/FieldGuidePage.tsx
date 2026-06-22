import { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { BODY, MONO, P, RADIUS } from "../theme";
import { LeftSidebar } from "../components/LeftSidebar";
import { GoblinTools, RightSidebar } from "../components/RightSidebar";
import { BottomBar } from "../components/BottomBar";
import { EdgeNav } from "../components/EdgeNav";
import { useFocusTrap } from "../focusTrap";
import { PagePanel } from "../components/PagePanel";
import { NavIcon } from "../components/GoblinMascot";
import { useBook } from "../useContent";
import { useLanguage } from "../LanguageContext";
import { folio, backMatterNumber, isBackMatter } from "../readerUtils";
import { tr } from "../i18n";
import {
  useChapterRoute,
  usePageNavigation,
  usePaginatedChapter,
  useReaderBookmark,
  useSwipePaging,
  useToolsSheet,
} from "../readerHooks";

/**
 * The Field Guide reader. Desktop (>1024px): TOC sidebar / two-page book
 * spread / tools sidebar / bottom bar. Phone (<700px) and tablet portrait
 * (700–1024px): a single page with swipe navigation, a compact bottom bar,
 * and the goblin tools behind a floating 🧌 bottom sheet. Routes "/" and
 * "/chapter/:num", where :num runs 0 (front matter) through 21 (appendix).
 * ArrowLeft/ArrowRight and the bottom-bar buttons turn pages, crossing
 * document boundaries at either end. Positions are stored as panel indices.
 */
export function FieldGuidePage() {
  const { c } = useTheme();
  const { mode } = useReader();
  const single = mode !== "desktop";

  const num = useChapterRoute();
  const { lang } = useLanguage();
  const { data: book } = useBook();
  const { chapter, error, panels } = usePaginatedChapter(num);
  const { aligned, page, pageCount, step, goNext, goPrev } = usePageNavigation({ num, panels, single });
  const firstDoc = book?.frontMatter?.number ?? 0;
  const lastDoc = backMatterNumber(book);
  const canPrev = !(num <= firstDoc && page === 0);
  const canNext = !(num >= lastDoc && page >= pageCount - 1);
  const { bookmarked, onToggleBookmark } = useReaderBookmark({ num, chapter, panels, aligned, step });
  const { onTouchStart, onTouchEnd } = useSwipePaging({ goNext, goPrev });
  const { toolsOpen, setToolsOpen } = useToolsSheet(num);
  const toolsTrapRef = useFocusTrap<HTMLDivElement>(toolsOpen, () => setToolsOpen(false));

  useEffect(() => {
    if (!chapter) return;
    const main = chapter.title.split(" — ")[0];
    const label = lang === "fr"
      ? (num === 0 ? "Pages liminaires" : isBackMatter(num, book) ? "Annexe — Bibliothèque des sources" : `Chapitre ${num} : ${main}`)
      : (num === 0 ? "Front Matter" : isBackMatter(num, book) ? "Source Library Appendix" : `Chapter ${num}: ${main}`);
    document.title = `${label} — Data Goblin`;
  }, [chapter, num, lang]);

  const spineShadow = c("rgba(60,50,30,0.22)", "rgba(0,0,0,0.55)");
  const pageShadow = c(
    "0 14px 40px rgba(60,50,30,0.35), 0 3px 10px rgba(60,50,30,0.2)",
    "0 14px 40px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"
  );
  const statusStyle = {
    fontFamily: BODY,
    fontSize: "14px",
    fontStyle: "italic" as const,
    color: c(...P.muted),
    padding: "40px",
    textAlign: "center" as const,
  };

  const bottomBar = (
    <BottomBar
      book={book}
      activeChapter={num}
      page={page}
      pageCount={pageCount}
      onPrev={goPrev}
      onNext={goNext}
      bookmarked={bookmarked}
      onToggleBookmark={onToggleBookmark}
    />
  );

  // ------------------------------------------------------------------ phone / tablet
  if (single) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, position: "relative" }}>
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            flex: 1,
            minHeight: 0,
            background: c(...P.appBg),
            padding: mode === "phone" ? "10px 10px 12px" : "18px 24px 20px",
            display: "flex",
            justifyContent: "center",
            transition: "background 0.3s",
            overflow: "hidden",
          }}
        >
          {error && <div style={statusStyle}>{tr("Could not load chapter")} {num}. ({error})</div>}
          {!chapter && !error && <div style={statusStyle}>{tr("Opening the field guide…")}</div>}
          {chapter && panels && (
            <div style={{ position: "relative", width: "100%", maxWidth: "720px", height: "100%" }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                boxShadow: pageShadow,
                borderRadius: "3px",
                overflow: "hidden",
                position: "relative",
                border: `1px solid ${c("#b8ad92", "#262c3a")}`,
              }}
            >
              <PagePanel
                key={`${num}-${aligned}`}
                chapter={chapter}
                blocks={panels[aligned] ?? []}
                side="left"
                folio={folio(num, aligned + 1)}
                opener={aligned === 0}
              />
            </div>
            <EdgeNav onPrev={goPrev} onNext={goNext} canPrev={canPrev} canNext={canNext} outset={mode === "phone" ? 8 : -22} />
            </div>
          )}
        </div>

        {bottomBar}

        {/* Floating goblin-tools button + bottom sheet */}
        {chapter && (
          <>
            <button
              onClick={() => setToolsOpen(true)}
              aria-label={tr("Open field tools")}
              title={tr("Field tools")}
              style={{
                position: "fixed",
                right: "14px",
                bottom: "72px",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: c(...P.panelBg),
                border: `1px solid ${c(...P.borderSoft)}`,
                boxShadow: c("0 4px 14px rgba(40,30,10,0.35)", "0 4px 14px rgba(0,0,0,0.6)"),
                cursor: "pointer",
                lineHeight: 1,
                zIndex: 60,
                display: toolsOpen ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <NavIcon name="pack-nav" size={40} />
            </button>

            {toolsOpen && (
              <>
                <div
                  onClick={() => setToolsOpen(false)}
                  style={{ position: "fixed", inset: 0, background: c("rgba(35,33,26,0.4)", "rgba(0,0,0,0.6)"), zIndex: 119 }}
                />
                <div
                  ref={toolsTrapRef}
                  tabIndex={-1}
                  role="dialog"
                  aria-modal="true"
                  aria-label={tr("Goblin tools")}
                  style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxHeight: "72vh",
                    background: c(...P.panelBgAlt),
                    borderTop: `1px solid ${c(...P.borderSoft)}`,
                    borderRadius: "12px 12px 0 0",
                    zIndex: 120,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: c("0 -8px 30px rgba(40,30,10,0.3)", "0 -8px 30px rgba(0,0,0,0.7)"),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 8px 6px 18px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: c(...P.muted) }}>
                      {tr("Field Guide Tools ·")}{" "}
                      {num === 0 ? "Front Matter" : isBackMatter(num, book) ? "Appendix" : `Ch. ${num}`}
                    </span>
                    <button
                      onClick={() => setToolsOpen(false)}
                      aria-label={tr("Close tools")}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", background: "none", border: "none", cursor: "pointer", color: c(...P.muted) }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 14px 24px", borderRadius: RADIUS }}>
                    <GoblinTools chapter={chapter} />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ desktop spread
  const left = panels?.[aligned] ?? [];
  const right = panels?.[aligned + 1] ?? [];
  const singleArtSpread = left.length === 1 && left[0]?.kind === "panel" && right.length === 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr) 280px",
        gridTemplateRows: "minmax(0, 1fr) auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      <LeftSidebar book={book} activeChapter={num} />

      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          background: c(...P.appBg),
          padding: "18px 28px",
          display: "flex",
          justifyContent: "center",
          transition: "background 0.3s",
        }}
      >
        {error && <div style={{ ...statusStyle, textAlign: "left" }}>{tr("Could not load chapter")} {num}. ({error})</div>}
        {!chapter && !error && <div style={statusStyle}>{tr("Opening the field guide…")}</div>}
        {chapter && panels && (
          <div style={{ position: "relative", width: "100%", maxWidth: "1400px", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: singleArtSpread ? "1fr" : "1fr 1fr",
              width: "100%",
              height: "100%",
              boxShadow: pageShadow,
              borderRadius: "3px",
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${c("#b8ad92", "#262c3a")}`,
            }}
          >
            <PagePanel
              key={`${num}-${aligned}-left`}
              chapter={chapter}
              blocks={left}
              side="left"
              folio={folio(num, aligned + 1)}
              opener={aligned === 0}
            />
            {!singleArtSpread && (
              <>
                <PagePanel
                  key={`${num}-${aligned}-right`}
                  chapter={chapter}
                  blocks={right}
                  side="right"
                  folio={folio(num, aligned + 2)}
                />
                {/* Book spine divider */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: "26px",
                    transform: "translateX(-50%)",
                    background: `linear-gradient(to right, transparent, ${spineShadow} 48%, ${spineShadow} 52%, transparent)`,
                    pointerEvents: "none",
                  }}
                />
              </>
            )}
          </div>
            <EdgeNav onPrev={goPrev} onNext={goNext} canPrev={canPrev} canNext={canNext} outset={-22} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {chapter ? (
          <RightSidebar chapter={chapter} />
        ) : (
          <aside style={{ flex: 1, background: c(...P.panelBgAlt), borderLeft: `1px solid ${c(...P.borderSoft)}` }} />
        )}
      </div>

      <div style={{ gridColumn: "1 / -1" }}>{bottomBar}</div>
    </div>
  );
}
