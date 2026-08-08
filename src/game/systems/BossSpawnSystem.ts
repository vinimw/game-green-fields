import { GAME_CONFIG } from "../config/gameConfig";

export type BossSpawnTransition = "none" | "warning" | "spawn";

export class BossSpawnSystem {
  remainingMs: number = GAME_CONFIG.boss.spawnIntervalMs;
  warningActive = false;

  update(deltaMs: number, bossAlive: boolean): BossSpawnTransition {
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    const wasWarning = this.warningActive;
    this.warningActive =
      !bossAlive &&
      this.remainingMs > 0 &&
      this.remainingMs <= GAME_CONFIG.boss.warningDurationMs;
    if (this.remainingMs > 0)
      return this.warningActive && !wasWarning ? "warning" : "none";
    this.remainingMs = GAME_CONFIG.boss.spawnIntervalMs;
    this.warningActive = false;
    return bossAlive ? "none" : "spawn";
  }
}
