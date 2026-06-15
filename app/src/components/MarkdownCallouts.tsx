import { useRef, useState, type ReactNode } from "react";
import { Link } from "../i18nNav";
import { Check, Share2 } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { BODY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import type { Receipt } from "../types";
import { NavIcon } from "./GoblinMascot";
import { downloadCheckCard } from "../shareCard";
import { AnchoredPopover } from "./AnchoredPopover";

export interface HastNode {
  type?: string;
  value?: string;
  children?: HastNode[];
}

export function nodeText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeText).join("");
}

export function isGoblinCheckQuote(node: HastNode | undefined): boolean {
  const text = nodeText(node);
  return text.includes("🧌 GOBLIN CHECK") || text.includes("GOBLIN CHECK");
}

export function isChapterRecapQuote(node: HastNode | undefined): boolean {
  const text = nodeText(node);
  return text.includes("📦 CHAPTER RECAP") || text.includes("CHAPTER RECAP");
}

export function isGoblinFactsQuote(node: HastNode | undefined): boolean {
  const text = nodeText(node).trim();
  return /^GOBLIN FACTS?\b/i.test(text);
}

export function isExampleQuote(node: HastNode | undefined): boolean {
  const text = nodeText(node).trim();
  return /^EXAMPLE\b/i.test(text);
}

export function isAlignmentQuote(node: HastNode | undefined): boolean {
  const text = nodeText(node).trim();
  return /^ALIGNMENT\b/i.test(text);
}

export function GoblinCheckCard({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const { t } = useReader();
  const contentRef = useRef<HTMLDivElement>(null);
  const [shared, setShared] = useState(false);
  const onShare = async () => {
    const text = contentRef.current?.textContent?.trim();
    if (!text) return;
    await downloadCheckCard(text);
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  };
  return (
    <div
      style={{
        background: c(...P.greenBg),
        border: `1px solid ${c(...P.greenBorder)}`,
        borderLeft: `4px solid ${c(...P.green)}`,
        borderRadius: RADIUS,
        padding: "12px 16px",
        margin: "14px 0",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: "2px" }}>
        <NavIcon name="check-nav" size={TOKENS.icon.calloutCheck} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: c(...P.greenDeep),
            }}
          >
            Goblin Check
          </div>
          <button
            onClick={onShare}
            title="Save as a shareable image"
            aria-label="Save this Goblin Check as a shareable image"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              padding: "2px 4px",
              cursor: "pointer",
              fontFamily: MONO,
              fontSize: "8.5px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: c(...P.greenDeep),
              opacity: 0.72,
            }}
          >
            {shared ? <Check size={11} /> : <Share2 size={11} />}
            {shared ? "Saved" : "Share"}
          </button>
        </div>
        <div
          ref={contentRef}
          style={{
            fontFamily: t.bodyFont,
            fontSize: `${t.callout}px`,
            lineHeight: t.bodyLh,
            fontStyle: t.italicsOff ? "normal" : "italic",
            letterSpacing: t.letterSpacing,
            wordSpacing: t.wordSpacing,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}



export function ReceiptMarker({ receipt, children }: { receipt: Receipt; children: ReactNode }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tone = receipt.status === "open" ? c(...P.amber) : c(...P.greenDeep);
  const label = receipt.status === "open" ? "Still checking" : receipt.status === "fixed" ? "Corrected" : "Verified";
  const detail = (receipt.detail || "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[\s\u2705\u{1F50D}\u26A0\uFE0F\u{1F7E2}\u{1F7E1}\u{1F534}\u{1F9CC}]+/u, "")
    .replace(/\s*\|.*$/, "")
    .replace(/^(LARGELY RESOLVED|RESOLVED WITH CORRECTIONS|MOSTLY VERIFIED|CLAIM REVERSED|VERIFIED|RESOLVED|CORRECTED|FIXED|PARTIAL)\b[\s\u2014\u2013:-]*/i, "")
    .trim();
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span
        role="button"
        tabIndex={0}
        ref={anchorRef}
        aria-label={`Receipt — ${label}`}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ borderBottom: `1px dotted ${tone}`, cursor: "pointer", color: "inherit" }}
      >
        {children}
        <sup style={{ fontSize: "0.66em", color: tone, fontWeight: 800, marginLeft: "1.5px" }}>&#10003;</sup>
      </span>
      <AnchoredPopover anchorRef={anchorRef} open={open} width={320}>
        <span
          style={{
            display: "block", width: "100%",
            background: c(...P.cardBg), border: `1px solid ${c(...P.border)}`,
            borderLeft: `4px solid ${tone}`, borderRadius: RADIUS,
            boxShadow: c("0 6px 22px rgba(40,30,10,0.18)", "0 8px 24px rgba(0,0,0,0.55)"),
            padding: "11px 13px", fontStyle: "normal", fontWeight: 400, textAlign: "left",
            letterSpacing: "normal", whiteSpace: "normal",
          }}
        >
          <span style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: tone, marginBottom: "5px" }}>
            Receipt &middot; {label}
          </span>
          <span style={{ display: "block", fontFamily: BODY, fontSize: "13px", lineHeight: 1.5, color: c(...P.body) }}>
            {detail}
          </span>
          {receipt.links && receipt.links.length > 0 && (
            <span style={{ display: "block", marginTop: "8px" }}>
              {receipt.links.map(([lab, url], i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: c(...P.navy), marginRight: "10px" }}>
                  {lab} &#8599;
                </a>
              ))}
            </span>
          )}
          <span style={{ display: "block", marginTop: "8px" }}>
            <Link to="/receipts" style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: c(...P.muted) }}>
              See the full ledger &#8594;
            </Link>
          </span>
        </span>
      </AnchoredPopover>
    </span>
  );
}

