import { describe, expect, it } from "vitest";
import type { DefenseState } from "../core/types";
import { AutoplayTowerUpgradeSystem } from "./AutoplayTowerUpgradeSystem";

const tower = (level = 1): DefenseState => ({
  id: "tower",
  type: "mini-tower",
  level,
  position: { x: 0, y: 0, z: 0 },
  rotation: 0,
  currentHealth: 300,
});
describe("autoplay tower upgrades", () => {
  it("upgrades only under pressure, when affordable and useful", () => {
    const auto = new AutoplayTowerUpgradeSystem();
    expect(auto.decide(1000, 10000, [tower()], false, 60)).toBeNull();
    expect(auto.decide(1000, 1000, [tower()], true, 60)).toBeNull();
    expect(auto.decide(1000, 10000, [tower()], true, 60)).toBe("tower");
  });
  it("does not upgrade when the current damage has a safety margin", () =>
    expect(
      new AutoplayTowerUpgradeSystem().decide(1000, 10000, [tower(2)], true, 8),
    ).toBeNull());
});
