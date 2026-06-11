import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Flag, Wrench } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { Markdown } from "../components/Markdown";
import { useBook, useReceipts } from "../useContent";
import type { Receipt, ReceiptStatus } from "../types";

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
        <span style={{ flex: 1, fontFamily: UI, fontSize: "12.5px", fontWeight: 600, color: body, lineHeight: 1.4 }}>{receipt.claim}</span>
        <StatusBadge status={receipt.status} />
      </button>
      {open && (
        <div style={{ padding: "2px 14px 13px 39px", borderTop: `1px solid ${border}` }}>
          <div style={{ paddingTop: "10px" }}>
            <Markdown markdown={receipt.detail} style={{ fontSize: "12.5px" }} />
          </div>
          {receipt.links.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {receipt.links.map(([label, url], i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
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

export function ReceiptsPage() {
  const { c } = useTheme();
  const { data: receipts, error } = useReceipts();
  const { data: book } = useBook();

  const bg = c(...P.panelBg);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const red = c(...P.red);

  const sections = receipts ? [...new Set(receipts.map((r) => r.section))] : [];
  const totalChapters = book ? book.parts.reduce((a, p) => a + p.chapters.length, 0) : 19;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px 40px 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ marginBottom: "26px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide · Verification Ledger
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 10px", lineHeight: 1.05, textTransform: "uppercase" }}>
            Receipts
          </h1>
          <p style={{ fontFamily: BODY, fontSize: "14px", color: body, lineHeight: 1.65, margin: 0 }}>
            Every load-bearing claim in the guide&rsquo;s {totalChapters} chapters is tracked in this ledger. Each entry
            records what was checked, what was found, and where the receipt lives. Click an entry to expand
            the detail and follow the source links.
          </p>
        </div>

        {error && (
          <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Could not load the receipts ledger. ({error})</p>
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
      </div>
    </div>
  );
}
