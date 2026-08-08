import { describe, expect, it } from "vitest";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { addCoins, coinDropAmount, shouldDropCoins } from "./CoinPickupSystem";
import { CoinPickupSystem } from "./CoinPickupSystem";
import { NullEngine, Scene } from "@babylonjs/core";
import { createPlayerState } from "../core/GameState";
describe("coin drops", () => {
  it("uses Crawler drop configuration", () =>
    expect(MONSTERS_CONFIG.crawler.coinDrop).toEqual({
      chance: 0.35,
      amount: 2,
    }));
  it("uses Wailer drop configuration", () =>
    expect(MONSTERS_CONFIG.wailer.coinDrop).toEqual({
      chance: 0.5,
      amount: 4,
    }));
  it("uses Ghost drop configuration", () =>
    expect(MONSTERS_CONFIG.ghost.coinDrop).toEqual({
      chance: 0.4,
      amount: 20,
    }));
  it("guarantees the Bear bundle of eight thousand Coins", () =>
    expect(MONSTERS_CONFIG.bear.coinDrop).toEqual({
      chance: 1,
      amount: 8000,
    }));
  it("renders the Bear reward as a bundle and collects exactly 8000 Coins", () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      player = createPlayerState();
    let playerPosition = { x: 10, z: 10 };
    const pickups = new CoinPickupSystem(
        scene,
        player,
        () => playerPosition,
        () => {},
        () => 0,
      ),
      coinsBefore = player.coins;
    expect(pickups.tryDrop("bear", { x: 0, z: 0 })).toBe(true);
    expect(
      scene.meshes.filter((mesh) => mesh.name === "bear-coin-bundle-piece"),
    ).toHaveLength(9);
    playerPosition = { x: 0, z: 0 };
    pickups.update(0.016);
    expect(player.coins).toBe(coinsBefore + 8000);
    scene.dispose();
    engine.dispose();
  });
  it("respects exact chance boundary", () => {
    const drop = MONSTERS_CONFIG.crawler.coinDrop;
    expect(shouldDropCoins(0.34, drop.chance)).toBe(true);
    expect(shouldDropCoins(0.35, drop.chance)).toBe(false);
  });
  it("multiplies a successful drop by 100 with ten percent chance", () => {
    expect(coinDropAmount(20, 0.09)).toBe(2000);
    expect(coinDropAmount(20, 0.1)).toBe(20);
  });
  it("adds collected coins to total", () => expect(addCoins(7, 5)).toBe(12));
});
