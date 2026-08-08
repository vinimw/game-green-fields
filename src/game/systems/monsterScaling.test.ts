import { describe, expect, it } from "vitest";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import {
  monsterLevelMultiplier,
  scaledMonsterDamage,
  scaledMonsterHealth,
} from "./MonsterScalingSystem";

describe("Monster level scaling", () => {
  it("keeps base attributes at level one and adds ten percent per level", () => {
    expect(monsterLevelMultiplier(1)).toBe(1);
    expect(monsterLevelMultiplier(2)).toBe(1.1);
    expect(monsterLevelMultiplier(10)).toBe(1.9);
    expect(scaledMonsterHealth("crawler", 2)).toBe(
      Math.round(MONSTERS_CONFIG.crawler.health * 1.1),
    );
    expect(scaledMonsterDamage("crawler", 2)).toBe(
      Math.round(MONSTERS_CONFIG.crawler.damage * 1.1),
    );
  });

  it("also scales boss health and damage", () => {
    expect(scaledMonsterHealth("bear", 3)).toBe(
      Math.round(MONSTERS_CONFIG.bear.health * 1.2),
    );
    expect(scaledMonsterDamage("bear", 3)).toBe(
      Math.round(MONSTERS_CONFIG.bear.damage * 1.2),
    );
  });
});
