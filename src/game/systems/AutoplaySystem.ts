import { GAME_CONFIG } from '../config/gameConfig';import { MONSTERS_CONFIG,type MonsterType } from '../config/monstersConfig';import type { PlayerState,Vec2 } from '../core/types';import { attackRange,maxHealth } from './StatsSystem';
export type AutoplayMonster={id:string;type:MonsterType;alive:boolean;health:number;position:Vec2};
export type AutoplayDecision={mode:'heart'|'coins'|'hunt'|'attack'|'retreat'|'idle';destination?:Vec2;monsterId?:string};
const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.z-b.z);const nearest=<T extends Vec2>(origin:Vec2,items:T[])=>items.reduce<T|undefined>((best,item)=>!best||distance(origin,item)<distance(origin,best)?item:best,undefined);
export class AutoplaySystem{
  decide(player:PlayerState,position:Vec2,monsters:AutoplayMonster[],hearts:Vec2[],coins:Vec2[]):AutoplayDecision{
    const maximum=maxHealth(player.stats.vitality,player.level),healthPercent=player.currentHealth/maximum*100,critical=healthPercent<=GAME_CONFIG.autoplay.criticalHealthPercent,needsHeart=maximum-player.currentHealth>=GAME_CONFIG.autoplay.heartMinimumMissingHealth,heart=needsHeart?nearest(position,hearts):undefined;
    if(heart&&(critical||distance(position,heart)<8))return{mode:'heart',destination:heart};
    const alive=monsters.filter(monster=>monster.alive),closestMonster=alive.reduce<AutoplayMonster|undefined>((best,monster)=>!best||distance(position,monster.position)<distance(position,best.position)?monster:best,undefined);
    if(critical){if(heart)return{mode:'heart',destination:heart};if(closestMonster){const dx=position.x-closestMonster.position.x,dz=position.z-closestMonster.position.z,length=Math.hypot(dx,dz)||1;return{mode:'retreat',destination:{x:position.x+dx/length*6,z:position.z+dz/length*6}};}return{mode:'idle'};}
    const coin=nearest(position,coins);if(coin&&(!closestMonster||distance(position,closestMonster.position)>MONSTERS_CONFIG[closestMonster.type].detectionRadius*.75))return{mode:'coins',destination:coin};
    const safe=alive.filter(monster=>player.currentHealth>MONSTERS_CONFIG[monster.type].damage*GAME_CONFIG.autoplay.safeHealthDamageMultiplier),target=safe.reduce<AutoplayMonster|undefined>((best,monster)=>{if(!best)return monster;const score=distance(position,monster.position)+monster.health*.05,bestScore=distance(position,best.position)+best.health*.05;return score<bestScore?monster:best;},undefined);
    if(!target)return coin?{mode:'coins',destination:coin}:{mode:'idle'};const targetDistance=distance(position,target.position);if(targetDistance<=attackRange(player.powerType))return{mode:'attack',destination:target.position,monsterId:target.id};return{mode:'hunt',destination:target.position,monsterId:target.id};
  }
}
