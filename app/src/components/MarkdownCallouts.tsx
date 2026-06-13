import type { ReactNode } from "react";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { MONO, P, RADIUS, TOKENS } from "../theme";
import { NavIcon } from "./GoblinMascot";

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
        <div
          style={{
            fontFamily: MONO,
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: c(...P.greenDeep),
            marginBottom: "5px",
          }}
        >
          Goblin Check
        </div>
        <div
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
