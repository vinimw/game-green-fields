import { GAME_CONFIG } from "../config/gameConfig";
import type { PlayerState } from "../core/types";

export const consumeAttackHunger = (player: PlayerState) => {
  player.hunger = Math.max(
    0,
    player.hunger - GAME_CONFIG.survival.hunger.lossPerAttack,
  );
  return player.hunger;
};

export const eatRawSteak = (player: PlayerState) => {
  const maximum = GAME_CONFIG.survival.hunger.maximum;
  if (player.hunger >= maximum)
    return { success: false, message: "Hunger is already full", restored: 0 };
  if (player.rawSteaks <= 0)
    return { success: false, message: "No Raw Beef", restored: 0 };
  const before = player.hunger;
  player.hunger = Math.min(
    maximum,
    player.hunger + GAME_CONFIG.survival.hunger.steakRestore,
  );
  player.rawSteaks--;
  return {
    success: true,
    message: `Ate Raw Beef · +${player.hunger - before} hunger`,
    restored: player.hunger - before,
  };
};

export const shouldAutoplayEat = (player: PlayerState) =>
  player.rawSteaks > 0 &&
  player.hunger <= GAME_CONFIG.survival.hunger.autoplayEatThreshold;
