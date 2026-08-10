import {MAGE_CONFIG,type MageAbilityType} from "../config/mageConfig";
import type {PlayerState} from "../core/types";
export const learnRainAbility=(player:PlayerState)=>{const book=MAGE_CONFIG.abilities.rain.bookId;if(!player.inventory.includes(book)||player.learnedMageAbilities.includes("rain"))return false;player.inventory=player.inventory.filter(item=>item!==book);player.learnedMageAbilities.push("rain");return true;};
export const selectMageAbility=(player:PlayerState,ability:MageAbilityType)=>{if(!player.learnedMageAbilities.includes(ability))return false;player.selectedMageAbility=ability;return true;};
