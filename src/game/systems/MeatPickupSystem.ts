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
import { shouldDropCoins } from "./CoinPickupSystem";

type MeatPickup = {
  root: TransformNode;
  amount: number;
  remainingMs: number;
  phase: number;
};

export class MeatPickupSystem {
  private pickups: MeatPickup[] = [];
  constructor(
    private scene: Scene,
    private player: PlayerState,
    private playerPosition: () => Vec2,
    private onCollected: (amount: number) => void,
    private random: () => number = Math.random,
  ) {}
  tryDrop(type: MonsterType, position: Vec2) {
    const drop = MONSTERS_CONFIG[type].meatDrop;
    if (drop.amount <= 0 || !shouldDropCoins(this.random(), drop.chance))
      return false;
    this.pickups.push({
      root: this.createRawBeef(position, drop.amount),
      amount: drop.amount,
      remainingMs: GAME_CONFIG.survival.rawSteak.dropLifetimeMs,
      phase: this.random() * Math.PI * 2,
    });
    return true;
  }
  positions(): Vec2[] {
    if (this.player.rawSteaks >= GAME_CONFIG.survival.rawSteak.maxInventory)
      return [];
    return this.pickups.map((pickup) => ({
      x: pickup.root.position.x,
      z: pickup.root.position.z,
    }));
  }
  update(dt: number) {
    const position = this.playerPosition();
    for (let index = this.pickups.length - 1; index >= 0; index--) {
      const pickup = this.pickups[index];
      if (!pickup) continue;
      pickup.remainingMs -= dt * 1000;
      pickup.phase += dt * 2.5;
      pickup.root.rotation.y += dt * 1.8;
      pickup.root.position.y = 0.48 + Math.sin(pickup.phase) * 0.06;
      if (pickup.remainingMs <= 0) {
        pickup.root.dispose(false, true);
        this.pickups.splice(index, 1);
        continue;
      }
      if (
        Math.hypot(
          position.x - pickup.root.position.x,
          position.z - pickup.root.position.z,
        ) > GAME_CONFIG.survival.rawSteak.pickupRadius ||
        this.player.rawSteaks >= GAME_CONFIG.survival.rawSteak.maxInventory
      )
        continue;
      const collected = Math.min(
        pickup.amount,
        GAME_CONFIG.survival.rawSteak.maxInventory - this.player.rawSteaks,
      );
      this.player.rawSteaks += collected;
      pickup.root.dispose(false, true);
      this.pickups.splice(index, 1);
      this.onCollected(collected);
    }
  }
  private createRawBeef(position: Vec2, amount: number) {
    const root = new TransformNode(`raw-beef-${Date.now()}`, this.scene);
    root.position.set(position.x, 0.48, position.z);
    const meat = new StandardMaterial("raw-beef-meat-material", this.scene);
    meat.diffuseColor = Color3.FromHexString("#B94B55");
    meat.specularColor = Color3.FromHexString("#3A1014");
    const fat = new StandardMaterial("raw-beef-fat-material", this.scene);
    fat.diffuseColor = Color3.FromHexString("#F1D8C0");
    const steak = MeshBuilder.CreateSphere(
      "raw-beef-steak",
      { diameter: amount >= 10 ? 1.05 : 0.72, segments: 12 },
      this.scene,
    );
    steak.parent = root;
    steak.scaling.set(1.2, 0.25, 0.82);
    steak.material = meat;
    const fatStrip = MeshBuilder.CreateTorus(
      "raw-beef-fat",
      {
        diameter: amount >= 10 ? 0.82 : 0.54,
        thickness: amount >= 10 ? 0.12 : 0.08,
        tessellation: 16,
      },
      this.scene,
    );
    fatStrip.parent = root;
    fatStrip.position.y = 0.16;
    fatStrip.scaling.z = 0.68;
    fatStrip.material = fat;
    return root;
  }
}
