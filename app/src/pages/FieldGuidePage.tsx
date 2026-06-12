import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { BODY, MONO, P, RADIUS } from "../theme";
import { LeftSidebar } from "../components/LeftSidebar";
import { GoblinTools, RightSidebar } from "../components/RightSidebar";
import { BottomBar } from "../components/BottomBar";
import { PagePanel } from "../components/PagePanel";
import { chapterPath, fetchJson, useArtMap, useBook, useChapter, useTraps } from "../useContent";
import {
  budgetsFor,
  getSavedPanel,
  hasAnySavedPosition,
  LAST_PANEL,
  paginatePanelsCached,
  savePanel,
} from "../pagination";
import { getLastLocation, saveLastLocation, toggleBookmark, useBookmarks } from "../bookmarks";
import { FIRST_DOC, folio, LAST_DOC, panelSnippet } from "../readerUtils";

/**
 * The Field Guide reader. Desktop (>1024px): TOC sidebar / two-page book
 * spread / tools sidebar / bottom bar. Phone (<700px) and tablet portrait
 * (700–1024px): a single page with swipe navigation, a compact bottom bar,
 * and the goblin tools behind a floating 🧌 bottom sheet. Routes "/" and
 * "/chapter/:num", where :num runs 0 (front matter) through 20 (appendix).
 * ArrowLeft/ArrowRight and the bottom-bar buttons turn pages, crossing
 * document boundaries at either end. Positions are stored as panel indices.
 */
