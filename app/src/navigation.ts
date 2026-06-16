export interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: "home-nav" },
  { to: "/guide", label: "Field Guide", icon: "guidebook-nav" },
  { to: "/map", label: "Map", icon: "map-nav" },
  { to: "/loot", label: "Loot (Glossary)", icon: "chest-nav" },
  { to: "/receipts", label: "Receipts", icon: "data-nav" },
  { to: "/toolkit", label: "Toolkit", icon: "tools-nav" },
  { to: "/updates", label: "Updates", icon: "forge-nav" },
  { to: "/about", label: "About", icon: "contact-nav" },
  { to: "/contribute", label: "Contribute", icon: "contribute-nav" },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  // Compare against the language-neutral path so highlighting works under /fr.
  const p = pathname === "/fr" ? "/" : pathname.startsWith("/fr/") ? pathname.slice(3) : pathname;
  if (item.to === "/") return p === "/";
  if (item.to === "/guide") return p === "/guide" || p.startsWith("/chapter/");
  return p === item.to;
}
