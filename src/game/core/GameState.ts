import { GAME_CONFIG } from "../config/gameConfig";
import type { PlayerState, PowerType } from "./types";
import { initialStatPoints, maxHealth } from "../systems/StatsSystem";
export const createPlayerState = (
  powerType: PowerType = GAME_CONFIG.player.initialPowerType,
): PlayerState => {
  const stats = { ...GAME_CONFIG.player.initialStats };
  return {
    position: { x: 0, z: 2 },
    mapId: GAME_CONFIG.mapId,
    powerType,
    level: GAME_CONFIG.player.initialLevel,
    xp: 0,
    coins: GAME_CONFIG.player.initialCoins,
    lives: GAME_CONFIG.player.initialLives,
    healthPotions: GAME_CONFIG.player.initialHealthPotions,
    gasCanisters: GAME_CONFIG.player.initialGasCanisters,
    lanternFuel: GAME_CONFIG.player.initialLanternFuel,
    lanternOn: false,
    archerWeaponLevel: 1,
    bootsLevel: 0,
    currentHealth: maxHealth(stats.vitality, GAME_CONFIG.player.initialLevel),
    stats,
    availableStatPoints: initialStatPoints(GAME_CONFIG.player.initialLevel),
    inventory: [],
    equipment: {
      weapon: powerType === "archer" ? "training-bow" : null,
      helmet: null,
      chest: null,
      boots: null,
    },
  };
};
