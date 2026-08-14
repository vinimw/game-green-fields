import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  type Scene,
} from "@babylonjs/core";
import {
  ARCHER_ABILITIES,
  type ArcherAbilityType,
} from "../config/archerAbilitiesConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import {
  MAGE_CONFIG,
  type MageAbilityType,
  type MageSkillBookId,
} from "../config/mageConfig";
import { MONSTERS_CONFIG, type MonsterType } from "../config/monstersConfig";
import type { PlayerState, Vec2 } from "../core/types";
type SkillAbility = MageAbilityType | ArcherAbilityType;
type SkillBookId =
  MageSkillBookId | "arrow-rain-skill-book" | "ricochet-arrow-skill-book";
type BookPickup = {
  root: TransformNode;
  bookId: SkillBookId;
  ability: SkillAbility;
  name: string;
  remainingMs: number;
  phase: number;
};
export class SkillBookPickupSystem {
  private pickups: BookPickup[] = [];
  constructor(
    private scene: Scene,
    private player: PlayerState,
    private playerPosition: () => Vec2,
    private onCollected: (name: string) => void,
    private random: () => number = Math.random,
  ) {}
  tryDrop(type: MonsterType, position: Vec2) {
    const chances = MONSTERS_CONFIG[type].skillBookDrops,
      definitions = [
        {
          ability: "rain" as const,
          bookId: MAGE_CONFIG.abilities.rain.bookId,
          name: MAGE_CONFIG.abilities.rain.name,
          chance: chances.rain,
          learned: this.player.learnedMageAbilities.includes("rain"),
        },
        {
          ability: "frost-meteor" as const,
          bookId: MAGE_CONFIG.abilities["frost-meteor"].bookId,
          name: MAGE_CONFIG.abilities["frost-meteor"].name,
          chance: chances.frostMeteor,
          learned: this.player.learnedMageAbilities.includes("frost-meteor"),
        },
        {
          ability: "arrow-rain" as const,
          bookId: ARCHER_ABILITIES["arrow-rain"].bookId,
          name: ARCHER_ABILITIES["arrow-rain"].name,
          chance: chances.arrowRain,
          learned: this.player.learnedArcherAbilities.includes("arrow-rain"),
        },
        {
          ability: "ricochet-arrow" as const,
          bookId: ARCHER_ABILITIES["ricochet-arrow"].bookId,
          name: ARCHER_ABILITIES["ricochet-arrow"].name,
          chance: chances.ricochetArrow,
          learned:
            this.player.learnedArcherAbilities.includes("ricochet-arrow"),
        },
      ];
    let dropped = false;
    for (const definition of definitions) {
      if (
        definition.learned ||
        this.player.inventory.includes(definition.bookId) ||
        this.random() >= definition.chance
      )
        continue;
      this.pickups.push({
        root: this.createBook(position, definition.bookId),
        bookId: definition.bookId,
        ability: definition.ability,
        name: definition.name,
        remainingMs: GAME_CONFIG.pickups.skillBook.lifetimeMs,
        phase: this.random() * Math.PI * 2,
      });
      dropped = true;
    }
    return dropped;
  }
  positions() {
    return this.pickups.map((value) => ({
      x: value.root.position.x,
      z: value.root.position.z,
    }));
  }
  update(dt: number) {
    const player = this.playerPosition();
    for (let index = this.pickups.length - 1; index >= 0; index--) {
      const pickup = this.pickups[index];
      if (!pickup) continue;
      pickup.remainingMs -= dt * 1000;
      pickup.phase += dt * 3;
      pickup.root.rotation.y += dt * 1.6;
      pickup.root.position.y = 0.55 + Math.sin(pickup.phase) * 0.08;
      if (pickup.remainingMs <= 0) {
        pickup.root.dispose(false, true);
        this.pickups.splice(index, 1);
        continue;
      }
      if (
        Math.hypot(
          player.x - pickup.root.position.x,
          player.z - pickup.root.position.z,
        ) > GAME_CONFIG.pickups.skillBook.pickupRadius
      )
        continue;
      this.player.inventory.push(pickup.bookId);
      pickup.root.dispose(false, true);
      this.pickups.splice(index, 1);
      this.onCollected(pickup.name);
    }
  }
  private createBook(position: Vec2, bookId: SkillBookId) {
    const frost = bookId === "frost-meteor-skill-book",
      archer =
        bookId === "arrow-rain-skill-book" ||
        bookId === "ricochet-arrow-skill-book",
      root = new TransformNode(`${bookId}-${Date.now()}`, this.scene);
    root.position.set(position.x, 0.55, position.z);
    const cover = new StandardMaterial(`${bookId}-cover`, this.scene),
      pages = new StandardMaterial(`${bookId}-pages`, this.scene),
      rune = new StandardMaterial(`${bookId}-rune`, this.scene);
    cover.diffuseColor = Color3.FromHexString(
      archer ? "#49652B" : frost ? "#183A68" : "#31528F",
    );
    pages.diffuseColor = Color3.FromHexString("#EADDB8");
    rune.diffuseColor = Color3.FromHexString(
      archer ? "#E1C27A" : frost ? "#D5FAFF" : "#7FE8FF",
    );
    rune.emissiveColor = Color3.FromHexString(
      archer ? "#76551C" : frost ? "#69CDE3" : "#246D91",
    );
    const book = MeshBuilder.CreateBox(
      bookId,
      { width: 0.72, height: 0.16, depth: 0.9 },
      this.scene,
    );
    book.parent = root;
    book.material = cover;
    const pagesMesh = MeshBuilder.CreateBox(
      "skill-book-page-block",
      { width: 0.62, height: 0.12, depth: 0.78 },
      this.scene,
    );
    pagesMesh.parent = root;
    pagesMesh.position.x = 0.05;
    pagesMesh.material = pages;
    const symbol = archer
      ? MeshBuilder.CreateCylinder(
          "arrow-book-symbol",
          { height: 0.5, diameter: 0.07, tessellation: 6 },
          this.scene,
        )
      : MeshBuilder.CreatePolyhedron(
          "skill-book-symbol",
          { type: frost ? 1 : 2, size: 0.18 },
          this.scene,
        );
    symbol.parent = root;
    symbol.position.y = 0.16;
    if (archer) symbol.rotation.z = Math.PI / 4;
    symbol.material = rune;
    return root;
  }
}
