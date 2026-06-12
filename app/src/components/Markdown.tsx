import { CSSProperties, memo, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { NavIcon } from "./GoblinMascot";
import { AUTOLINK_TITLE } from "../links";
import { artUrl } from "../useContent";

// ---------------------------------------------------------------------------
// Markdown renderer for chapter prose. Detects the manuscript's structural
// blockquotes and renders them as field-guide callouts:
//   > **🧌 GOBLIN CHECK** …      → green goblin callout card
//   > **📦 CHAPTER RECAP …** …   → recap box
// Everything else gets printed-book typography. Sizes come from the reader
// type scale (viewport mode + dyslexia-friendly reading mode).
// ---------------------------------------------------------------------------

interface HastNode {
  type?: string;
  value?: string;
  children?: HastNode[];
}

function nodeText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeText).join("");
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
        <NavIcon name="check-nav" size={77} />
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
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontFamily: MONO,
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: c(...P.green),
          marginBottom: "8px",
        }}
      >
        <NavIcon name="chapter-recap-nav" size={36} />
        Chapter Recap
      </div>
      <div style={{ fontFamily: t.bodyFont, fontSize: `${t.callout}px`, lineHeight: t.bodyLh, letterSpacing: t.letterSpacing, wordSpacing: t.wordSpacing }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Memoized per panel block: re-parsing markdown is the priciest part of a
 * page render, so unrelated state changes (search typing, tool sheets,
 * sidebar toggles) skip it entirely. Theme/reader context changes still
 * propagate through the memo as normal context updates.
 */
export const Markdown = memo(MarkdownInner);

function MarkdownInner({ markdown, style }: { markdown: string; style?: CSSProperties }) {
  const { c } = useTheme();
  const { t } = useReader();
  const bodyText = c(...P.body);
  const ink = c(...P.ink);
  const border = c(...P.border);
  const navy = c(...P.navy);

  const bodySize = `${t.body}px`;

  return (
    <div
      style={{
        fontFamily: t.bodyFont,
        color: bodyText,
        letterSpacing: t.letterSpacing,
        wordSpacing: t.wordSpacing,
        ...style,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p style={{ fontSize: bodySize, lineHeight: t.bodyLh, margin: "0 0 14px" }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: ink }}>{children}</strong>
          ),
          em: ({ children }) =>
            t.italicsOff ? (
              <em style={{ fontStyle: "normal" }}>{children}</em>
            ) : (
              <em>{children}</em>
            ),
          a: ({ href, children, title }) => {
            // Pipeline autolinks (first verbatim mention of a references-list
            // name on the page) get the subtler dotted underline; authored
            // links are navy with a solid underline on hover.
            const auto = title === AUTOLINK_TITLE;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={auto ? "gob-autolink" : "gob-link"}
                title={auto ? undefined : title}
                style={{ color: navy, textDecorationColor: `${navy}66` }}
              >
                {children}
              </a>
            );
          },
          h1: ({ children }) => (
            <h2 style={{ fontFamily: DISPLAY, fontSize: `${t.h1}px`, fontWeight: 800, color: ink, margin: "24px 0 11px", lineHeight: 1.2 }}>
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 style={{ fontFamily: DISPLAY, fontSize: `${t.h2}px`, fontWeight: 700, color: ink, margin: "22px 0 9px", lineHeight: 1.25 }}>
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 style={{ fontFamily: DISPLAY, fontSize: `${t.h3}px`, fontWeight: 700, color: ink, margin: "20px 0 8px", lineHeight: 1.3 }}>
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 style={{ fontFamily: UI, fontSize: `${t.h4}px`, fontWeight: 700, color: ink, margin: "18px 0 7px", letterSpacing: "0.04em" }}>
              {children}
            </h5>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 14px", paddingLeft: "22px", fontSize: bodySize, lineHeight: t.bodyLh }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 14px", paddingLeft: "24px", fontSize: bodySize, lineHeight: t.bodyLh }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: "5px" }}>{children}</li>,
          hr: () => (
            <div style={{ margin: "18px auto", width: "70px", borderTop: `1px solid ${border}`, textAlign: "center" }} />
          ),
          img: ({ src, alt }) => {
            // Manuscript art references are written relative to public/art/
            // (e.g. "art/icons/check-nav.webp"); resolve them through artUrl
            // so they work under any deploy base. Icons render inline at
            // text scale; anything else gets a sane block presentation.
            const rel = typeof src === "string" ? src : "";
            const resolved = rel.startsWith("art/") ? artUrl(rel.slice(4)) : rel;
            const isIcon = rel.includes("/icons/");
            const isSmallArt = rel.includes("/small/");
            const isGoblinCheckIcon = rel.includes("check-nav") || String(alt ?? "").toLowerCase().includes("goblin check");
            return (
              <img
                src={resolved}
                alt={alt ?? ""}
                loading="lazy"
                decoding="async"
                style={
                  isIcon
                    ? { width: isGoblinCheckIcon ? "72px" : "48px", height: isGoblinCheckIcon ? "72px" : "48px", objectFit: "contain", display: "inline-block", verticalAlign: isGoblinCheckIcon ? "-23px" : "-14px" }
                    : isSmallArt
                      ? { width: "264px", maxWidth: "100%", display: "block", margin: "12px auto", objectFit: "contain" }
                      : { maxWidth: "100%", display: "block", margin: "10px auto" }
                }
              />
            );
          },
          code: ({ children }) => (
            <code style={{ fontFamily: MONO, fontSize: `${t.body - 2.5}px`, background: c("#eee8d8", "#1d2230"), padding: "1px 5px", borderRadius: RADIUS }}>
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  border: `1px solid ${border}`,
                fontSize: `${t.table + 0.5}px`,
                  background: c(...P.cardBg),
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          th: ({ children }) => (
            <th
              style={{
                fontFamily: UI,
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textAlign: "left",
                color: c(...P.greenDeep),
                background: c(...P.greenBg),
                borderBottom: `1px solid ${border}`,
                borderRight: `1px solid ${border}`,
                padding: "8px 11px",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                fontFamily: t.bodyFont,
                lineHeight: 1.55,
                verticalAlign: "top",
                borderBottom: `1px solid ${c(...P.borderSoft)}`,
                borderRight: `1px solid ${c(...P.borderSoft)}`,
                padding: "9px 11px",
              }}
            >
              {children}
            </td>
          ),
          blockquote: ({ node, children }) => {
            const text = nodeText(node as HastNode);
            if (text.includes("🧌 GOBLIN CHECK") || text.includes("GOBLIN CHECK")) {
              return <GoblinCheckCard>{children}</GoblinCheckCard>;
            }
            if (text.includes("📦 CHAPTER RECAP") || text.includes("CHAPTER RECAP")) {
              return <RecapBox>{children}</RecapBox>;
            }
            return (
              <blockquote
                style={{
                  margin: "0 0 14px",
                  padding: "4px 16px",
                  borderLeft: `3px solid ${border}`,
                  fontStyle: t.italicsOff ? "normal" : "italic",
                  color: c(...P.muted),
                }}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
