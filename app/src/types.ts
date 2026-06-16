// JSON content schema — produced by site/pipeline/build_content.py. Do not edit by hand.

export interface BookChapterRef {
  number: number;
  title: string;
  goblinChecks: number;
  openVerifyFlags: number;
}

export interface BookPart {
  part: string; // e.g. "Part I — Foundations"
  region: string; // e.g. "The Land"
  chapters: BookChapterRef[];
}

/** TOC entry for the front matter (doc 0) / appendix (doc 21) — outside the 20-chapter parts array. */
export interface BookEndMatterRef {
  number: number;
  title: string;
  region: string;
}

export interface Book {
  title: string;
  subtitle: string;
  asOf: string;
  frontMatter?: BookEndMatterRef;
  parts: BookPart[];
  backMatter?: BookEndMatterRef;
  frontmatterMarkdown: string;
  appendixMarkdown: string;
}

export interface ChapterSection {
  heading: string;
  markdown: string;
}

export interface GoblinCheck {
  section: string;
  markdown: string;
}

export interface Chapter {
  number: number;
  title: string;
  part: string;
  region: string;
  startHere: string; // markdown
  sections: ChapterSection[];
  goblinChecks: GoblinCheck[];
  recap: string[];
  biasLabel: string;
  sources: string[];
  verifyFlags: string[];
}

export interface Trap {
  chapter: number;
  chapterTitle: string;
  trapTitle: string;
  text: string;
}

export type Traps = Record<string, Trap>;

export type ReceiptStatus = "resolved" | "fixed" | "open";

export interface Receipt {
  id: number;
  section: string;
  claim: string;
  status: ReceiptStatus;
  detail: string; // markdown
  links: [string, string][]; // [label, url]
}

/** One named reference URL — produced by the pipeline from the appendix's
 *  "Links and URL References" section, merged with receipts ledger links. */
export interface LinkEntry {
  name: string;
  url: string;
}

/** A near-full-page art plate, shown on its own page at the end of a document.
 *  `src` is relative to public/art/ (e.g. "panels/forward-panel.webp");
 *  `caption` renders underneath — use null when the art carries its own title. */
export interface ArtPanel {
  src: string;
  caption?: string | null;
  /** When true, this figure is pinned to render immediately after the previous
   *  figure (shares its section anchor) instead of being spread to its own. */
  withPrev?: boolean;
}

/** Per-document art assignment from site/content/art-map.json (hand-editable).
 *  Paths are relative to public/art/, e.g. "medium/ecology-medium.webp". */
export interface ArtDocEntry {
  opener: string | null;
  accents: string[];
  panels?: ArtPanel[];
}

export interface ArtMap {
  _readme?: unknown;
  docs: Record<string, ArtDocEntry>;
}

export interface GlossaryEntry {
  term: string;
  def: string;
  chapters: string;
  letter: string;
}
