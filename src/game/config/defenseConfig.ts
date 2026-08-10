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
    maxLevel: 10,
    upgradeCostStep: 2000,
    damageMultiplierPerLevel: 2,
    autoplayUpgradeCooldownMs: 3000,
    removalRefundPercent: 50,
    maxHealth: 3000,
    healthPerLevel: 1000,
    killExperienceReward: 2,
    targetCountMilestones: [
      { level: 1, targets: 1 },
      { level: 3, targets: 2 },
      { level: 5, targets: 3 },
      { level: 8, targets: 4 },
      { level: 10, targets: 5 },
    ],
    modelByLevel: {} as Record<number, string>,
  },
  core: { initialLevel: 1, modelByLevel: {} as Record<number, string> },
  debug: { showDefenseRanges: false },
} as const;
export type DefenseType = typeof DEFENSE_CONFIG.miniTower.id;
export const getNextDefenseCost = (currentTowerCount: number) =>
  DEFENSE_CONFIG.miniTower.baseCost * (Math.max(0, currentTowerCount) + 1);
export const getTowerUpgradeCost = (currentLevel: number) =>
  Math.max(1, Math.floor(currentLevel)) *
  DEFENSE_CONFIG.miniTower.upgradeCostStep;
export const getTowerUpgradeInvestment = (level: number) => {
  const upgrades = Math.max(
    0,
    Math.min(DEFENSE_CONFIG.miniTower.maxLevel, Math.floor(level)) - 1,
  );
  return (
    DEFENSE_CONFIG.miniTower.upgradeCostStep *
    ((upgrades * (upgrades + 1)) / 2)
  );
};
export const getTowerTotalInvestment = (tower: {
  level: number;
  investedCoins?: number;
}) =>
  tower.investedCoins ??
  DEFENSE_CONFIG.miniTower.baseCost + getTowerUpgradeInvestment(tower.level);
export const getTowerRemovalRefund = (tower: {
  level: number;
  investedCoins?: number;
}) =>
  Math.floor(
    getTowerTotalInvestment(tower) *
      (DEFENSE_CONFIG.miniTower.removalRefundPercent / 100),
  );
export const getTowerDamage = (level: number) =>
  DEFENSE_CONFIG.miniTower.damage *
  DEFENSE_CONFIG.miniTower.damageMultiplierPerLevel **
    (Math.max(
      1,
      Math.min(DEFENSE_CONFIG.miniTower.maxLevel, Math.floor(level))
    ) -
      1);
export const getTowerMaxHealth = (level: number) =>
  DEFENSE_CONFIG.miniTower.maxHealth +
  (Math.max(1, Math.min(DEFENSE_CONFIG.miniTower.maxLevel, Math.floor(level))) -
    1) *
    DEFENSE_CONFIG.miniTower.healthPerLevel;
export const getTowerTargetCount = (level: number) =>
  [...DEFENSE_CONFIG.miniTower.targetCountMilestones]
    .reverse()
    .find((milestone) => level >= milestone.level)?.targets ?? 1;
