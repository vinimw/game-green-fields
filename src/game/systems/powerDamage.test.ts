import { describe,expect,it } from 'vitest';
import { createPlayerState } from '../core/GameState';
import { powerDamage } from './StatsSystem';

describe('power damage',()=>{
  it('uses intelligence times three for magic',()=>{const player=createPlayerState('magic');player.stats.intelligence=3;player.stats.strength=99;expect(powerDamage(player.powerType,player.stats)).toBe(9);});
  it('uses intelligence times three for healer',()=>{const player=createPlayerState('healer');player.stats.intelligence=4;expect(powerDamage(player.powerType,player.stats)).toBe(12);});
  it('uses agility times three for archer',()=>{const player=createPlayerState('archer');player.stats.agility=5;player.stats.intelligence=99;expect(powerDamage(player.powerType,player.stats)).toBe(15);});
  it('stores the chosen power in a new player',()=>expect(createPlayerState('archer').powerType).toBe('archer'));
});
