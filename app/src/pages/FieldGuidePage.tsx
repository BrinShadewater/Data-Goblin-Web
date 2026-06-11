import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P } from "../theme";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { BottomBar } from "../components/BottomBar";
import { LeftPage } from "../components/LeftPage";
import { RightPage } from "../components/RightPage";
import { useBook, useChapter, useTraps } from "../useContent";

/**
 * The Field Guide: TOC sidebar / two-page book spread / tools sidebar /
 * bottom progress bar. Routes "/" (chapter 1) and "/chapter/:num".
 */
export function FieldGuidePage() {
  const { c } = useTheme();
  const params = useParams<{ num?: string }>();
  const navigate = useNavigate();
  const num = Math.max(1, Math.min(19, parseInt(params.num ?? "1", 10) || 1));

  const { data: book } = useBook();
  const { data: chapter, error } = useChapter(num);
  const { data: traps } = useTraps();
  const trap = traps?.[String(num)] ?? null;

  // Redirect out-of-range chapter numbers to the clamped chapter.
  useEffect(() => {
    if (params.num && String(num) !== params.num) navigate(`/chapter/${num}`, { replace: true });
  }, [params.num, num, navigate]);

  // Scroll the spread back to the top when the chapter changes.
  useEffect(() => {
    document.getElementById("book-scroll")?.scrollTo({ top: 0 });
  }, [num]);

  const spineShadow = c("rgba(60,50,30,0.22)", "rgba(0,0,0,0.55)");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 270px",
        gridTemplateRows: "minmax(0, 1fr) auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      <LeftSidebar book={book} activeChapter={num} />

      <div
        id="book-scroll"
        style={{
          overflowY: "auto",
          minWidth: 0,
          background: c(...P.appBg),
          padding: "26px 28px 40px",
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
        {chapter && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              maxWidth: "1060px",
              margin: "0 auto",
              boxShadow: c("0 14px 40px rgba(60,50,30,0.35), 0 3px 10px rgba(60,50,30,0.2)", "0 14px 40px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"),
              borderRadius: "3px",
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${c("#b8ad92", "#262c3a")}`,
            }}
          >
            <LeftPage chapter={chapter} />
            <RightPage chapter={chapter} trap={trap} />
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
        <BottomBar book={book} activeChapter={num} />
      </div>
    </div>
  );
}
