import { describe, expect, it } from "vitest";
import {
  DEFENSE_CONFIG,
  getTowerDamage,
  getTowerMaxHealth,
  getTowerTargetCount,
  getTowerUpgradeCost,
} from "../config/defenseConfig";
import type { DefenseState } from "../core/types";
import { purchaseTowerUpgrade } from "./DefensePurchaseSystem";
import { createPlayerState } from "../core/GameState";
import { grantTowerKillExperience } from "./TowerRewardSystem";

const tower = (level = 1): DefenseState => ({
  id: "upgrade",
  type: "mini-tower",
  level,
  position: { x: 10, y: 0, z: 0 },
  rotation: 0,
  currentHealth: 300,
});
describe("Mini Tower upgrades", () => {
  it("unlocks the configured number of simultaneous targets", () => {
    expect([1, 2, 3, 4, 5, 7, 8, 9, 10].map(getTowerTargetCount)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4, 5,
    ]);
  });
  it("awards only two XP for a tower kill", () => {
    const player = createPlayerState();
    grantTowerKillExperience(player);
    expect(player.xp).toBe(2);
  });
  it("uses progressive costs and multiplies damage by ten", () => {
    expect(getTowerUpgradeCost(1)).toBe(2000);
    expect(getTowerUpgradeCost(2)).toBe(4000);
    expect(getTowerDamage(1)).toBe(DEFENSE_CONFIG.miniTower.damage);
    expect(getTowerDamage(3)).toBe(
      DEFENSE_CONFIG.miniTower.damage *
        DEFENSE_CONFIG.miniTower.damageMultiplierPerLevel ** 2,
    );
    const state = tower();
    expect(purchaseTowerUpgrade(6000, state)).toMatchObject({
      success: true,
      coins: 4000,
      level: 2,
    });
    expect(state.currentHealth).toBe(getTowerMaxHealth(2));
    expect(getTowerMaxHealth(2)).toBe(
      DEFENSE_CONFIG.miniTower.maxHealth + 1000,
    );
  });
  it("never charges on failure or exceeds level ten", () => {
    const state = tower(9);
    expect(purchaseTowerUpgrade(100, state)).toMatchObject({
      success: false,
      coins: 100,
      level: 9,
    });
    state.level = 10;
    expect(purchaseTowerUpgrade(999999, state)).toMatchObject({
      success: false,
      coins: 999999,
      level: 10,
    });
  });
});
