import type { Lang } from "./LanguageContext";

export type SectionLink = {
  id: string;
  en: string;
  fr: string;
  source?: Record<Lang, { label: string; url: string }>;
};
export type SectionLinks = Record<string, SectionLink[]>;

const SECTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sectionHref(chapter: number, id: string, receipt?: number) {
  const stableId = SECTION_ID.test(id);
  const params = new URLSearchParams();
  if (!stableId) params.set("section", id);
  if (receipt !== undefined) params.set("receipt", String(receipt));
  const query = params.size ? `?${params}` : "";
  return `/chapter/${chapter}${query}${stableId ? `#${id}` : ""}`;
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
