import { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { GoblinIcon } from "./GoblinMascot";

// ---------------------------------------------------------------------------
// Markdown renderer for chapter prose. Detects the manuscript's structural
// blockquotes and renders them as field-guide callouts:
//   > **🧌 GOBLIN CHECK** …      → green goblin callout card
//   > **📦 CHAPTER RECAP …** …   → recap box
// Everything else gets printed-book typography.
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
        <GoblinIcon size={24} />
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
        <div style={{ fontFamily: BODY, fontSize: "13px", lineHeight: 1.62, fontStyle: "italic" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function RecapBox({ children }: { children: ReactNode }) {
  const { c } = useTheme();
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
        📦 Chapter Recap
      </div>
      <div style={{ fontFamily: BODY, fontSize: "13px", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function Markdown({ markdown, style }: { markdown: string; style?: CSSProperties }) {
  const { c } = useTheme();
  const bodyText = c(...P.body);
  const ink = c(...P.ink);
  const border = c(...P.border);
  const green = c(...P.green);

  return (
    <div style={{ fontFamily: BODY, color: bodyText, ...style }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p style={{ fontSize: "13.5px", lineHeight: 1.74, margin: "0 0 13px" }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: ink }}>{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{ color: green, textDecorationColor: `${green}88` }}
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h2 style={{ fontFamily: DISPLAY, fontSize: "22px", fontWeight: 800, color: ink, margin: "22px 0 10px", lineHeight: 1.2 }}>
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 style={{ fontFamily: DISPLAY, fontSize: "18px", fontWeight: 700, color: ink, margin: "20px 0 8px", lineHeight: 1.25 }}>
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 style={{ fontFamily: DISPLAY, fontSize: "15.5px", fontWeight: 700, color: ink, margin: "18px 0 7px", lineHeight: 1.3 }}>
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: ink, margin: "16px 0 6px", letterSpacing: "0.04em" }}>
              {children}
            </h5>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 13px", paddingLeft: "22px", fontSize: "13.5px", lineHeight: 1.66 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 13px", paddingLeft: "24px", fontSize: "13.5px", lineHeight: 1.66 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: "5px" }}>{children}</li>,
          hr: () => (
            <div style={{ margin: "18px auto", width: "70px", borderTop: `1px solid ${border}`, textAlign: "center" }} />
          ),
          code: ({ children }) => (
            <code style={{ fontFamily: MONO, fontSize: "12px", background: c("#eee8d8", "#1d2230"), padding: "1px 5px", borderRadius: RADIUS }}>
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
                  fontSize: "12.5px",
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
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textAlign: "left",
                color: c(...P.greenDeep),
                background: c(...P.greenBg),
                borderBottom: `1px solid ${border}`,
                borderRight: `1px solid ${border}`,
                padding: "7px 10px",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                fontFamily: BODY,
                lineHeight: 1.5,
                verticalAlign: "top",
                borderBottom: `1px solid ${c(...P.borderSoft)}`,
                borderRight: `1px solid ${c(...P.borderSoft)}`,
                padding: "7px 10px",
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
                  margin: "0 0 13px",
                  padding: "4px 16px",
                  borderLeft: `3px solid ${border}`,
                  fontStyle: "italic",
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
