import type { Lang } from "./LanguageContext";

export type SectionLink = { id: string; en: string; fr: string };
export type SectionLinks = Record<string, SectionLink[]>;

export function sectionHref(chapter: number, id: string) {
  return `/chapter/${chapter}?${new URLSearchParams({ section: id })}`;
}

export function resolveSection(sections: SectionLink[], value: string | null, lang: Lang) {
  return sections.find((section) => section.id === value)
    ?? sections.find((section) => section[lang] === value)
    ?? sections.find((section) => section[lang === "fr" ? "en" : "fr"] === value);
}
