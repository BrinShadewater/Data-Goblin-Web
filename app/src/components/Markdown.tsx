import { CSSProperties, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { P } from "../theme";
import { useMarkdownComponents } from "./MarkdownElements";

// ---------------------------------------------------------------------------
// Markdown renderer for chapter prose. Detects the manuscript's structural
// blockquotes and renders them as field-guide callouts:
//   > **🧌 GOBLIN CHECK** …      → green goblin callout card
//   > **📦 CHAPTER RECAP …** …   → recap box
// Everything else gets printed-book typography. Sizes come from the reader
// type scale (viewport mode + dyslexia-friendly reading mode).
// ---------------------------------------------------------------------------

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
  const components = useMarkdownComponents();

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
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
