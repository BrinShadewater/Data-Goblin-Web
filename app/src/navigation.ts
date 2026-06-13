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
  { to: "/about", label: "About", icon: "contact-nav" },
  { to: "/contribute", label: "Contribute", icon: "contribute-nav" },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.to === "/") return pathname === "/";
  if (item.to === "/guide") return pathname === "/guide" || pathname.startsWith("/chapter/");
  return pathname === item.to;
}
