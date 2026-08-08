import { GAME_CONFIG } from '../config/gameConfig';
import type { PlayerState,Stats } from '../core/types';
import { maxHealth,spendStat } from './StatsSystem';

const primaryStat=(player:PlayerState):keyof Stats=>player.powerType==='archer'?'agility':'intelligence';
export const chooseAutoplayStat=(player:PlayerState,strongestThreatDamage=0):keyof Stats=>{
  const maximum=maxHealth(player.stats.vitality,player.level),healthPercent=player.currentHealth/maximum*100;
  const vitalityInterval=GAME_CONFIG.autoplay.vitalityEveryLevels[player.powerType],recommendedVitality=GAME_CONFIG.player.initialStats.vitality+Math.floor(player.level/vitalityInterval);
  const unsafeHealth=maximum<strongestThreatDamage*GAME_CONFIG.autoplay.safeHealthDamageMultiplier||healthPercent<=GAME_CONFIG.autoplay.criticalHealthPercent;
  return unsafeHealth||player.stats.vitality<recommendedVitality?'vitality':primaryStat(player);
};
export const distributeAutoplayStats=(player:PlayerState,strongestThreatDamage=0)=>{const allocated:(keyof Stats)[]=[];while(player.availableStatPoints>0){const stat=chooseAutoplayStat(player,strongestThreatDamage);if(!spendStat(player,stat))break;allocated.push(stat);}return allocated;};
export const summarizeStatAllocation=(allocated:(keyof Stats)[])=>{const counts=new Map<keyof Stats,number>();allocated.forEach(stat=>counts.set(stat,(counts.get(stat)??0)+1));return[...counts].map(([stat,count])=>`+${count} ${stat[0]!.toUpperCase()+stat.slice(1)}`).join(', ');};
