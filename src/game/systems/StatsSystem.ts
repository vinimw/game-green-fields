import { getArcherBoots } from "../config/archerBootsConfig";
import { getArcherWeapon } from "../config/archerWeaponsConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import { getStaff, MAGE_CONFIG } from "../config/mageConfig";
import type { PlayerState, PowerType, Stats } from "../core/types";

export const maxHealth = (vitality: number, level = 1) =>
  GAME_CONFIG.player.baseHealth +
  (vitality - 1) * GAME_CONFIG.player.healthPerVitality +
  (level - 1) * GAME_CONFIG.player.healthPerLevel;
export const criticalChance = (agility: number) =>
  agility * GAME_CONFIG.player.critical.agilityMultiplier;
export const bootsSpeedBonusPercent = (bootsLevel: number) =>
  getArcherBoots(bootsLevel)?.movementSpeedBonusPercent ?? 0;
export const movementSpeedBonuses = (
  level: number,
  agility: number,
  bootsLevel = 0,
) => {
  const levelBonusPercent =
      level * GAME_CONFIG.player.movement.levelBonusPercent,
    agilityBonusPercent =
      agility * GAME_CONFIG.player.movement.agilityBonusPercent,
    bootsBonusPercent = bootsSpeedBonusPercent(bootsLevel);
  return {
    levelBonusPercent,
    agilityBonusPercent,
    bootsBonusPercent,
    totalBonusPercent:
      levelBonusPercent + agilityBonusPercent + bootsBonusPercent,
  };
};
export const movementSpeed = (level: number, agility: number, bootsLevel = 0) =>
  GAME_CONFIG.player.movement.baseSpeed *
  (1 +
    movementSpeedBonuses(level, agility, bootsLevel).totalBonusPercent / 100);
export const initialStatPoints = (level: number) =>
  (level - 1) * GAME_CONFIG.player.statPointsPerLevel;
export const basePowerDamage = (powerType: PowerType, stats: Stats) =>
  powerType === "magic"
    ? MAGE_CONFIG.damage.baseDamage +
      stats.intelligence * MAGE_CONFIG.damage.intelligenceMultiplier
    : (powerType === "archer" ? stats.agility : stats.intelligence) *
      GAME_CONFIG.player.attack.powerStatMultiplier;
export const weaponDamageBonusPercent = (weaponLevel: number) =>
  getArcherWeapon(weaponLevel)?.damageBonusPercent ?? 0;
export const powerDamage = (
  powerType: PowerType,
  stats: Stats,
  equipmentLevel = 1,
) => {
  const bonusPercent =
    powerType === "archer"
      ? weaponDamageBonusPercent(equipmentLevel)
      : powerType === "magic"
        ? getStaff(equipmentLevel).damageBonusPercent
        : 0;
  return Math.round(
    basePowerDamage(powerType, stats) * (1 + bonusPercent / 100),
  );
};
export const attackSpeedBonusPercent = (
  powerType: PowerType,
  equipmentLevel = 1,
) =>
  powerType === "archer"
    ? (getArcherWeapon(equipmentLevel)?.attackSpeedBonusPercent ?? 0)
    : powerType === "magic"
      ? getStaff(equipmentLevel).attackSpeedBonusPercent
      : 0;
export const attackCooldownMs = (powerType: PowerType, equipmentLevel = 1) => {
  const base =
    powerType === "magic"
      ? MAGE_CONFIG.combat.cooldownMs
      : GAME_CONFIG.player.attack.cooldownMs;
  return base / (1 + attackSpeedBonusPercent(powerType, equipmentLevel) / 100);
};
export const attackRange = (powerType: PowerType) =>
  powerType === "magic"
    ? MAGE_CONFIG.combat.range
    : powerType === "archer"
      ? GAME_CONFIG.rangedCombat.archer.castRange
      : GAME_CONFIG.rangedCombat.healer.castRange;
export const spendStat = (player: PlayerState, stat: keyof Stats) => {
  if (player.availableStatPoints < 1) return false;
  player.stats[stat]++;
  player.availableStatPoints--;
  if (stat === "vitality")
    player.currentHealth += GAME_CONFIG.player.healthPerVitality;
  return true;
};
export const resetStats = (player: PlayerState) => {
  player.stats = { ...GAME_CONFIG.player.initialStats };
  player.availableStatPoints = initialStatPoints(player.level);
  player.currentHealth = Math.min(
    player.currentHealth,
    maxHealth(player.stats.vitality, player.level),
  );
};
