export const GAME_CONFIG = {
  debug: true,
  mapId: "green-fields",
  player: {
    initialLevel: 1,
    initialCoins: 10000, // 0
    initialHealthPotions: 0,
    initialGasCanisters: 0,
    initialLanternFuel: 0,
    initialLives: 3,
    maxLives: 3,
    maxLevel: 100,
    initialPowerType: "magic",
    initialStats: { strength: 6, agility: 6, intelligence: 6, vitality: 6 },
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
    coin: {
      pickupRadius: 1.25,
      hoverHeight: 0.55,
      rotationSpeed: 4,
      jackpotChance: 0.1,
      jackpotMultiplier: 100,
    },
  },
  effects: {
    monsterDeathSmoke: {
      puffCount: 8,
      durationSeconds: 0.9,
      riseSpeed: 1.2,
      spread: 0.7,
    },
  },
  base: {
    maxHealth: 300,
    position: { x: 0, z: 0 },
    raidIntervalMs: 30000, //60000
    raidDurationMs: 20000, //30000
  },
  shop: {
    baseHealthRepair: { cost: 2, healthRestore: 100 },
    healthPotion: { cost: 10, healthRestore: 300, maxInventory: 100 },
    lanternGas: {
      cost: 10,
      maxInventory: 100,
      tankCapacity: 100,
      consumptionPerSecond: 3,
    },
  },
  world: { size: 60 },
  monsterWander: {
    radius: 3.5,
    speedMultiplier: 0.65,
    pauseMinMs: 700,
    pauseMaxMs: 1800,
    maxTargetAttempts: 12,
  },
  boss: {
    spawnIntervalMs: 60000,
    warningDurationMs: 10000,
  },
  autoplay: {
    criticalHealthPercent: 35,
    safeHealthDamageMultiplier: 2.5,
    potionDangerDamageMultiplier: 1.25,
    lanternRefillLeadSeconds: 1,
    vitalityEveryLevels: { magic: 5, archer: 5, healer: 3 },
    targetRefreshMs: 500,
  },
  cheats: {
    enabled: true,
    moneyCode: "money",
    moneyRewardCoins: 10000,
    inputTimeoutMs: 2000,
  },
  saveKey: "simple-rpg-save:v1",
} as const;
