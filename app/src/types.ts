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

/** TOC entry for the front matter (doc 0) / appendix (doc 20) — outside the 19-chapter parts array. */
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

export interface GlossaryEntry {
  term: string;
  def: string;
  chapters: string;
  letter: string;
}
