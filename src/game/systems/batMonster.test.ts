import { NullEngine, Scene } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import {
  MONSTERS_CONFIG,
  MONSTER_SPAWN_CONFIG,
} from "../config/monstersConfig";
import { createPlayerState } from "../core/GameState";
import { Monster } from "../entities/Monster";
import { Player } from "../entities/Player";

const createBat = (scene: Scene) =>
  new Monster(scene, {
    id: "bat-test",
    type: "bat",
    alive: true,
    health: MONSTERS_CONFIG.bat.health,
    position: { x: 10, z: 0 },
    spawnPosition: { x: 10, z: 0 },
  });

describe("Bat monster", () => {
  it("spawns in groups of six only from player level thirty", () => {
    expect(MONSTERS_CONFIG.bat).toMatchObject({
      level: 2,
      health: 70,
      damage: 30,
      unlockPlayerLevel: 30,
      darknessSpeedMultiplier: 2,
    });
    expect(MONSTER_SPAWN_CONFIG.monsters.bat).toMatchObject({
      spawnGroupSize: 6,
      unlockPlayerLevel: 30,
    });
  });
  it("flies quickly, flaps both wings and doubles speed in darkness", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      player = new Player(scene, createPlayerState()),
      bat = createBat(scene);
    bat.update(player, 0.1, () => {}, false, undefined, [], false);
    const lightDistance = 10 - bat.root.position.x;
    bat.root.position.x = 10;
    bat.update(player, 0.1, () => {}, false, undefined, [], true);
    const darkDistance = 10 - bat.root.position.x;
    expect(darkDistance).toBeCloseTo(lightDistance * 2);
    expect(
      scene.transformNodes.filter((node) => node.name === "bat-wing-pivot"),
    ).toHaveLength(2);
    bat.dispose();
    player.root.dispose(false, true);
    scene.dispose();
    engine.dispose();
  });
});
