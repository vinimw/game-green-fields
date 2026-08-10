import type { MonsterType } from "../config/monstersConfig";
import type { DefenseType } from "../config/defenseConfig";
export type Vec2 = { x: number; z: number };
export type Stats = {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
};
export type PowerType = "magic" | "archer" | "healer";
export type Equipment = {
  weapon: string | null;
  helmet: string | null;
  chest: string | null;
  boots: string | null;
};
export type PlayerState = {
  position: Vec2;
  mapId: string;
  powerType: PowerType;
  level: number;
  xp: number;
  coins: number;
  lives: number;
  hunger: number;
  rawSteaks: number;
  healthPotions: number;
  gasCanisters: number;
  lanternFuel: number;
  lanternOn: boolean;
  archerWeaponLevel: number;
  bootsLevel: number;
  currentHealth: number;
  stats: Stats;
  availableStatPoints: number;
  inventory: string[];
  equipment: Equipment;
};
export type MonsterState = {
  id: string;
  type: MonsterType;
  alive: boolean;
  health: number;
  scaledToPlayerLevel?: number;
  position: Vec2;
  spawnPosition: Vec2;
};
export type PendingRespawn = { type: MonsterType; remainingTimeMs: number };
export type BaseState = {
  currentHealth: number;
  raidActive: boolean;
  remainingTimeMs: number;
  level?: number;
};
export type DefenseState = {
  id: string;
  type: DefenseType;
  level: number;
  position: { x: number; y: number; z: number };
  rotation: number;
  currentHealth: number;
  investedCoins?: number;
};
export type SaveData = {
  version: 1;
  player: PlayerState;
  world: {
    mapId: string;
    monsters: MonsterState[];
    pendingRespawns?: PendingRespawn[];
    base?: BaseState;
    defenses?: DefenseState[];
    npcs: never[];
    objects: string[];
  };
};
