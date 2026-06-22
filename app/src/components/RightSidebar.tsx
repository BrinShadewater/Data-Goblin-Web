import { useTheme } from "../ThemeContext";
import { MONO, P } from "../theme";
import type { Chapter } from "../types";
import { GoblinTools } from "./GoblinTools";
import { tr } from "../i18n";
import { isBackMatter } from "../readerUtils";

/** Desktop right sidebar: goblin tools + bookmarks. */
export function RightSidebar({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const muted = c(...P.muted);
  return (
    <aside
      style={{
        height: "100%",
        overflowY: "auto",
        background: c(...P.panelBgAlt),
        borderLeft: `1px solid ${c(...P.borderSoft)}`,
        padding: "14px 14px 24px",
        transition: "background 0.3s",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: muted, margin: "2px 2px 12px" }}>
        {tr("Field Guide Tools ·")}{" "}
        {chapter.number === 0 ? tr("Front Matter") : isBackMatter(chapter.number) ? tr("Appendix") : `${tr("Ch.")} ${chapter.number}`}
      </div>
      <GoblinTools chapter={chapter} showBookmarks />
    </aside>
  );
}

export { BookmarksCard, GoblinTools } from "./GoblinTools";
