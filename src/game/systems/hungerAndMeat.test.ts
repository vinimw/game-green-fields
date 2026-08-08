import { NullEngine, Scene } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { createPlayerState } from "../core/GameState";
import {
  consumeAttackHunger,
  eatRawSteak,
  shouldAutoplayEat,
} from "./HungerSystem";
import { MeatPickupSystem } from "./MeatPickupSystem";

describe("Hunger", () => {
  it("starts full and loses half a point for every attack", () => {
    const player = createPlayerState();
    expect(player.hunger).toBe(100);
    consumeAttackHunger(player);
    expect(player.hunger).toBe(99.5);
  });
  it("consumes one steak without exceeding maximum hunger", () => {
    const player = createPlayerState();
    player.rawSteaks = 1;
    expect(eatRawSteak(player).success).toBe(false);
    player.hunger = 85;
    expect(eatRawSteak(player)).toMatchObject({ success: true, restored: 15 });
    expect([player.hunger, player.rawSteaks]).toEqual([100, 0]);
  });
  it("lets autoplay eat only at the configured low-hunger threshold", () => {
    const player = createPlayerState();
    player.rawSteaks = 1;
    player.hunger = GAME_CONFIG.survival.hunger.autoplayEatThreshold + 1;
    expect(shouldAutoplayEat(player)).toBe(false);
    player.hunger--;
    expect(shouldAutoplayEat(player)).toBe(true);
  });
});

describe("Raw Beef drops", () => {
  it("configures ten guaranteed steaks for Bear and one at 30% for Bat", () => {
    expect(MONSTERS_CONFIG.bear.meatDrop).toEqual({ chance: 1, amount: 10 });
    expect(MONSTERS_CONFIG.bat.meatDrop).toEqual({ chance: 0.3, amount: 1 });
  });
  it("collects meat up to thirty and removes uncollected meat after ten seconds", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      player = createPlayerState();
    let position = { x: 10, z: 10 };
    const meat = new MeatPickupSystem(
      scene,
      player,
      () => position,
      () => {},
      () => 0,
    );
    expect(meat.tryDrop("bear", { x: 0, z: 0 })).toBe(true);
    expect(scene.getMeshByName("raw-beef-steak")).not.toBeNull();
    position = { x: 0, z: 0 };
    meat.update(0.016);
    expect(player.rawSteaks).toBe(10);
    position = { x: 10, z: 10 };
    expect(meat.tryDrop("bat", { x: 0, z: 0 })).toBe(true);
    meat.update(10);
    expect(meat.positions()).toHaveLength(0);
    player.rawSteaks = 30;
    expect(meat.positions()).toEqual([]);
    scene.dispose();
    engine.dispose();
  });
});
