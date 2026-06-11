import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P } from "../theme";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { BottomBar } from "../components/BottomBar";
import { PagePanel } from "../components/PagePanel";
import { useBook, useChapter, useTraps } from "../useContent";
import { getSavedSpread, LAST_SPREAD, paginateChapter, saveSpread } from "../pagination";

const TOTAL_CHAPTERS = 19;

/**
 * The Field Guide: TOC sidebar / paginated two-page book spread / tools
 * sidebar / bottom progress bar. Routes "/" (chapter 1) and "/chapter/:num".
 * The spread is viewport-fitted; ArrowLeft/ArrowRight and the bottom-bar
 * buttons turn pages, crossing chapter boundaries at either end.
 */
export function FieldGuidePage() {
  const { c } = useTheme();
  const params = useParams<{ num?: string }>();
  const navigate = useNavigate();
  const num = Math.max(1, Math.min(TOTAL_CHAPTERS, parseInt(params.num ?? "1", 10) || 1));

  const { data: book } = useBook();
  const { data: chapter, error } = useChapter(num);
  const { data: traps } = useTraps();
  const trap = traps?.[String(num)] ?? null;

  // Redirect out-of-range chapter numbers to the clamped chapter.
  useEffect(() => {
    if (params.num && String(num) !== params.num) navigate(`/chapter/${num}`, { replace: true });
  }, [params.num, num, navigate]);

  // Paginate the chapter into spreads (memoised per chapter+trap).
  const spreads = useMemo(
    () => (chapter ? paginateChapter(chapter, trap) : null),
    [chapter, trap]
  );

  // Current spread index — restored from localStorage per chapter, clamped to
  // the live spread count so stale positions recover gracefully.
  const [spreadIdx, setSpreadIdx] = useState(() => getSavedSpread(num));
  useEffect(() => {
    setSpreadIdx(getSavedSpread(num));
  }, [num]);
  const total = spreads ? spreads.length : 1;
  const cur = Math.max(0, Math.min(spreadIdx, total - 1));
  useEffect(() => {
    if (spreads) saveSpread(num, cur);
  }, [spreads, num, cur]);

  const goNext = useCallback(() => {
    if (!spreads) return;
    if (cur < total - 1) {
      setSpreadIdx(cur + 1);
    } else if (num < TOTAL_CHAPTERS) {
      saveSpread(num + 1, 0);
      navigate(`/chapter/${num + 1}`);
    }
  }, [spreads, cur, total, num, navigate]);

  const goPrev = useCallback(() => {
    if (!spreads) return;
    if (cur > 0) {
      setSpreadIdx(cur - 1);
    } else if (num > 1) {
      saveSpread(num - 1, LAST_SPREAD); // clamped to the last spread on load
      navigate(`/chapter/${num - 1}`);
    }
  }, [spreads, cur, num, navigate]);

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

  const spread = spreads ? spreads[cur] : null;
  const spineShadow = c("rgba(60,50,30,0.22)", "rgba(0,0,0,0.55)");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "215px 1fr 240px",
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
          padding: "16px 22px",
          display: "flex",
          justifyContent: "center",
          transition: "background 0.3s",
        }}
      >
        {error && (
          <div style={{ fontFamily: BODY, fontSize: "14px", fontStyle: "italic", color: c(...P.muted), padding: "40px" }}>
            Could not load chapter {num}. ({error})
          </div>
        )}
        {!chapter && !error && (
          <div style={{ fontFamily: BODY, fontSize: "14px", fontStyle: "italic", color: c(...P.muted), padding: "40px", textAlign: "center" }}>
            Opening the field guide…
          </div>
        )}
        {chapter && spread && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              maxWidth: "1180px",
              height: "100%",
              boxShadow: c("0 14px 40px rgba(60,50,30,0.35), 0 3px 10px rgba(60,50,30,0.2)", "0 14px 40px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"),
              borderRadius: "3px",
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${c("#b8ad92", "#262c3a")}`,
            }}
          >
            <PagePanel
              key={`${num}-${cur}-left`}
              chapter={chapter}
              blocks={spread.left}
              side="left"
              pageNo={cur * 2 + 1}
              opener={cur === 0}
            />
            <PagePanel
              key={`${num}-${cur}-right`}
              chapter={chapter}
              blocks={spread.right}
              side="right"
              pageNo={cur * 2 + 2}
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

      <div style={{ gridColumn: "1 / -1" }}>
        <BottomBar
          book={book}
          activeChapter={num}
          spread={cur}
          spreadCount={total}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
