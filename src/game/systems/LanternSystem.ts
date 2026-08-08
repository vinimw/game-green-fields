import { GAME_CONFIG } from '../config/gameConfig';
import type { PlayerState } from '../core/types';

export type LanternResult={success:boolean;message:string};
export const purchaseGasCanister=(player:PlayerState):LanternResult=>{const config=GAME_CONFIG.shop.lanternGas;if(player.gasCanisters>=config.maxInventory)return{success:false,message:'Gas inventory is full'};if(player.coins<config.cost)return{success:false,message:'Not enough Coins'};player.coins-=config.cost;player.gasCanisters++;return{success:true,message:'Gas Canister purchased'};};
export const refillLantern=(player:PlayerState):LanternResult=>{const config=GAME_CONFIG.shop.lanternGas;if(player.lanternFuel>=config.tankCapacity)return{success:false,message:'Lantern tank is already full'};if(player.gasCanisters<=0)return{success:false,message:'No Gas Canisters'};player.gasCanisters--;player.lanternFuel=config.tankCapacity;return{success:true,message:'Lantern refilled'};};
export const toggleLantern=(player:PlayerState):LanternResult=>{if(player.lanternOn){player.lanternOn=false;return{success:true,message:'Lantern turned off'};}if(player.lanternFuel<=0)return{success:false,message:'Lantern has no gas'};player.lanternOn=true;return{success:true,message:'Lantern turned on'};};
export const drainLantern=(player:PlayerState,deltaSeconds:number)=>{if(!player.lanternOn||player.lanternFuel<=0)return false;player.lanternFuel=Math.max(0,player.lanternFuel-GAME_CONFIG.shop.lanternGas.consumptionPerSecond*deltaSeconds);if(player.lanternFuel>0)return false;player.lanternOn=false;return true;};
