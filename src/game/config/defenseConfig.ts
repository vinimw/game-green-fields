export const DEFENSE_CONFIG = {
  placement: {
    minDistanceFromCore: 5,
    maxDistanceFromCore: 30,
    minDistanceBetweenDefenses: 8,
    footprintRadius: 1.5,
  },
  miniTower: {
    id: "mini-tower",
    baseCost: 1500,
    damage: 5,
    attackRange: 12,
    attackCooldownMs: 1000,
    projectileSpeed: 18,
    initialLevel: 1,
    maxHealth: 300,
    modelByLevel: {} as Record<number, string>,
  },
  core: { initialLevel: 1, modelByLevel: {} as Record<number, string> },
  debug: { showDefenseRanges: false },
} as const;
export type DefenseType = typeof DEFENSE_CONFIG.miniTower.id;
export const getNextDefenseCost = (currentTowerCount: number) =>
  DEFENSE_CONFIG.miniTower.baseCost * (Math.max(0, currentTowerCount) + 1);
