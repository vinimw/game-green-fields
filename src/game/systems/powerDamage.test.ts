import { describe,expect,it } from 'vitest';
import { createPlayerState } from '../core/GameState';
import { powerDamage } from './StatsSystem';

describe('power damage',()=>{
  it('uses configurable base damage plus intelligence for magic',()=>{const player=createPlayerState('magic');player.stats.intelligence=2;player.stats.strength=99;expect(powerDamage(player.powerType,player.stats)).toBe(9);});
  it('does not change magic damage with Strength or Agility',()=>{const player=createPlayerState('magic');player.stats.intelligence=3;const before=powerDamage(player.powerType,player.stats);player.stats.strength=99;player.stats.agility=99;expect(powerDamage(player.powerType,player.stats)).toBe(before);});
  it('uses intelligence times three for healer',()=>{const player=createPlayerState('healer');player.stats.intelligence=4;expect(powerDamage(player.powerType,player.stats)).toBe(12);});
  it('uses agility times three for archer',()=>{const player=createPlayerState('archer');player.stats.agility=5;player.stats.intelligence=99;expect(powerDamage(player.powerType,player.stats)).toBe(15);});
  it('stores the chosen power in a new player',()=>expect(createPlayerState('archer').powerType).toBe('archer'));
});
