import { tr } from "./i18n";

/**
 * The book's plain region names, as they appear in the content JSON, mapped to
 * the evocative names the reader actually shows.
 *
 * Both editions are keyed here. The French content ships its own translated
 * region strings ("La météo"), which did not match the English keys, so they
 * fell through unmapped — a French reader saw *La Météo* where an English
 * reader saw *The Stormbelt*. That is the field-guide voice CLAUDE.md
 * explicitly protects, absent from an entire edition.
 *
 * The map resolves to the canonical English label; `tr()` then supplies the
 * French one from ui-fr.ts, so the evocative naming survives translation
 * rather than being flattened by it.
 */
const REGION_LABELS: Record<string, string> = {
  // English content
  "The Trailhead": "Trailhead",
  "The Land": "The First Clearing",
  "The Creatures": "The Crownlands",
  "The Weather": "The Stormbelt",
  "The Map": "The Rule Roads",
  "The Tools": "The Lantern Path",
  "The Hoard": "The Hoard Vault",
  // French content — machine translations of the same plain names.
  "La tête de piste": "Trailhead",
  "La terre": "The First Clearing",
  "Les créatures": "The Crownlands",
  "La météo": "The Stormbelt",
  "La carte": "The Rule Roads",
  "Les outils": "The Lantern Path",
  "Le trésor": "The Hoard Vault",
};

export function displayRegion(region: string): string {
  return tr(REGION_LABELS[region] ?? region);
}
