import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { createPlayerState } from "../core/GameState";
import { BossSpawnSystem } from "./BossSpawnSystem";
import { consumePlayerLife } from "./PlayerLivesSystem";
import { NullEngine, Scene } from "@babylonjs/core";
import { Monster } from "../entities/Monster";

describe("Bear boss", () => {
  it("uses the configured boss combat rewards and stats", () => {
    expect(MONSTERS_CONFIG.bear).toMatchObject({
      category: "boss",
      health: 100000,
      damage: 500,
      experienceReward: 400,
      attackCooldownMs: 2800,
      movementSpeed: 4.5,
      coinDrop: { chance: 1, amount: 8000 },
    });
  });
  it("warns before spawning every minute", () => {
    const system = new BossSpawnSystem();
    expect(
      system.update(
        GAME_CONFIG.boss.spawnIntervalMs - GAME_CONFIG.boss.warningDurationMs,
        false,
      ),
    ).toBe("warning");
    expect(system.warningActive).toBe(true);
    expect(system.update(GAME_CONFIG.boss.warningDurationMs, false)).toBe(
      "spawn",
    );
  });
  it("builds the terrifying bear silhouette", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      bear = new Monster(scene, {
        id: "terrifying-bear",
        type: "bear",
        alive: true,
        health: MONSTERS_CONFIG.bear.health,
        position: { x: 0, z: 0 },
        spawnPosition: { x: 0, z: 0 },
      });
    expect(
      scene.meshes.filter((mesh) => mesh.name === "bear-claw"),
    ).toHaveLength(12);
    expect(
      scene.meshes.filter((mesh) => mesh.name === "bear-paw"),
    ).toHaveLength(4);
    expect(
      scene.meshes.filter((mesh) => mesh.name === "bear-face-scar"),
    ).toHaveLength(3);
    expect(scene.getMeshByName("bear-shoulders")).not.toBeNull();
    expect(scene.getMeshByName("bear-jaw")).not.toBeNull();
    expect(bear.root.scaling.x).toBeCloseTo(1.38);
    bear.dispose();
    scene.dispose();
    engine.dispose();
  });
});

describe("Player lives", () => {
  it("starts with three lives, restores health twice and ends on the third death", () => {
    const player = createPlayerState();
    expect(player.lives).toBe(3);
    player.currentHealth = 0;
    expect(consumePlayerLife(player)).toEqual({
      gameOver: false,
      livesRemaining: 2,
    });
    player.currentHealth = 0;
    expect(consumePlayerLife(player)).toEqual({
      gameOver: false,
      livesRemaining: 1,
    });
    player.currentHealth = 0;
    expect(consumePlayerLife(player)).toEqual({
      gameOver: true,
      livesRemaining: 0,
    });
  });
});
