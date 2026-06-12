import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Flag, Wrench } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { Markdown } from "./Markdown";
import { classifySource, TAG_COLORS } from "../sources";
import { matchSource } from "../links";
import { useChapter } from "../useContent";
import type { LinkEntry, Receipt, ReceiptStatus } from "../types";

const STATUS_META: Record<ReceiptStatus, { label: string; icon: typeof CheckCircle2; pair: [string, string] }> = {
  resolved: { label: "Resolved", icon: CheckCircle2, pair: ["#2d5a27", "#74b85e"] },
  fixed: { label: "Fixed", icon: Wrench, pair: ["#9a6510", "#d9a23f"] },
  open: { label: "Open", icon: Flag, pair: ["#a8321f", "#e06848"] },
};

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const { c } = useTheme();
  const meta = STATUS_META[status];
  const color = c(...meta.pair);
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: MONO,
        fontSize: "8.5px",
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${color}66`,
        borderRadius: RADIUS,
        padding: "3px 8px",
        flexShrink: 0,
      }}
    >
      <Icon size={11} strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}

export function ReceiptRow({ receipt }: { receipt: Receipt }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const green = c(...P.green);

  return (
    <div style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderRadius: RADIUS, marginBottom: "8px", overflow: "hidden", transition: "background 0.3s" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        {open ? <ChevronDown size={13} color={muted} style={{ flexShrink: 0 }} /> : <ChevronRight size={13} color={muted} style={{ flexShrink: 0 }} />}
        <span style={{ fontFamily: MONO, fontSize: "9px", color: muted, flexShrink: 0, minWidth: "24px" }}>#{receipt.id}</span>
        <span style={{ flex: 1, fontFamily: UI, fontSize: "13.5px", fontWeight: 600, color: body, lineHeight: 1.4 }}>{receipt.claim}</span>
        <StatusBadge status={receipt.status} />
      </button>
      {open && (
        <div style={{ padding: "2px 14px 13px 39px", borderTop: `1px solid ${border}` }}>
          <div style={{ paddingTop: "10px" }}>
            <Markdown markdown={receipt.detail} />
          </div>
          {receipt.links.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {receipt.links.map(([label, url], i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontFamily: UI,
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: green,
                    border: `1px solid ${green}55`,
                    borderRadius: RADIUS,
                    padding: "4px 9px",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={10} />
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChapterSourcesRow({
  num,
  title,
  links,
}: {
  num: number;
  title: string;
  links: LinkEntry[] | null;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: chapter, error } = useChapter(open ? num : null);
  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const navy = c(...P.navy);

  const sources = chapter?.sources ?? [];

  return (
    <div style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderRadius: RADIUS, marginBottom: "8px", overflow: "hidden", transition: "background 0.3s" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        {open ? <ChevronDown size={13} color={muted} style={{ flexShrink: 0 }} /> : <ChevronRight size={13} color={muted} style={{ flexShrink: 0 }} />}
        <span style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, color: muted, flexShrink: 0, minWidth: "30px" }}>
          Ch.{num}
        </span>
        <span style={{ flex: 1, fontFamily: DISPLAY, fontSize: "15px", fontWeight: 700, color: navy, lineHeight: 1.35 }}>
          {title.split(" — ")[0]}
        </span>
      </button>
      {open && (
        <div style={{ padding: "4px 14px 13px 39px", borderTop: `1px solid ${border}` }}>
          {error && (
            <p style={{ fontFamily: BODY, fontStyle: "italic", fontSize: "12.5px", color: muted }}>
              Could not load this chapter&rsquo;s sources. ({error})
            </p>
          )}
          {!chapter && !error && (
            <p style={{ fontFamily: BODY, fontStyle: "italic", fontSize: "12.5px", color: muted, margin: "10px 0 0" }}>
              Rummaging through the hoard…
            </p>
          )}
          {chapter && sources.length === 0 && (
            <p style={{ fontFamily: BODY, fontStyle: "italic", fontSize: "12.5px", color: muted, margin: "10px 0 0" }}>
              No sources block recorded for this chapter.
            </p>
          )}
          {sources.map((s, i) => {
            const tag = classifySource(s);
            const tagColor = c(TAG_COLORS[tag].light, TAG_COLORS[tag].dark);
            const link = links ? matchSource(s, links) : null;
            return (
              <div
                key={i}
                style={{
                  padding: "9px 0",
                  borderBottom: i < sources.length - 1 ? `1px solid ${border}` : "none",
                }}
              >
                <p style={{ fontFamily: BODY, fontSize: "13px", color: body, margin: "0 0 4px", lineHeight: 1.5 }}>
                  {link ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="gob-link" style={{ color: navy }}>
                      {s}
                      <ExternalLink size={11} style={{ marginLeft: "5px", verticalAlign: "-1px" }} />
                    </a>
                  ) : (
                    s
                  )}
                </p>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "7.5px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: tagColor,
                    border: `1px solid ${tagColor}55`,
                    borderRadius: RADIUS,
                    padding: "1px 5px",
                  }}
                >
                  {tag}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
