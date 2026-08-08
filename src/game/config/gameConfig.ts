export const GAME_CONFIG = {
  debug: true,
  mapId: "green-fields",
  player: {
    initialLevel: 1,
    initialCoins: 60000, // 0
    maxLevel: 100,
    initialPowerType: "magic",
    initialStats: { strength: 1, agility: 1, intelligence: 1, vitality: 1 },
    baseHealth: 100,
    healthPerVitality: 10,
    healthPerLevel: 50,
    levelUpGlowDurationSeconds: 0.8,
    statPointsPerLevel: 1,
    movement: {
      baseSpeed: 5.2,
      agilityBonusPercent: 1.7,
      levelBonusPercent: 0.3,
    },
    critical: { agilityMultiplier: 1.2, damageMultiplier: 2 },
    attack: {
      powerStatMultiplier: 3,
      cooldownMs: 420,
      rangeByPower: { magic: 2.4, healer: 2.4, archer: 15 },
      archerAnimationDurationSeconds: 0.42,
      arrowProjectileSpeed: 14,
    },
  },
  experience: { multiplierPerLevel: 100 },
  camera: { orthoSize: 15, height: 16, distance: 14 },
  pickups: {
    heart: {
      dropChance: 0.3,
      healthRestore: 30,
      pickupRadius: 1.25,
      hoverHeight: 0.8,
      rotationSpeed: 2.5,
    },
    coin: {
      pickupRadius: 1.25,
      hoverHeight: 0.55,
      rotationSpeed: 4,
    },
  },
  base: {
    maxHealth: 300,
    position: { x: 0, z: 0 },
    raidIntervalMs: 50000, //60000
    raidDurationMs: 30000, //30000
  },
  shop: {
    baseHealthRepair: { cost: 2, healthRestore: 100 },
  },
  world: { size: 60 },
  monsterWander: {
    radius: 3.5,
    speedMultiplier: 0.65,
    pauseMinMs: 700,
    pauseMaxMs: 1800,
    maxTargetAttempts: 12,
  },
  saveKey: "simple-rpg-save:v1",
} as const;
