import { lazy } from "react";
import type { LazyExoticComponent, ReactElement } from "react";

const loadFieldGuidePage = () => import("./pages/FieldGuidePage");
const loadReceiptsPage = () => import("./pages/ReceiptsPage");
const loadLootPage = () => import("./pages/LootPage");
const loadMapPage = () => import("./pages/MapPage");
const loadAboutPage = () => import("./pages/AboutPage");
const loadContributePage = () => import("./pages/ContributePage");
const loadLandingPage = () => import("./pages/LandingPage");
const loadPrivacyPage = () => import("./pages/PrivacyPage");
const loadSearchOverlay = () => import("./components/SearchOverlay");

export const FieldGuidePage = lazy(() => loadFieldGuidePage().then((m) => ({ default: m.FieldGuidePage })));
export const ReceiptsPage = lazy(() => loadReceiptsPage().then((m) => ({ default: m.ReceiptsPage })));
export const LootPage = lazy(() => loadLootPage().then((m) => ({ default: m.LootPage })));
export const MapPage = lazy(() => loadMapPage().then((m) => ({ default: m.MapPage })));
export const AboutPage = lazy(() => loadAboutPage().then((m) => ({ default: m.AboutPage })));
export const ContributePage = lazy(() => loadContributePage().then((m) => ({ default: m.ContributePage })));
export const LandingPage = lazy(() => loadLandingPage().then((m) => ({ default: m.LandingPage })));
export const PrivacyPage = lazy(() => loadPrivacyPage().then((m) => ({ default: m.PrivacyPage })));
export const SearchOverlay = lazy(() => loadSearchOverlay().then((m) => ({ default: m.SearchOverlay })));

type LazyPage = LazyExoticComponent<() => ReactElement>;

export const APP_ROUTES: { path: string; Page: LazyPage }[] = [
  { path: "/", Page: LandingPage },
  { path: "/guide", Page: FieldGuidePage },
  { path: "/chapter/:num", Page: FieldGuidePage },
  { path: "/receipts", Page: ReceiptsPage },
  { path: "/loot", Page: LootPage },
  { path: "/map", Page: MapPage },
  { path: "/about", Page: AboutPage },
  { path: "/contribute", Page: ContributePage },
  { path: "/privacy", Page: PrivacyPage },
  { path: "*", Page: FieldGuidePage },
];

export const preloadReaderRoute = () => {
  void loadFieldGuidePage();
};
