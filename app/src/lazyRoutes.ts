import { lazy } from "react";

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

export const preloadReaderRoute = () => {
  void loadFieldGuidePage();
};
