import { ReactNode, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Flag,
  ScrollText,
  Wrench,
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { Markdown } from "../components/Markdown";
import { classifySource, TAG_COLORS } from "../sources";
import { matchSource } from "../links";
import { useBook, useChapter, useLinks, useReceipts } from "../useContent";
import type { LinkEntry, Receipt, ReceiptStatus } from "../types";

// ---------------------------------------------------------------------------
// Receipts page — two tabs:
//   "Sources" (default): the book's actual receipts — every chapter's primary
//     sources, with links where they can be matched to the reference list.
//   "Verification Log": the book fact-checking ITSELF — the audit-trail
//     ledger of claims checked against primary documents.
// ---------------------------------------------------------------------------

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

function ReceiptRow({ receipt }: { receipt: Receipt }) {
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

/** One chapter's accordion row on the Sources tab. Content loads on open. */
function ChapterSourcesRow({
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

type Tab = "sources" | "log";

export function ReceiptsPage() {
  const { c } = useTheme();
  const [tab, setTab] = useState<Tab>("sources");
  const { data: receipts, error } = useReceipts();
  const { data: book } = useBook();
  const { data: links } = useLinks();

  const bg = c(...P.panelBg);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const red = c(...P.red);
  const green = c(...P.green);
  const border = c(...P.borderSoft);

  const sections = receipts ? [...new Set(receipts.map((r) => r.section))] : [];
  const chapterRefs = book ? book.parts.flatMap((p) => p.chapters) : [];
  const totalChapters = chapterRefs.length || 19;

  const tabButton = (key: Tab, icon: ReactNode, label: string) => {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        aria-pressed={active}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "9px 16px",
          background: active ? green : "transparent",
          color: active ? c("#f4f0e0", "#0d1018") : green,
          border: `1.5px solid ${green}`,
          borderRadius: RADIUS,
          cursor: "pointer",
          fontFamily: UI,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          transition: "all 0.15s",
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px clamp(16px, 5vw, 40px) 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide · Receipts
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 14px", lineHeight: 1.05, textTransform: "uppercase" }}>
            Receipts
          </h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {tabButton("sources", <BookOpen size={12} strokeWidth={2.2} />, "Sources")}
            {tabButton("log", <ScrollText size={12} strokeWidth={2.2} />, "Verification Log")}
          </div>
        </div>

        {tab === "sources" && (
          <>
            <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.65, margin: "0 0 20px" }}>
              Every chapter&rsquo;s primary sources. The goblin keeps the receipts &mdash; open a chapter to see
              what it leans on, and follow the links to read the originals yourself.
            </p>
            {!book && (
              <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Pulling the source hoard…</p>
            )}
            {chapterRefs.map((ch) => (
              <ChapterSourcesRow key={ch.number} num={ch.number} title={ch.title} links={links} />
            ))}
            {book && (
              <div style={{ fontFamily: MONO, fontSize: "9px", color: muted, marginTop: "12px" }}>
                {totalChapters} chapters · full citations live in the Source Library Appendix
                {book ? ` · as of ${book.asOf}` : ""}
              </div>
            )}
          </>
        )}

        {tab === "log" && (
          <>
            <div
              style={{
                background: c(...P.cardBg),
                border: `1px solid ${border}`,
                borderLeft: `4px solid ${green}`,
                borderRadius: RADIUS,
                padding: "13px 16px",
                marginBottom: "22px",
              }}
            >
              <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.65, margin: 0 }}>
                This log is the book fact-checking <em>itself</em>. Before publication (and after), every
                load-bearing claim gets pulled back out of the text and checked against primary documents.
                What you see here is the audit trail: claims verified, errors found and corrected in public,
                and the flags still open. It isn&rsquo;t errata chaos &mdash; it&rsquo;s the goblin showing
                its work, on the theory that a field guide about verifying things should let you verify the
                field guide.
              </p>
            </div>

            {error && (
              <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Could not load the verification log. ({error})</p>
            )}
            {!receipts && !error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Pulling receipts from the hoard…</p>}

            {sections.map((section) => {
              const items = receipts!.filter((r) => r.section === section);
              return (
                <div key={section} style={{ marginBottom: "26px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                    <h2 style={{ fontFamily: DISPLAY, fontSize: "17px", fontWeight: 700, color: navy, margin: 0 }}>{section}</h2>
                    <span style={{ fontFamily: MONO, fontSize: "9px", color: muted }}>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {items.map((r) => (
                    <ReceiptRow key={r.id} receipt={r} />
                  ))}
                </div>
              );
            })}

            {receipts && (
              <div style={{ fontFamily: MONO, fontSize: "9px", color: muted, marginTop: "8px" }}>
                {receipts.length} ledger entries · {receipts.filter((r) => r.status === "open").length} still open ·
                covering {totalChapters} chapters{book ? ` · as of ${book.asOf}` : ""}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
