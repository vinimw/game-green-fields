import {ARCHER_ABILITIES,type ArcherAbilityType} from "../config/archerAbilitiesConfig";
import type {PlayerState} from "../core/types";
export const learnArcherAbility=(player:PlayerState,ability:Exclude<ArcherAbilityType,"single-arrow">)=>{const book=ARCHER_ABILITIES[ability].bookId;if(!player.inventory.includes(book)||player.learnedArcherAbilities.includes(ability))return false;player.inventory=player.inventory.filter(item=>item!==book);player.learnedArcherAbilities.push(ability);return true;};
export const learnArrowRain=(player:PlayerState)=>learnArcherAbility(player,"arrow-rain");
export const selectArcherAbility=(player:PlayerState,ability:ArcherAbilityType)=>{if(!player.learnedArcherAbilities.includes(ability))return false;player.selectedArcherAbility=ability;return true;};
