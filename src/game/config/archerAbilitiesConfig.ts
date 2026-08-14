export type ArcherAbilityType =
  | "single-arrow"
  | "arrow-rain"
  | "ricochet-arrow";
export const ARCHER_ABILITIES = {
  "single-arrow": { name: "Single Arrow", damageMultiplier: 1, areaRadius: 0 },
  "arrow-rain": {
    name: "Arrow Rain",
    damageMultiplier: 2.1,
    areaRadius: 4.5,
    bookId: "arrow-rain-skill-book",
    arrowCount: 11,
  },
  "ricochet-arrow": {
    name: "Ricochet Arrow",
    damageMultiplier: 3.5,
    bookId: "ricochet-arrow-skill-book",
    maxBounces: 3,
    maxRicochetRange: 6,
    bounceDelayMs: 80,
  },
} as const;
export const INITIAL_ARCHER_ABILITY: ArcherAbilityType = "single-arrow";
