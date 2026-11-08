import type { Lang } from "./LanguageContext";

export type SectionLink = { id: string; en: string; fr: string };
export type SectionLinks = Record<string, SectionLink[]>;

const SECTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sectionHref(chapter: number, id: string) {
  return SECTION_ID.test(id)
    ? `/chapter/${chapter}#${id}`
    : `/chapter/${chapter}?${new URLSearchParams({ section: id })}`;
}

export function sectionLinkValue(search: string, hash: string) {
  const id = hash.slice(1);
  return new URLSearchParams(search).get("section") ?? (SECTION_ID.test(id) ? id : null);
}

export function resolveSection(sections: SectionLink[], value: string | null, lang: Lang) {
  return sections.find((section) => section.id === value)
    ?? sections.find((section) => section[lang] === value)
    ?? sections.find((section) => section[lang === "fr" ? "en" : "fr"] === value);
}
