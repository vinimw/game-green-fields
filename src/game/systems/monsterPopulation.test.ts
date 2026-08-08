import { describe, expect, it } from "vitest";
import {
  MONSTER_SPAWN_CONFIG,
  type MonsterType,
} from "../config/monstersConfig";
import type { Monster } from "../entities/Monster";
import type { MonsterState, Vec2 } from "../core/types";
import {
  allowedSpawnCount,
  aliveCountByType,
  MonsterPopulationSystem,
  selectSpawnType,
} from "./MonsterPopulationSystem";
import {
  isValidSpawnPosition,
  SpawnPositionService,
} from "./SpawnPositionService";
const areas = [{ id: "field", minX: -10, maxX: 10, minZ: -10, maxZ: 10 }],
  zones = [{ id: "camp", center: { x: 0, z: 0 }, radius: 2 }],
  options = { minDistanceFromPlayer: 3, maxAttempts: 3, obstacleClearance: 1 },
  state = (
    type: MonsterType,
    alive = true,
    position: Vec2 = { x: 8, z: 8 },
  ): MonsterState => ({
    id: `${type}-${Math.random()}`,
    type,
    alive,
    health: 5,
    position: { ...position },
    spawnPosition: { ...position },
  }),
  fake = (type: MonsterType, alive = true, position?: Vec2) =>
    ({
      state: state(type, alive, position),
      readyForRemoval: false,
      dispose() {},
    }) as unknown as Monster,
  rules = {
    crawler: {
      enabled: true,
      maxPlayerLevel: 29,
      maxAlive: 10,
      respawnDelayMs: 12000,
      spawnGroupSize: 2,
      spawnWeight: 70,
    },
    wailer: {
      enabled: true,
      maxAlive: 4,
      respawnDelayMs: 18000,
      spawnGroupSize: 1,
      spawnWeight: 30,
    },
    ghost: {
      enabled: true,
      maxAlive: 5,
      respawnDelayMs: 22000,
      spawnGroupSize: 1,
      spawnWeight: 20,
    },
    bear: {
      enabled: false,
      maxAlive: 1,
      respawnDelayMs: 60000,
      spawnGroupSize: 1,
      spawnWeight: 0,
    },
    bat: {
      enabled: true,
      maxAlive: 12,
      respawnDelayMs: 15000,
      spawnGroupSize: 6,
      spawnWeight: 25,
      unlockPlayerLevel: 30,
    },
  };
describe("spawn position", () => {
  it("rejects positions near player", () =>
    expect(
      isValidSpawnPosition(
        { x: 3, z: 0 },
        { x: 1, z: 0 },
        areas,
        zones,
        [],
        options,
      ),
    ).toBe(false));
  it("rejects safe zones", () =>
    expect(
      isValidSpawnPosition(
        { x: 1, z: 1 },
        { x: 10, z: 10 },
        areas,
        zones,
        [],
        options,
      ),
    ).toBe(false));
  it("stops after max attempts", () => {
    const service = new SpawnPositionService(
      areas,
      zones,
      [],
      options,
      () => 0.5,
    );
    expect(service.findValidSpawnPosition({ x: 0, z: 0 })).toBeNull();
    expect(service.attemptsLastSearch).toBe(3);
  });
});
describe("horror population rules", () => {
  it("configures a positive global population limit", () =>
    expect(MONSTER_SPAWN_CONFIG.maxMonsters).toBeGreaterThan(0));
  it("configures Crawler maximum 10", () =>
    expect(MONSTER_SPAWN_CONFIG.monsters.crawler.maxAlive).toBe(10));
  it("configures Wailer maximum 4", () =>
    expect(MONSTER_SPAWN_CONFIG.monsters.wailer.maxAlive).toBe(4));
  it("configures a bounded Ghost population", () =>
    expect(MONSTER_SPAWN_CONFIG.monsters.ghost.maxAlive).toBeGreaterThan(0));
  it("never exceeds global or type limits", () => {
    expect(allowedSpawnCount(14, 1, 2, 14, 10)).toBe(0);
    expect(allowedSpawnCount(5, 10, 2, 14, 10)).toBe(0);
  });
  it("shrinks group to available capacity", () =>
    expect(allowedSpawnCount(13, 9, 2, 14, 10)).toBe(1));
  it("a dead monster releases a slot", () =>
    expect(
      aliveCountByType([fake("crawler"), fake("crawler", false)], "crawler"),
    ).toBe(1));
  it("ignores types at their limit", () =>
    expect(
      selectSpawnType(
        { crawler: 10, wailer: 0, ghost: 0, bear: 0, bat: 0 },
        rules,
        () => 0,
      ),
    ).toBe("wailer"));
  it("respawns after configured delay at a new home", () => {
    const monsters = [fake("crawler")],
      positions = {
        findValidSpawnPosition: () => ({ x: 7, z: -7 }),
      } as unknown as SpawnPositionService;
    let created: MonsterState | undefined;
    const population = new MonsterPopulationSystem(
      monsters,
      positions,
      (type, position) => {
        created = state(type, true, position);
        return {
          state: created,
          readyForRemoval: false,
          dispose() {},
        } as unknown as Monster;
      },
      () => ({ x: 0, z: 0 }),
    );
    population.onMonsterKilled("crawler");
    monsters[0]!.state.alive = false;
    population.update(12000);
    expect(population.totalAlive).toBeGreaterThan(0);
    expect(created?.spawnPosition).toEqual({ x: 7, z: -7 });
  });
  it("unlocks a six-bat swarm at player level thirty", () => {
    const monsters: Monster[] = [],
      positions = {
        findValidSpawnPosition: () => ({ x: 7, z: -7 }),
      } as unknown as SpawnPositionService,
      population = new MonsterPopulationSystem(
        monsters,
        positions,
        (type, position) => fake(type, true, position),
        () => ({ x: 0, z: 0 }),
      );
    population.setPlayerLevelProvider(() => 29);
    expect(population.spawn("bat")).toBe(0);
    population.setPlayerLevelProvider(() => 30);
    expect(population.spawn("bat")).toBe(6);
  });
  it("removes level-one Crawlers and their respawns at level thirty", () => {
    const monsters = [fake("crawler")],
      positions = {
        findValidSpawnPosition: () => ({ x: 7, z: -7 }),
      } as unknown as SpawnPositionService,
      population = new MonsterPopulationSystem(
        monsters,
        positions,
        (type, position) => fake(type, true, position),
        () => ({ x: 0, z: 0 }),
      );
    population.setPlayerLevelProvider(() => 29);
    population.onMonsterKilled("crawler");
    expect(population.pendingRespawns).toHaveLength(1);
    population.setPlayerLevelProvider(() => 30);
    population.update(1);
    expect(population.aliveByType("crawler")).toBe(0);
    expect(population.pendingRespawns).toHaveLength(0);
    expect(population.spawn("crawler")).toBe(0);
  });
});
