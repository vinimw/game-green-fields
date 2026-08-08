import {
  NullEngine,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { DEFENSE_CONFIG } from "../config/defenseConfig";
import { createPlayerState } from "../core/GameState";
import type { DefenseState } from "../core/types";
import { Monster } from "../entities/Monster";
import { Player } from "../entities/Player";
import { MiniTower } from "./MiniTower";
import { DefenseManager } from "./DefenseManager";
const towerState = (): DefenseState => ({
  id: "tower-health-test",
  type: "mini-tower",
  level: 1,
  position: { x: 6, y: 0, z: 0 },
  rotation: 0,
  currentHealth: DEFENSE_CONFIG.miniTower.maxHealth,
});
describe("Mini Tower health", () => {
  it("uses the configured maximum health and updates current health", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      tower = new MiniTower(scene, towerState());
    expect(tower.maxHealth).toBe(DEFENSE_CONFIG.miniTower.maxHealth);
    expect(tower.damage(22)).toBe(22);
    expect(tower.state.currentHealth).toBe(
      DEFENSE_CONFIG.miniTower.maxHealth - 22,
    );
    const healthBar = scene.getTransformNodeByName(
        "tower-health-test-health-bar",
      ),
      healthFill = scene.getMeshByName("tower-health-test-health-fill");
    expect(healthBar?.position.y).toBeGreaterThan(3);
    expect(healthBar?.billboardMode).toBe(TransformNode.BILLBOARDMODE_ALL);
    expect(healthFill?.isPickable).toBe(false);
    tower.dispose();
    scene.dispose();
    engine.dispose();
  });
  it("changes its silhouette at levels five and ten and becomes golden", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      state = { ...towerState(), level: 5, currentHealth: 7000 },
      tower = new MiniTower(scene, state);
    expect(tower.root.scaling.x).toBeCloseTo(1.14);
    expect(
      scene
        .getMeshByName("tower-health-test-level-5-reinforcement")
        ?.isEnabled(),
    ).toBe(true);
    expect(
      scene.getMeshByName("tower-health-test-level-5-cannon")?.isEnabled(),
    ).toBe(true);
    state.level = 10;
    tower.applyLevelVisual();
    expect(tower.root.scaling.x).toBeCloseTo(1.25);
    expect(
      (
        scene.getMaterialByName("tower-health-test-iron") as StandardMaterial
      ).diffuseColor.toHexString(),
    ).toBe("#F1C84B");
    tower.dispose();
    scene.dispose();
    engine.dispose();
  });
});
describe("monster Defense targeting", () => {
  it("reports the damage caused by a tower projectile", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      monster = new Monster(scene, {
        id: "tower-damage-indicator-test",
        type: "crawler",
        alive: true,
        health: 16,
        position: { x: 7, z: 0 },
        spawnPosition: { x: 7, z: 0 },
      });
    let displayedDamage = 0;
    const manager = new DefenseManager(
      scene,
      [towerState()],
      () => {},
      () => {},
      (damage) => (displayedDamage = damage),
    );
    manager.update(0.016, [monster]);
    manager.update(1, [monster]);
    expect(displayedDamage).toBe(DEFENSE_CONFIG.miniTower.damage);
    manager.dispose();
    monster.dispose();
    scene.dispose();
    engine.dispose();
  });
  it("attacks a tower when outside a Core raid and inside tower range", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      player = new Player(scene, createPlayerState("archer")),
      monster = new Monster(scene, {
        id: "crawler-defense-test",
        type: "crawler",
        alive: true,
        health: 16,
        position: { x: 6.5, z: 0 },
        spawnPosition: { x: 6.5, z: 0 },
      });
    let towerHealth = 300,
      playerDamage = 0;
    monster.update(
      player,
      0.016,
      (damage) => (playerDamage += damage),
      false,
      undefined,
      [
        {
          id: "tower",
          position: { x: 6, z: 0 },
          damage: (amount) => {
            towerHealth -= amount;
            return amount;
          },
        },
      ],
    );
    expect(towerHealth).toBe(278);
    expect(playerDamage).toBe(0);
    monster.dispose();
    scene.dispose();
    engine.dispose();
  });
  it("prioritizes the Core during an active raid", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      player = new Player(scene, createPlayerState("archer")),
      monster = new Monster(scene, {
        id: "crawler-raid-test",
        type: "crawler",
        alive: true,
        health: 16,
        position: { x: 0.5, z: 0 },
        spawnPosition: { x: 0.5, z: 0 },
      });
    let towerHealth = 300,
      coreDamage = 0;
    monster.update(
      player,
      0.016,
      () => {},
      false,
      {
        active: true,
        position: { x: 0, z: 0 },
        damageBase: (amount) => (coreDamage += amount),
      },
      [
        {
          id: "tower",
          position: { x: 0.5, z: 0 },
          damage: (amount) => {
            towerHealth -= amount;
            return amount;
          },
        },
      ],
    );
    expect(coreDamage).toBe(22);
    expect(towerHealth).toBe(300);
    monster.dispose();
    scene.dispose();
    engine.dispose();
  });
});
