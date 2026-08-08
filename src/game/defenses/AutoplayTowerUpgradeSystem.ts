import {
  DEFENSE_CONFIG,
  getTowerDamage,
  getTowerUpgradeCost,
} from "../config/defenseConfig";
import type { DefenseState } from "../core/types";

export class AutoplayTowerUpgradeSystem {
  private cooldownMs = 0;

  decide(
    deltaMs: number,
    coins: number,
    towers: DefenseState[],
    underPressure: boolean,
    strongestMonsterHealth: number,
  ) {
    this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    if (!underPressure || this.cooldownMs > 0 || strongestMonsterHealth <= 0)
      return null;
    const tower = towers
      .filter(
        (candidate) => candidate.level < DEFENSE_CONFIG.miniTower.maxLevel,
      )
      .sort(
        (a, b) => a.level - b.level || a.currentHealth - b.currentHealth,
      )[0];
    const requiredDamage = strongestMonsterHealth * 1.25;
    if (
      !tower ||
      getTowerDamage(tower.level) >= requiredDamage ||
      coins < getTowerUpgradeCost(tower.level)
    )
      return null;
    this.cooldownMs = DEFENSE_CONFIG.miniTower.autoplayUpgradeCooldownMs;
    return tower.id;
  }
}
