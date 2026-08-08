import type { PlayerState } from "../core/types";
import { maxHealth } from "./StatsSystem";

export type LifeLossResult = { gameOver: boolean; livesRemaining: number };

export const consumePlayerLife = (player: PlayerState): LifeLossResult => {
  player.lives = Math.max(0, player.lives - 1);
  if (player.lives > 0)
    player.currentHealth = maxHealth(player.stats.vitality, player.level);
  return { gameOver: player.lives === 0, livesRemaining: player.lives };
};