export function GlossaryTerm({ term, def }: { term: string; def: string }) {
  const { c } = useTheme();
  const cleanDef = def
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const navy = c(...P.navy);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span
        role="button"
        tabIndex={0}
        ref={anchorRef}
        aria-label={`Definition of ${term}`}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ borderBottom: `1px dotted ${navy}`, color: "inherit", cursor: "help" }}
      >
        {term}
      </span>
      <AnchoredPopover anchorRef={anchorRef} open={open} width={280}>
        <span
          style={{
            display: "block",
            width: "100%",
            background: c(...P.cardBg),
            border: `1px solid ${c(...P.border)}`,
            borderRadius: RADIUS,
            boxShadow: c("0 6px 22px rgba(40,30,10,0.18)", "0 8px 24px rgba(0,0,0,0.55)"),
            padding: "10px 12px",
            fontFamily: BODY,
            fontSize: "13px",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: 1.5,
            color: c(...P.body),
            whiteSpace: "normal",
            textAlign: "left",
            letterSpacing: "normal",
          }}
        >
          <span style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: c(...P.greenDeep), marginBottom: "4px" }}>
            Loot · Glossary
          </span>
          {cleanDef}
        </span>
      </AnchoredPopover>
    </span>
  );
}

export function GoblinDeviceCard({
  children,
  icon,
  label,
  tone,
}: {
  children: ReactNode;
  icon: string;
  label: string;
  tone: "fact" | "example" | "alignment";
}) {
  const { c } = useTheme();
  const { t } = useReader();
  const color =
    tone === "fact" ? c(...P.greenDeep) : tone === "example" ? c(...P.navyDeep) : c(...P.amber);
  const bg =
    tone === "fact" ? c(...P.greenBg) : tone === "example" ? c(...P.navyBg) : c(...P.amberBg);
  const border =
    tone === "fact" ? c(...P.greenBorder) : tone === "example" ? c(...P.border) : c(...P.amberBorder);

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: RADIUS,
        padding: "12px 16px",
        margin: "14px 0",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: "1px" }}>
        <NavIcon name={icon} size={TOKENS.icon.calloutTrap} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color,
            marginBottom: "5px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: t.bodyFont,
            fontSize: `${t.callout}px`,
            lineHeight: t.bodyLh,
            letterSpacing: t.letterSpacing,
            wordSpacing: t.wordSpacing,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function RecapBox({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const { t } = useReader();
  return (
    <div
      style={{
        background: c(...P.panelBgAlt),
        border: `1px solid ${c(...P.border)}`,
        borderTop: `3px solid ${c(...P.green)}`,
        borderRadius: RADIUS,
        padding: "14px 18px",
        margin: "16px 0",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: c(...P.green),
          marginBottom: "8px",
        }}
      >
        Chapter Recap
      </div>
      <div style={{ fontFamily: t.bodyFont, fontSize: `${t.callout}px`, lineHeight: t.bodyLh, letterSpacing: t.letterSpacing, wordSpacing: t.wordSpacing }}>
        {children}
      </div>
    </div>
  );
}
