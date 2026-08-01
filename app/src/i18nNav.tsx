// Language-aware navigation. Drop-in replacements for react-router's Link,
// NavLink, and useNavigate that keep the reader inside the current language: in
// the French edition every internal "/x" link/navigation becomes "/fr/x", so
// switching language is the only thing that crosses the EN<->FR boundary.
import { forwardRef } from "react";
import {
  Link as RRLink,
  NavLink as RRNavLink,
  useNavigate as useRRNavigate,
  type LinkProps,
  type NavLinkProps,
  type To,
  type NavigateOptions,
} from "react-router";
import { useLanguage, type Lang } from "./LanguageContext";

function prefix(to: To, lang: Lang): To {
  if (lang !== "fr") return to;
  if (typeof to === "string") {
    if (!to.startsWith("/") || to === "/fr" || to.startsWith("/fr/")) return to;
    return to === "/" ? "/fr" : "/fr" + to;
  }
  if (to && typeof to === "object" && typeof to.pathname === "string") {
    const p = to.pathname;
    if (p.startsWith("/") && p !== "/fr" && !p.startsWith("/fr/")) {
      return { ...to, pathname: p === "/" ? "/fr" : "/fr" + p };
    }
  }
  return to;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  const { lang } = useLanguage();
  return <RRLink ref={ref} to={prefix(to, lang)} {...rest} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...rest }, ref) {
  const { lang } = useLanguage();
  return <RRNavLink ref={ref} to={prefix(to, lang)} {...rest} />;
});

export function useNavigate() {
  const navigate = useRRNavigate();
  const { lang } = useLanguage();
  return (to: To | number, options?: NavigateOptions) => {
    if (typeof to === "number") return navigate(to);
    return navigate(prefix(to, lang), options);
  };
}
