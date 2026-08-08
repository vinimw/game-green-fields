import {
  DEFENSE_CONFIG,
  getNextDefenseCost,
  getTowerDamage,
  getTowerMaxHealth,
  getTowerUpgradeCost,
} from "../config/defenseConfig";
import type { DefenseState, Vec2 } from "../core/types";
import type { DefensePlacementValidator } from "./DefensePlacementValidator";
export type DefensePurchaseResult = {
  success: boolean;
  coins: number;
  message: string;
  defense?: DefenseState;
};
export type TowerUpgradeResult = {
  success: boolean;
  coins: number;
  message: string;
  level: number;
  damage: number;
};
export const purchaseTowerUpgrade = (
  coins: number,
  tower: DefenseState,
): TowerUpgradeResult => {
  if (tower.level >= DEFENSE_CONFIG.miniTower.maxLevel)
    return {
      success: false,
      coins,
      message: "Mini Tower is already at maximum level",
      level: tower.level,
      damage: getTowerDamage(tower.level),
    };
  const cost = getTowerUpgradeCost(tower.level);
  if (coins < cost)
    return {
      success: false,
      coins,
      message: "Not enough Coins",
      level: tower.level,
      damage: getTowerDamage(tower.level),
    };
  tower.level++;
  tower.currentHealth = getTowerMaxHealth(tower.level);
  return {
    success: true,
    coins: coins - cost,
    message: `Mini Tower upgraded to level ${tower.level}`,
    level: tower.level,
    damage: getTowerDamage(tower.level),
  };
};
export const purchaseMiniTower = (
  coins: number,
  position: Vec2,
  existing: DefenseState[],
  validator: DefensePlacementValidator,
  id = `mini-tower-${Date.now()}`,
): DefensePurchaseResult => {
  const cost = getNextDefenseCost(
      existing.filter((defense) => defense.type === "mini-tower").length,
    ),
    validation = validator.validate(position, existing);
  if (!validation.valid)
    return { success: false, coins, message: validation.reason };
  if (coins < cost)
    return { success: false, coins, message: "Not enough Coins" };
  return {
    success: true,
    coins: coins - cost,
    message: "Mini Tower built",
    defense: {
      id,
      type: "mini-tower",
      level: DEFENSE_CONFIG.miniTower.initialLevel,
      position: { x: position.x, y: 0, z: position.z },
      rotation: 0,
      currentHealth: DEFENSE_CONFIG.miniTower.maxHealth,
    },
  };
};
