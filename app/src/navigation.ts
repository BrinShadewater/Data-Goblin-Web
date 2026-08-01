export interface NavItem {
  to: string;
  label: string;
  /**
   * Shorter label for the desktop top nav only, where horizontal room is the
   * binding constraint. The drawer, the More menu and the `title` tooltip all
   * keep the full `label`.
   */
  short?: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: "home-nav" },
  { to: "/guide", label: "Field Guide", icon: "guidebook-nav" },
  { to: "/map", label: "Map", icon: "map-nav" },
  { to: "/loot", label: "Loot (Glossary)", short: "Loot", icon: "chest-nav" },
  { to: "/receipts", label: "Receipts", icon: "data-nav" },
  { to: "/toolkit", label: "Toolkit", icon: "tools-nav" },
  { to: "/updates", label: "Updates", icon: "forge-nav" },
  { to: "/about", label: "About", icon: "contact-nav" },
  { to: "/contribute", label: "Contribute", icon: "contribute-nav" },
];

/**
 * Which destinations keep a labelled slot in the desktop top nav.
 *
 * Nine labelled items need a ~1114px nav track and only get one above ~1830px,
 * so at every real laptop width the old nav fell back to nine unlabelled icons
 * — "Receipts", the headline concept of the book, invisible in the chrome.
 * Five labelled items plus a More menu fit from ~1150px, so the primary paths
 * are named at the widths people actually browse at.
 *
 * "Home" is deliberately not primary: the logo is already a home link, so a
 * Home item spends a labelled slot on a destination that has one.
 */
const PRIMARY_PATHS = ["/guide", "/map", "/loot", "/receipts", "/toolkit"];

export const PRIMARY_NAV: NavItem[] = PRIMARY_PATHS.map(
  (p) => NAV_ITEMS.find((i) => i.to === p)!
);

export const OVERFLOW_NAV: NavItem[] = NAV_ITEMS.filter(
  (i) => !PRIMARY_PATHS.includes(i.to)
);

export function isNavActive(pathname: string, item: NavItem): boolean {
  // Compare against the language-neutral path so highlighting works under /fr.
  const p = pathname === "/fr" ? "/" : pathname.startsWith("/fr/") ? pathname.slice(3) : pathname;
  if (item.to === "/") return p === "/";
  if (item.to === "/guide") return p === "/guide" || p.startsWith("/chapter/");
  return p === item.to;
}
