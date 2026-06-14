// Reading-time + plain-text extraction for a chapter.
// Used by the chapter opener (read-time badge) and the read-aloud tool.
import type { Chapter } from "./types";

/** Strip Markdown down to readable prose (links -> text, drop syntax noise). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, " ")       // authoring HTML comments
    .replace(/```[\s\S]*?```/g, " ")        // fenced code
    .replace(/`([^`]+)`/g, "$1")            // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")  // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")// links -> label
    .replace(/^[ \t]*>+/gm, " ")            // blockquotes
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")   // headings
    .replace(/^[ \t]*[-*+][ \t]+/gm, "")    // bullets
    .replace(/^\|.*\|$/gm, " ")             // table rows
    .replace(/[*_~]{1,3}/g, "")             // emphasis marks
    .replace(/\s+/g, " ")
    .trim();
}

/** All readable prose in a chapter, in reading order. */
export function chapterPlainText(chapter: Chapter): string {
  const parts: string[] = [chapter.title];
  if (chapter.startHere) parts.push(stripMarkdown(chapter.startHere));
  for (const s of chapter.sections) {
    if (s.heading) parts.push(s.heading);
    if (s.markdown) parts.push(stripMarkdown(s.markdown));
  }
  return parts.filter(Boolean).join(". ");
}

export function chapterWordCount(chapter: Chapter): number {
  const text = chapterPlainText(chapter);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** ~220 wpm adult reading speed, rounded, floor of 1 for any real content. */
export function readingMinutes(words: number): number {
  if (words < 30) return 0;
  return Math.max(1, Math.round(words / 220));
}
