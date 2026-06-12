const REGION_LABELS: Record<string, string> = {
  "The Trailhead": "Trailhead",
  "The Land": "The First Clearing",
  "The Creatures": "The Crownlands",
  "The Weather": "The Stormbelt",
  "The Map": "The Rule Roads",
  "The Tools": "The Lantern Path",
  "The Hoard": "The Hoard Vault",
};

export function displayRegion(region: string): string {
  return REGION_LABELS[region] ?? region;
}
