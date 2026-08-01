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
 * The desktop top nav shows every item it can fit, in this order, and only
 * moves the tail into a "More" menu when the track genuinely runs out of room
 * — see TopNav's measuring nav. There is no fixed primary/secondary split:
 * an earlier version hid four items behind More at every width, which buried
 * destinations that had space to be shown.
 */

export function isNavActive(pathname: string, item: NavItem): boolean {
  // Compare against the language-neutral path so highlighting works under /fr.
  const p = pathname === "/fr" ? "/" : pathname.startsWith("/fr/") ? pathname.slice(3) : pathname;
  if (item.to === "/") return p === "/";
  if (item.to === "/guide") return p === "/guide" || p.startsWith("/chapter/");
  return p === item.to;
}
