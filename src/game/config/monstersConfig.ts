export type MonsterType='crawler'|'wailer';
export const MONSTERS_CONFIG={
  crawler:{level:1,health:16,damage:22,experienceReward:12,coinDrop:{chance:.35,amount:2},attackCooldownMs:1200,movementSpeed:2.4,detectionRadius:8,leashRadius:16,attackRadius:1.25},
  wailer:{level:2,health:32,damage:28,experienceReward:25,coinDrop:{chance:.5,amount:4},attackCooldownMs:1800,movementSpeed:1.15,detectionRadius:12,leashRadius:18,attackRadius:5},
} as const;
export const MONSTER_SPAWN_CONFIG={enabled:true,maxMonsters:14,initialPopulationPercent:.45,minDistanceFromPlayer:18,maxSpawnAttempts:30,obstacleClearance:1.5,groupRadius:3,retryDelayMs:1000,respawn:{defaultDelayMs:15000},monsters:{crawler:{enabled:true,maxAlive:10,respawnDelayMs:12000,spawnGroupSize:2,spawnWeight:70},wailer:{enabled:true,maxAlive:4,respawnDelayMs:18000,spawnGroupSize:1,spawnWeight:30}},debug:{showSpawnAreas:false}} as const;
