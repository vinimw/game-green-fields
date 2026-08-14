import {MAGE_CONFIG,type MageAbilityType} from "../config/mageConfig";
import type {PlayerState} from "../core/types";
export const abilityBookId=(ability:MageAbilityType)=>ability==="lance"?null:MAGE_CONFIG.abilities[ability].bookId;
export const learnMageAbility=(player:PlayerState,ability:MageAbilityType)=>{const book=abilityBookId(ability);if(!book||!player.inventory.includes(book)||player.learnedMageAbilities.includes(ability))return false;player.inventory=player.inventory.filter(item=>item!==book);player.learnedMageAbilities.push(ability);return true;};
export const learnRainAbility=(player:PlayerState)=>learnMageAbility(player,"rain");
export const selectMageAbility=(player:PlayerState,ability:MageAbilityType)=>{if(!player.learnedMageAbilities.includes(ability))return false;player.selectedMageAbility=ability;return true;};
