import { GAME_CONFIG } from '../config/gameConfig';
import { MONSTERS_CONFIG,type MonsterType } from '../config/monstersConfig';
import type { PlayerState,Vec2 } from '../core/types';
import { attackRange,maxHealth } from './StatsSystem';

export type AutoplayMonster={id:string;type:MonsterType;alive:boolean;health:number;position:Vec2};
export type AutoplayContext={darknessActive:boolean;darknessRemainingMs:number;raidActive:boolean;corePosition:Vec2};
export type AutoplayAction='use-potion'|'refill-lantern'|'toggle-lantern';
export type AutoplayDecision={mode:'coins'|'hunt'|'attack'|'retreat'|'defend'|'idle';destination?:Vec2;monsterId?:string};
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.z-b.z);
const nearest=<T extends Vec2>(origin:Vec2,items:T[])=>items.reduce<T|undefined>((best,item)=>!best||distance(origin,item)<distance(origin,best)?item:best,undefined);

export class AutoplaySystem{
  decideActions(player:PlayerState,position:Vec2,monsters:AutoplayMonster[],context:AutoplayContext):AutoplayAction[]{
    const actions:AutoplayAction[]=[],maximum=maxHealth(player.stats.vitality,player.level),missingHealth=maximum-player.currentHealth;
    const nearby=monsters.filter(monster=>monster.alive&&distance(position,monster.position)<=MONSTERS_CONFIG[monster.type].detectionRadius);
    const incomingDamage=nearby.reduce((highest,monster)=>Math.max(highest,MONSTERS_CONFIG[monster.type].damage),0);
    const dangerHealth=Math.max(maximum*GAME_CONFIG.autoplay.criticalHealthPercent/100,incomingDamage*GAME_CONFIG.autoplay.potionDangerDamageMultiplier);
    if(player.healthPotions>0&&missingHealth>0&&player.currentHealth<=dangerHealth)actions.push('use-potion');
    if(!context.darknessActive){if(player.lanternOn)actions.push('toggle-lantern');return actions;}
    if(context.darknessRemainingMs<=250){if(player.lanternOn)actions.push('toggle-lantern');return actions;}
    const gas=GAME_CONFIG.shop.lanternGas,refillThreshold=gas.consumptionPerSecond*GAME_CONFIG.autoplay.lanternRefillLeadSeconds;
    let usableFuel=player.lanternFuel;
    if(usableFuel<=refillThreshold&&player.gasCanisters>0){actions.push('refill-lantern');usableFuel=gas.tankCapacity;}
    if(!player.lanternOn&&usableFuel>0)actions.push('toggle-lantern');
    return actions;
  }
  decide(player:PlayerState,position:Vec2,monsters:AutoplayMonster[],coins:Vec2[],context?:AutoplayContext):AutoplayDecision{
    const maximum=maxHealth(player.stats.vitality,player.level),healthPercent=player.currentHealth/maximum*100,critical=healthPercent<=GAME_CONFIG.autoplay.criticalHealthPercent;
    const alive=monsters.filter(monster=>monster.alive),closestMonster=nearest(position,alive.map(monster=>({...monster,x:monster.position.x,z:monster.position.z}))) as (AutoplayMonster&Vec2)|undefined;
    if(critical){if(closestMonster){const dx=position.x-closestMonster.position.x,dz=position.z-closestMonster.position.z,length=Math.hypot(dx,dz)||1;return{mode:'retreat',destination:{x:position.x+dx/length*6,z:position.z+dz/length*6}};}return{mode:'idle'};}
    if(context?.raidActive){const target=alive.reduce<AutoplayMonster|undefined>((best,monster)=>!best||distance(monster.position,context.corePosition)<distance(best.position,context.corePosition)?monster:best,undefined);if(!target)return{mode:'defend',destination:context.corePosition};const targetDistance=distance(position,target.position);return targetDistance<=attackRange(player.powerType)?{mode:'attack',destination:target.position,monsterId:target.id}:{mode:'hunt',destination:target.position,monsterId:target.id};}
    const coin=nearest(position,coins);if(coin&&(!closestMonster||distance(position,closestMonster.position)>MONSTERS_CONFIG[closestMonster.type].detectionRadius*.75))return{mode:'coins',destination:coin};
    const safe=alive.filter(monster=>player.currentHealth>MONSTERS_CONFIG[monster.type].damage*GAME_CONFIG.autoplay.safeHealthDamageMultiplier),target=safe.reduce<AutoplayMonster|undefined>((best,monster)=>{if(!best)return monster;const score=distance(position,monster.position)+monster.health*.05,bestScore=distance(position,best.position)+best.health*.05;return score<bestScore?monster:best;},undefined);
    if(!target)return coin?{mode:'coins',destination:coin}:{mode:'idle'};const targetDistance=distance(position,target.position);if(targetDistance<=attackRange(player.powerType))return{mode:'attack',destination:target.position,monsterId:target.id};return{mode:'hunt',destination:target.position,monsterId:target.id};
  }
}
