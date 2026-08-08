import { DEFENSE_CONFIG } from "../config/defenseConfig";
import type { PlayerState } from "../core/types";
import { addExperience } from "../systems/ExperienceSystem";

export const grantTowerKillExperience = (player: PlayerState) =>
  addExperience(player, DEFENSE_CONFIG.miniTower.killExperienceReward);
