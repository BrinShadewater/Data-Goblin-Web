import { useState } from "react";
import { useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { MONO, P, UI } from "../theme";
import { savePanel } from "../pagination";
import type { Book } from "../types";
import { displayRegion } from "../regionLabels";
import { tr } from "../i18n";

// A chapter's NEW/UPDATED badge auto-expires this many days after its date,
// so a stale tag never lingers even if the site isn't rebuilt.
const STATUS_TTL_DAYS = 30;

/** Returns "new" | "updated" only while the marker is still fresh; else null. */
function freshStatus(
  status?: "new" | "updated",
  statusDate?: string,
): "new" | "updated" | null {
  if (!status || !statusDate) return null;
  const then = Date.parse(statusDate);
  if (Number.isNaN(then)) return null;
  const ageDays = (Date.now() - then) / 86_400_000;
  return ageDays >= 0 && ageDays <= STATUS_TTL_DAYS ? status : null;
}

function StatusBadge({ status, active }: { status: "new" | "updated"; active: boolean }) {
  const { c } = useTheme();
  const green = c(...P.green);
  const onActive = c("#ffffff", "#0d1018");
  const tone = active ? onActive : green;
  return (
    <span
      style={{
        marginLeft: "auto",
        alignSelf: "center",
        flexShrink: 0,
        fontFamily: MONO,
        fontSize: "8px",
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        lineHeight: 1,
        padding: "2px 5px",
        borderRadius: "3px",
        color: tone,
        border: `1px solid ${tone}`,
        opacity: active ? 0.85 : 1,
      }}
    >
      {status === "new" ? tr("New") : tr("Updated")}
    </span>
  );
}

function TocItem({
  num,
  indexLabel,
  title,
  active,
  touch,
  onNavigate,
  status,
  statusDate,
}: {
  num: number;
  indexLabel: string;
  title: string;
  active: boolean;
  touch: boolean;
  onNavigate?: () => void;
  status?: "new" | "updated";
  statusDate?: string;
}) {
  const fresh = freshStatus(status, statusDate);
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
      {fresh && <StatusBadge status={fresh} active={active} />}
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
        <div style={{ padding: "16px", fontFamily: UI, fontSize: "11px", color: c(...P.faint) }}>{tr("Loading contents…")}</div>
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
              status={ch.status}
              statusDate={ch.statusDate}
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
