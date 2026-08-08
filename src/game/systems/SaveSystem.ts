import { GAME_CONFIG } from "../config/gameConfig";
import {
  getArcherWeapon,
  MAX_ARCHER_WEAPON_LEVEL,
} from "../config/archerWeaponsConfig";
import {
  getArcherBoots,
  MAX_ARCHER_BOOTS_LEVEL,
} from "../config/archerBootsConfig";
import { MONSTERS_CONFIG, type MonsterType } from "../config/monstersConfig";
import type { PlayerState, SaveData } from "../core/types";

type LegacyPlayer = Partial<PlayerState> & { gold?: number };
type LegacyMonster = { type: string; health: number };
const migrateMonsterType = (type: string): MonsterType | null =>
  type === "slime"
    ? "crawler"
    : type === "evil-sunflower"
      ? "wailer"
      : type === "crawler" ||
          type === "wailer" ||
          type === "ghost" ||
          type === "bear" ||
          type === "bat"
        ? type
        : null;

export class SaveSystem {
  hasSave() {
    return this.load() !== null;
  }
  save(data: SaveData) {
    const serializable = structuredClone(data);
    delete (serializable.player as LegacyPlayer).gold;
    localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(serializable));
  }
  clear() {
    localStorage.removeItem(GAME_CONFIG.saveKey);
  }
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.saveKey);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("version" in parsed) ||
        parsed.version !== 1
      )
        return null;
      const data = parsed as SaveData,
        legacy = data.player as LegacyPlayer;
      if (!legacy.powerType)
        legacy.powerType = GAME_CONFIG.player.initialPowerType;
      if (legacy.coins === undefined)
        legacy.coins =
          typeof legacy.gold === "number"
            ? legacy.gold
            : GAME_CONFIG.player.initialCoins;
      if (typeof legacy.lives !== "number")
        legacy.lives = GAME_CONFIG.player.initialLives;
      if (typeof legacy.hunger !== "number")
        legacy.hunger = GAME_CONFIG.player.initialHunger;
      if (typeof legacy.rawSteaks !== "number")
        legacy.rawSteaks = GAME_CONFIG.player.initialRawSteaks;
      delete legacy.gold;
      if (typeof legacy.healthPotions !== "number")
        legacy.healthPotions = GAME_CONFIG.player.initialHealthPotions;
      if (typeof legacy.gasCanisters !== "number")
        legacy.gasCanisters = GAME_CONFIG.player.initialGasCanisters;
      if (typeof legacy.lanternFuel !== "number")
        legacy.lanternFuel = GAME_CONFIG.player.initialLanternFuel;
      if (typeof legacy.lanternOn !== "boolean") legacy.lanternOn = false;
      if (typeof legacy.archerWeaponLevel !== "number")
        legacy.archerWeaponLevel = 1;
      if (typeof legacy.bootsLevel !== "number") legacy.bootsLevel = 0;
      const player = data.player;
      player.lives = Math.max(
        0,
        Math.min(GAME_CONFIG.player.maxLives, Math.floor(player.lives)),
      );
      player.hunger = Math.max(
        0,
        Math.min(GAME_CONFIG.survival.hunger.maximum, player.hunger),
      );
      player.rawSteaks = Math.max(
        0,
        Math.min(
          GAME_CONFIG.survival.rawSteak.maxInventory,
          Math.floor(player.rawSteaks),
        ),
      );
      player.healthPotions = Math.max(
        0,
        Math.min(
          GAME_CONFIG.shop.healthPotion.maxInventory,
          Math.floor(player.healthPotions),
        ),
      );
      player.gasCanisters = Math.max(
        0,
        Math.min(
          GAME_CONFIG.shop.lanternGas.maxInventory,
          Math.floor(player.gasCanisters),
        ),
      );
      player.lanternFuel = Math.max(
        0,
        Math.min(GAME_CONFIG.shop.lanternGas.tankCapacity, player.lanternFuel),
      );
      if (player.lanternFuel === 0) player.lanternOn = false;
      player.archerWeaponLevel = Math.max(
        1,
        Math.min(MAX_ARCHER_WEAPON_LEVEL, player.archerWeaponLevel),
      );
      player.bootsLevel = Math.max(
        0,
        Math.min(MAX_ARCHER_BOOTS_LEVEL, player.bootsLevel),
      );
      if (player.powerType === "archer") {
        player.equipment.weapon =
          getArcherWeapon(player.archerWeaponLevel)?.id ?? "training-bow";
        player.equipment.boots = getArcherBoots(player.bootsLevel)?.id ?? null;
      }
      data.world.monsters = (
        data.world.monsters as unknown as LegacyMonster[]
      ).flatMap((monster) => {
        const type = migrateMonsterType(monster.type);
        if (!type) return [];
        const migrated = {
          ...monster,
          type,
          health:
            monster.type === type
              ? Math.min(monster.health, MONSTERS_CONFIG[type].health)
              : MONSTERS_CONFIG[type].health,
        };
        return [migrated] as typeof data.world.monsters;
      });
      if (data.world.pendingRespawns)
        data.world.pendingRespawns = data.world.pendingRespawns.flatMap(
          (pending) => {
            const type = migrateMonsterType(pending.type as string);
            return type ? [{ ...pending, type }] : [];
          },
        );
      return data;
    } catch {
      return null;
    }
  }
}
