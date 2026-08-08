import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG, type MonsterType } from "../config/monstersConfig";

export const monsterLevelMultiplier = (playerLevel: number) =>
  1 +
  Math.max(0, Math.floor(playerLevel) - 1) *
    (GAME_CONFIG.monsterScaling.healthAndDamagePerPlayerLevelPercent / 100);

export const scaledMonsterHealth = (
  type: MonsterType,
  playerLevel: number,
) => Math.round(MONSTERS_CONFIG[type].health * monsterLevelMultiplier(playerLevel));

export const scaledMonsterDamage = (
  type: MonsterType,
  playerLevel: number,
) => Math.round(MONSTERS_CONFIG[type].damage * monsterLevelMultiplier(playerLevel));
