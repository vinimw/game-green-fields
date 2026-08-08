import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  type Scene,
} from "@babylonjs/core";
import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG, type MonsterType } from "../config/monstersConfig";
import type { PlayerState, Vec2 } from "../core/types";
export const shouldDropCoins = (randomValue: number, chance: number) =>
  randomValue < chance;
export const coinDropAmount = (
  baseAmount: number,
  randomValue: number,
  jackpotChance = GAME_CONFIG.pickups.coin.jackpotChance,
  jackpotMultiplier = GAME_CONFIG.pickups.coin.jackpotMultiplier,
) =>
  randomValue < jackpotChance ? baseAmount * jackpotMultiplier : baseAmount;
export const addCoins = (current: number, amount: number) => current + amount;
type CoinPickup = { root: TransformNode; amount: number; phase: number };
export class CoinPickupSystem {
  private pickups: CoinPickup[] = [];
  constructor(
    private scene: Scene,
    private player: PlayerState,
    private playerPosition: () => Vec2,
    private onCollected: (amount: number) => void,
    private random: () => number = Math.random,
  ) {}
  tryDrop(type: MonsterType, position: Vec2) {
    const drop = MONSTERS_CONFIG[type].coinDrop;
    if (!shouldDropCoins(this.random(), drop.chance)) return false;
    const amount =
      type === "bear"
        ? drop.amount
        : coinDropAmount(drop.amount, this.random());
    this.pickups.push({
      root: this.createCoin(position, amount > drop.amount, type === "bear"),
      amount,
      phase: this.random() * Math.PI * 2,
    });
    return true;
  }
  positions(): Vec2[] {
    return this.pickups.map((pickup) => ({
      x: pickup.root.position.x,
      z: pickup.root.position.z,
    }));
  }
  update(dt: number) {
    const config = GAME_CONFIG.pickups.coin,
      playerPosition = this.playerPosition();
    for (let index = this.pickups.length - 1; index >= 0; index--) {
      const pickup = this.pickups[index];
      if (!pickup) continue;
      pickup.phase += dt * 3;
      pickup.root.rotation.y += dt * config.rotationSpeed;
      pickup.root.position.y =
        config.hoverHeight + Math.sin(pickup.phase) * 0.08;
      if (
        Math.hypot(
          playerPosition.x - pickup.root.position.x,
          playerPosition.z - pickup.root.position.z,
        ) <= config.pickupRadius
      ) {
        this.player.coins = addCoins(this.player.coins, pickup.amount);
        pickup.root.dispose(false, true);
        this.pickups.splice(index, 1);
        this.onCollected(pickup.amount);
      }
    }
  }
  private createCoin(position: Vec2, jackpot = false, bundle = false) {
    const root = new TransformNode(`coin-${Date.now()}`, this.scene);
    root.position.set(
      position.x,
      GAME_CONFIG.pickups.coin.hoverHeight,
      position.z,
    );
    const material = new StandardMaterial(
      jackpot ? "jackpot-coin-material" : "coin-material",
      this.scene,
    );
    material.diffuseColor = Color3.FromHexString(
      jackpot ? "#FFF09A" : "#F5B82E",
    );
    material.emissiveColor = Color3.FromHexString(
      jackpot ? "#D99713" : "#7A4B08",
    );
    const coinCount = bundle ? 9 : 1;
    for (let index = 0; index < coinCount; index++) {
      const coin = MeshBuilder.CreateCylinder(
        bundle ? "bear-coin-bundle-piece" : jackpot ? "jackpot-coin" : "coin",
        {
          height: bundle ? 0.16 : jackpot ? 0.2 : 0.12,
          diameter: bundle ? 0.58 : jackpot ? 0.72 : 0.48,
          tessellation: 20,
        },
        this.scene,
      );
      coin.parent = root;
      coin.rotation.z = Math.PI / 2;
      coin.position.set(
        bundle ? ((index % 3) - 1) * 0.38 : 0,
        bundle ? Math.floor(index / 3) * 0.18 : 0,
        bundle ? ((index + Math.floor(index / 3)) % 2) * 0.2 - 0.1 : 0,
      );
      coin.material = material;
    }
    if (bundle) root.scaling.setAll(1.15);
    return root;
  }
}
