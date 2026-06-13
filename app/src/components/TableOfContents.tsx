import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { MONO, P, UI } from "../theme";
import { savePanel } from "../pagination";
import type { Book } from "../types";
import { displayRegion } from "../regionLabels";

function TocItem({
  num,
  indexLabel,
  title,
  active,
  touch,
  onNavigate,
}: {
  num: number;
  indexLabel: string;
  title: string;
  active: boolean;
  touch: boolean;
  onNavigate?: () => void;
}) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const navy = c(...P.navy);
  const navyDeep = c(...P.navyDeep);
  const hoverBg = c("rgba(26,46,74,0.08)", "rgba(122,180,232,0.12)");
  const activeText = c("#ffffff", "#0d1018");
  const text = c(...P.body);
  const partLabel = c(...P.faint);

  return (
    <button
      onClick={() => {
        savePanel(num, 0);
        navigate(`/chapter/${num}`);
        onNavigate?.();
      }}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: touch ? "9px" : "7px",
        width: "100%",
        minHeight: touch ? "44px" : undefined,
        padding: touch ? "12px 16px 12px 13px" : "7px 18px 7px 15px",
        background: active ? navy : hovered ? hoverBg : "transparent",
        borderLeft: active ? `3px solid ${navyDeep}` : "3px solid transparent",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: "10px",
          color: active ? c("rgba(255,255,255,0.68)", "rgba(13,16,24,0.68)") : partLabel,
          minWidth: "22px",
          flexShrink: 0,
          fontWeight: 600,
        }}
      >
        {indexLabel}
      </span>
      <span style={{ fontFamily: UI, fontSize: touch ? "13.5px" : "14px", fontWeight: active ? 700 : 500, color: active ? activeText : text, lineHeight: 1.35 }}>
        {title}
      </span>
    </button>
  );
}

function RegionLabel({ region, part }: { region: string; part?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ padding: "10px 18px 5px" }}>
      {part && (
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: c(...P.faint) }}>
          {part}
        </div>
      )}
      <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: c(...P.navy), marginTop: part ? "2px" : 0 }}>
        ◆ {displayRegion(region)}
      </div>
    </div>
  );
}

export function TocList({
  book,
  activeChapter,
  touch = false,
  onNavigate,
}: {
  book: Book | null;
  activeChapter: number;
  touch?: boolean;
  onNavigate?: () => void;
}) {
  const { c } = useTheme();
  return (
    <>
      {!book && (
        <div style={{ padding: "16px", fontFamily: UI, fontSize: "11px", color: c(...P.faint) }}>Loading contents…</div>
      )}
      {book?.frontMatter && (
        <div style={{ marginBottom: "6px" }}>
          <RegionLabel region={book.frontMatter.region} />
          <TocItem
            num={book.frontMatter.number}
            indexLabel="i."
            title={book.frontMatter.title}
            active={activeChapter === book.frontMatter.number}
            touch={touch}
            onNavigate={onNavigate}
          />
        </div>
      )}
      {book?.parts.map((part) => (
        <div key={part.part} style={{ marginBottom: "6px" }}>
          <RegionLabel region={part.region} part={part.part} />
          {part.chapters.map((ch) => (
            <TocItem
              key={ch.number}
              num={ch.number}
              indexLabel={`${ch.number}.`}
              title={ch.title.split(" — ")[0]}
              active={ch.number === activeChapter}
              touch={touch}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
      {book?.backMatter && (
        <div style={{ marginBottom: "6px" }}>
          <RegionLabel region={book.backMatter.region} />
          <TocItem
            num={book.backMatter.number}
            indexLabel="A."
            title={book.backMatter.title}
            active={activeChapter === book.backMatter.number}
            touch={touch}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </>
  );
}
