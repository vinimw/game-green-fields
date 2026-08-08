export type MonsterType = "slime" | "evil-sunflower";
export const MONSTERS_CONFIG = {
  slime: {
    level: 1,
    health: 5,
    damage: 40, //10
    experienceReward: 80, //1
    coinDrop: { chance: 0.7, amount: 2 }, //{ chance: 0.3, amount: 2 },
    attackCooldownMs: 1000,
    movementSpeed: 5, //1
    detectionRadius: 7,
    leashRadius: 11,
    attackRadius: 1.35,
  },
  "evil-sunflower": {
    level: 2,
    health: 20,
    damage: 15,
    experienceReward: 50,
    coinDrop: { chance: 0.8, amount: 5 }, //{ chance: 0.4, amount: 5 }
    attackCooldownMs: 800,
    movementSpeed: 1.7,
    detectionRadius: 8,
    leashRadius: 12,
    attackRadius: 2.2,
  },
} as const;

export const MONSTER_SPAWN_CONFIG = {
  enabled: true,
  maxMonsters: 80, //15
  initialPopulationPercent: 0.7,
  minDistanceFromPlayer: 20,
  maxSpawnAttempts: 30,
  obstacleClearance: 1.5,
  groupRadius: 3,
  retryDelayMs: 1000,
  respawn: { defaultDelayMs: 2000 }, //5000
  monsters: {
    slime: {
      enabled: true,
      maxAlive: 12,
      respawnDelayMs: 5000,
      spawnGroupSize: 3,
      spawnWeight: 70,
    },
    "evil-sunflower": {
      enabled: true,
      maxAlive: 5, //3
      respawnDelayMs: 3000, //8000
      spawnGroupSize: 1,
      spawnWeight: 30,
    },
  },
  debug: { showSpawnAreas: true },
} as const;
