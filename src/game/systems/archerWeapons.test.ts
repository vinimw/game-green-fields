import { beforeEach, describe, expect, it } from 'vitest';
import { ARCHER_WEAPONS, getArcherWeapon } from '../config/archerWeaponsConfig';
import { GAME_CONFIG } from '../config/gameConfig';
import { createPlayerState } from '../core/GameState';
import type { SaveData } from '../core/types';
import { SaveSystem } from './SaveSystem';
import { purchaseArcherWeapon } from './ArcherWeaponSystem';
import { attackCooldownMs,powerDamage } from './StatsSystem';

describe('archer weapon progression', () => {
  it('defines all 12 ordered weapon levels', () => expect(ARCHER_WEAPONS.map(value => value.level)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]));
  it('defines the expected bonuses at the progression limits', () => { expect(getArcherWeapon(1)?.damageBonusPercent).toBe(2); expect(getArcherWeapon(12)?.damageBonusPercent).toBe(24); });
  it('adds 5% attack speed per bow level',()=>{expect(getArcherWeapon(1)?.attackSpeedBonusPercent).toBe(5);expect(getArcherWeapon(12)?.attackSpeedBonusPercent).toBe(60);expect(attackCooldownMs('archer',12)).toBeLessThan(attackCooldownMs('archer',1));});
  it('calculates damage with agility and the equipped bow bonus', () => { const player=createPlayerState('archer'); player.stats.agility=10; expect(powerDamage('archer',player.stats,1)).toBe(31); expect(powerDamage('archer',player.stats,12)).toBe(37); });
  it('does not use strength in Archer damage', () => { const player=createPlayerState('archer'); player.stats.agility=5; const before=powerDamage('archer',player.stats,4); player.stats.strength=999; expect(powerDamage('archer',player.stats,4)).toBe(before); });
  it('rounds the final damage only once', () => { const player=createPlayerState('archer'); player.stats.agility=1; expect(powerDamage('archer',player.stats,1)).toBe(3); });
  it('buys only the next bow, charges Coins and equips it', () => { const player=createPlayerState('archer'); player.coins=100; expect(purchaseArcherWeapon(player)).toMatchObject({success:true}); expect([player.coins,player.archerWeaponLevel,player.equipment.weapon]).toEqual([0,2,'hunter-bow']); });
  it('rejects purchases without enough Coins without changing state', () => { const player=createPlayerState('archer'); player.coins=99; expect(purchaseArcherWeapon(player).success).toBe(false); expect([player.coins,player.archerWeaponLevel]).toEqual([99,1]); });
  it('does not allow skipping weapon levels', () => { const player=createPlayerState('archer'); expect(purchaseArcherWeapon(player,3).success).toBe(false); expect(player.archerWeaponLevel).toBe(1); });
  it('does not allow another class to buy bows', () => { const player=createPlayerState('magic'); expect(purchaseArcherWeapon(player).success).toBe(false); });
  it('stops purchases at level 12', () => { const player=createPlayerState('archer'); player.archerWeaponLevel=12; player.equipment.weapon='celestial-bow'; const coins=player.coins; expect(purchaseArcherWeapon(player).success).toBe(false); expect(player.coins).toBe(coins); });
  it('uses the same damage function for current and next previews', () => { const player=createPlayerState('archer'); player.stats.agility=7; expect([powerDamage('archer',player.stats,1),powerDamage('archer',player.stats,2)]).toEqual([21,22]); });
});

describe('weapon save migration', () => {
  const memory = new Map<string,string>();
  beforeEach(() => { memory.clear(); Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}}); });
  it('saves and loads Coins and weapon level', () => { const player=createPlayerState('archer'); player.coins=4321; player.archerWeaponLevel=7; player.equipment.weapon='outdated-value'; const data={version:1,player,world:{mapId:'green-fields',monsters:[],npcs:[],objects:[]}} satisfies SaveData; const saves=new SaveSystem(); saves.save(data); const loaded=saves.load(); expect([loaded?.player.coins,loaded?.player.archerWeaponLevel,loaded?.player.equipment.weapon]).toEqual([4321,7,'shadowstring-bow']); });
  it('migrates an old save to the training bow', () => { const player=createPlayerState('archer') as unknown as Record<string,unknown>; delete player.archerWeaponLevel; memory.set(GAME_CONFIG.saveKey,JSON.stringify({version:1,player,world:{mapId:'green-fields',monsters:[],npcs:[],objects:[]}})); const loaded=new SaveSystem().load(); expect([loaded?.player.coins,loaded?.player.archerWeaponLevel,loaded?.player.equipment.weapon]).toEqual([GAME_CONFIG.player.initialCoins,1,'training-bow']); });
});
