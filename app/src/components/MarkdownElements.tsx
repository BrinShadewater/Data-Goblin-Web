import { useMemo } from "react";
import type { Components } from "react-markdown";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { AUTOLINK_TITLE } from "../links";
import { artAspectRatio, artDimensions, artSrcSet, artUrl } from "../useContent";
import {
  GoblinCheckCard,
  GoblinDeviceCard,
  isAlignmentQuote,
  isChapterRecapQuote,
  isExampleQuote,
  isGoblinFactsQuote,
  isGoblinCheckQuote,
  RecapBox,
  type HastNode,
} from "./MarkdownCallouts";

export function useMarkdownComponents(): Components {
  const { c } = useTheme();
  const { t } = useReader();
  const ink = c(...P.ink);
  const border = c(...P.border);
  const navy = c(...P.navy);
  const bodySize = `${t.body}px`;

  return useMemo(
    () => ({
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
        const rel = typeof src === "string" ? src : "";
        const artRel = rel.startsWith("art/") ? rel.slice(4) : null;
        const dimensions = artRel ? artDimensions(artRel) : undefined;
        const resolved = artRel ? artUrl(artRel) : rel;
        const isIcon = rel.includes("/icons/");
        const isSmallArt = rel.includes("/small/");
        const isGoblinCheckIcon = rel.includes("check-nav") || String(alt ?? "").toLowerCase().includes("goblin check");
        const isGoblinTrapIcon = rel.includes("trap-nav") || String(alt ?? "").toLowerCase().includes("goblin trap");
        const isChapterRecapIcon = rel.includes("chapter-recap-nav") || String(alt ?? "").toLowerCase().includes("chapter recap");
        const iconSize = isGoblinCheckIcon
          ? TOKENS.icon.calloutCheck
          : isGoblinTrapIcon
            ? TOKENS.icon.calloutTrap
            : isChapterRecapIcon
              ? TOKENS.icon.calloutRecap
              : 48;
        const iconOffset = isGoblinCheckIcon ? -23 : iconSize >= 50 ? -17 : -14;
        return (
          <img
            src={resolved}
            srcSet={artRel ? artSrcSet(artRel) : undefined}
            sizes={artRel && !isIcon ? "(max-width: 760px) 92vw, 520px" : undefined}
            width={isIcon ? iconSize : dimensions?.width}
            height={isIcon ? iconSize : dimensions?.height}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            style={
              isIcon
                ? { width: `${iconSize}px`, height: `${iconSize}px`, objectFit: "contain", display: "inline-block", verticalAlign: `${iconOffset}px` }
                : isSmallArt
                  ? { width: "264px", maxWidth: "100%", aspectRatio: artRel ? artAspectRatio(artRel) : undefined, display: "block", margin: "12px auto", objectFit: "contain" }
                  : { maxWidth: "100%", aspectRatio: artRel ? artAspectRatio(artRel) : undefined, display: "block", margin: "10px auto" }
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
        const hastNode = node as HastNode;
        if (isGoblinCheckQuote(hastNode)) {
          return <GoblinCheckCard>{children}</GoblinCheckCard>;
        }
        if (isChapterRecapQuote(hastNode)) {
          return <RecapBox>{children}</RecapBox>;
        }
        if (isGoblinFactsQuote(hastNode)) {
          return <GoblinDeviceCard icon="potion-nav" label="Goblin Facts" tone="fact">{children}</GoblinDeviceCard>;
        }
        if (isExampleQuote(hastNode)) {
          return <GoblinDeviceCard icon="examples-nav" label="Example" tone="example">{children}</GoblinDeviceCard>;
        }
        if (isAlignmentQuote(hastNode)) {
          return <GoblinDeviceCard icon="guide-nav" label="Alignment" tone="alignment">{children}</GoblinDeviceCard>;
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
    }),
    [bodySize, border, c, ink, navy, t]
  );
}
