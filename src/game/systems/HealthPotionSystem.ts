import { GAME_CONFIG } from '../config/gameConfig';
import type { PlayerState } from '../core/types';
import { maxHealth } from './StatsSystem';

export type PotionResult={success:boolean;message:string;restored?:number};
export const purchaseHealthPotion=(player:PlayerState):PotionResult=>{const config=GAME_CONFIG.shop.healthPotion;if(player.healthPotions>=config.maxInventory)return{success:false,message:'Potion inventory is full'};if(player.coins<config.cost)return{success:false,message:'Not enough Coins'};player.coins-=config.cost;player.healthPotions++;return{success:true,message:'Health Potion purchased'};};
export const useHealthPotion=(player:PlayerState):PotionResult=>{const maximum=maxHealth(player.stats.vitality,player.level);if(player.currentHealth>=maximum)return{success:false,message:'HP is already full'};if(player.healthPotions<=0)return{success:false,message:'No Health Potions'};const before=player.currentHealth;player.currentHealth=Math.min(maximum,before+GAME_CONFIG.shop.healthPotion.healthRestore);player.healthPotions--;return{success:true,message:`+${player.currentHealth-before} HP`,restored:player.currentHealth-before};};
