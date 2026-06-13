import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { P, UI } from "../theme";
import type { Block } from "../pagination";
import { Markdown } from "./Markdown";
import { ArtPlate } from "./PageArt";
import { GoblinTrapCard } from "./PageCallouts";
import { SectionHeading, OpenerHeader } from "./PageHeadings";

export { OpenerHeader };

export function BlockView({ block, first }: { block: Block; first: boolean }) {
  const { c } = useTheme();
  const { t } = useReader();
  switch (block.kind) {
    case "heading":
      return <SectionHeading heading={block.heading} first={first} accent={block.accent} />;
    case "panel":
      return <ArtPlate src={block.src} caption={block.caption} />;
    case "md":
      return <Markdown markdown={block.text} />;
    case "trap":
      return <GoblinTrapCard trap={block.trap} />;
    case "bias":
      return (
        <p
          style={{
            fontFamily: UI,
            fontSize: `${t.small}px`,
            fontStyle: t.italicsOff ? "normal" : "italic",
            lineHeight: 1.6,
            color: c(...P.faint),
            borderTop: `1px solid ${c(...P.borderSoft)}`,
            paddingTop: "12px",
            marginTop: "18px",
          }}
        >
          {block.text}
        </p>
      );
  }
}