export function FieldGuidePage() {
  const { c } = useTheme();
  const { mode, dyslexic } = useReader();
  const single = mode !== "desktop";
  const step = single ? 1 : 2;
  const params = useParams<{ num?: string }>();
  const navigate = useNavigate();

  // "/" resumes at the last-read location; first-time visitors land on the
  // Front Matter title page. Computed once per mount.
  const [defaultDoc] = useState(() => {
    const last = getLastLocation();
    if (last) return Math.max(FIRST_DOC, Math.min(LAST_DOC, Math.round(last.doc)));
    return hasAnySavedPosition() ? 1 : FIRST_DOC;
  });
  const parsed = parseInt(params.num ?? "", 10);
  const num =
    params.num == null
      ? defaultDoc
      : Math.max(FIRST_DOC, Math.min(LAST_DOC, Number.isFinite(parsed) ? parsed : 1));

  const { data: book } = useBook();
  const { data: chapter, error } = useChapter(num);
  const { data: traps } = useTraps();
  const trap = traps?.[String(num)] ?? null;

  // Redirect out-of-range chapter numbers to the clamped chapter.
  useEffect(() => {
    if (params.num && String(num) !== params.num) navigate(`/chapter/${num}`, { replace: true });
  }, [params.num, num, navigate]);

  // Paginate the chapter into panels for the active mode + reading mode.
  // Section-heading accents (art-map.json) are charged in the packer so
  // pages with ornaments still fit their panels.
  const { data: artMap } = useArtMap();
  const accents = useMemo(() => artMap?.docs?.[String(num)]?.accents ?? [], [artMap, num]);
  const artPanels = useMemo(() => artMap?.docs?.[String(num)]?.panels ?? [], [artMap, num]);
  const budgets = useMemo(() => budgetsFor(mode, dyslexic), [mode, dyslexic]);
  const panels = useMemo(
    () => (chapter ? paginatePanelsCached(chapter, trap, budgets, accents, artPanels) : null),
    [chapter, trap, budgets, accents, artPanels]
  );

  // Current panel index — restored from localStorage per chapter, clamped to
  // the live panel count so stale positions recover gracefully. Desktop
  // aligns to the spread's left (even) panel.
  const [panelIdx, setPanelIdx] = useState(() => getSavedPanel(num));
  useEffect(() => {
    setPanelIdx(getSavedPanel(num));
  }, [num]);
  const panelCount = panels ? panels.length : 1;
  const clamped = Math.max(0, Math.min(panelIdx, panelCount - 1));
  const aligned = single ? clamped : clamped - (clamped % 2);
  const pageCount = Math.max(1, Math.ceil(panelCount / step));
  const page = Math.floor(aligned / step);
  useEffect(() => {
    if (panels) {
      savePanel(num, aligned);
      saveLastLocation(num, aligned);
    }
  }, [panels, num, aligned]);

  // Prefetch the neighbouring document's JSON into the content cache when the
  // reader is within ~3 page turns of a chapter boundary, so crossing it
  // never shows the "Opening…" placeholder. fetchJson dedupes in-flight
  // requests and cache hits are free, so refiring is harmless.
  useEffect(() => {
    if (!panels) return;
    const turnsToEnd = Math.ceil((panelCount - (aligned + step)) / step);
    if (num < LAST_DOC && turnsToEnd <= 3) {
      fetchJson(chapterPath(num + 1)).catch(() => {});
    }
    if (num > FIRST_DOC && aligned / step <= 3) {
      fetchJson(chapterPath(num - 1)).catch(() => {});
    }
  }, [panels, panelCount, aligned, step, num]);

  const goNext = useCallback(() => {
    if (!panels) return;
    if (page < pageCount - 1) {
      setPanelIdx(aligned + step);
    } else if (num < LAST_DOC) {
      savePanel(num + 1, 0);
      navigate(`/chapter/${num + 1}`);
    }
  }, [panels, page, pageCount, aligned, step, num, navigate]);

  const goPrev = useCallback(() => {
    if (!panels) return;
    if (page > 0) {
      setPanelIdx(aligned - step);
    } else if (num > FIRST_DOC) {
      savePanel(num - 1, LAST_PANEL); // clamped to the last page on load
      navigate(`/chapter/${num - 1}`);
    }
  }, [panels, page, aligned, step, num, navigate]);

  // Arrow-key page turning — ignored while typing (Goblin Notes, search…).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // ---- Bookmarks: 🔖 toggles a saved place for the visible panel(s).
  const bookmarks = useBookmarks();
  const bookmarked = bookmarks.some(
    (b) => b.doc === num && b.panelIndex >= aligned && b.panelIndex < aligned + step
  );
  const onToggleBookmark = useCallback(() => {
    if (!chapter || !panels) return;
    const existing = bookmarks.find(
      (b) => b.doc === num && b.panelIndex >= aligned && b.panelIndex < aligned + step
    );
    toggleBookmark(
      existing ?? {
        doc: num,
        panelIndex: aligned,
        chapterTitle:
          num === 0 ? "Front Matter" : num === 20 ? "Appendix" : `${num}. ${chapter.title.split(" — ")[0]}`,
        snippet: panelSnippet(panels[aligned] ?? [], chapter),
        ts: Date.now(),
      }
    );
  }, [chapter, panels, bookmarks, num, aligned, step]);

  // ---- Swipe navigation (phone/tablet): horizontal intent only, never
  // hijacks vertical scrolling, ignores swipes that start in form fields.
  // Touches starting within 28px of either screen edge are ignored so the
  // page-turn never fights the iOS Safari edge back/forward gesture.
  const EDGE_GUARD = 28;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) {
      touchStart.current = null;
      return;
    }
    const t0 = e.touches[0];
    if (t0.clientX < EDGE_GUARD || t0.clientX > window.innerWidth - EDGE_GUARD) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: t0.clientX, y: t0.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t0 = e.changedTouches[0];
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // ---- Goblin tools bottom sheet (phone/tablet).
  const [toolsOpen, setToolsOpen] = useState(false);
  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen]);
  useEffect(() => setToolsOpen(false), [num]);

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
          {error && <div style={statusStyle}>Could not load chapter {num}. ({error})</div>}
          {!chapter && !error && <div style={statusStyle}>Opening the field guide…</div>}
          {chapter && panels && (
            <div
              style={{
                width: "100%",
                maxWidth: "720px",
                height: "100%",
                boxShadow: pageShadow,
                borderRadius: "3px",
                overflow: "hidden",
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
          )}
        </div>

        {bottomBar}

        {/* Floating goblin-tools button + bottom sheet */}
        {chapter && (
          <>
            <button
              onClick={() => setToolsOpen(true)}
              aria-label="Open goblin tools"
              style={{
                position: "fixed",
                right: "14px",
                bottom: "72px",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: c(...P.green),
                border: `1px solid ${c(...P.greenDeep)}`,
                boxShadow: c("0 4px 14px rgba(40,30,10,0.35)", "0 4px 14px rgba(0,0,0,0.6)"),
                cursor: "pointer",
                fontSize: "25px",
                lineHeight: 1,
                zIndex: 60,
                display: toolsOpen ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <span role="img" aria-hidden>🧌</span>
            </button>

            {toolsOpen && (
              <>
                <div
                  onClick={() => setToolsOpen(false)}
                  style={{ position: "fixed", inset: 0, background: c("rgba(35,33,26,0.4)", "rgba(0,0,0,0.6)"), zIndex: 119 }}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Goblin tools"
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
                      Field Guide Tools ·{" "}
                      {num === 0 ? "Front Matter" : num === 20 ? "Appendix" : `Ch. ${num}`}
                    </span>
                    <button
                      onClick={() => setToolsOpen(false)}
                      aria-label="Close tools"
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
        {error && <div style={{ ...statusStyle, textAlign: "left" }}>Could not load chapter {num}. ({error})</div>}
        {!chapter && !error && <div style={statusStyle}>Opening the field guide…</div>}
        {chapter && panels && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: singleArtSpread ? "1fr" : "1fr 1fr",
              width: "100%",
              maxWidth: "1400px",
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
