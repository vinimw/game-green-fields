import { describe,expect,it } from 'vitest';
import { createPlayerState } from '../core/GameState';
import { chooseAutoplayStat,distributeAutoplayStats } from './AutoplayStatsSystem';

describe('Autoplay stat distribution',()=>{
  it('prioritizes Agility damage and speed for an Archer',()=>{const player=createPlayerState('archer'),initialAgility=player.stats.agility;player.level=2;player.availableStatPoints=1;expect(distributeAutoplayStats(player)).toEqual(['agility']);expect([player.stats.agility,player.availableStatPoints]).toEqual([initialAgility+1,0]);});
  it('prioritizes Intelligence for a Mage',()=>{const player=createPlayerState('magic');player.level=2;player.availableStatPoints=1;expect(distributeAutoplayStats(player)).toEqual(['intelligence']);});
  it('prioritizes Intelligence for a safe Healer',()=>{const player=createPlayerState('healer');player.level=2;player.availableStatPoints=1;expect(distributeAutoplayStats(player)).toEqual(['intelligence']);});
  it('adds periodic Vitality more often for a Healer',()=>{const player=createPlayerState('healer');player.level=3;player.availableStatPoints=1;expect(distributeAutoplayStats(player)).toEqual(['vitality']);});
  it('chooses Vitality when current health or enemy damage is dangerous',()=>{const player=createPlayerState('magic');player.level=2;player.currentHealth=20;expect(chooseAutoplayStat(player,0)).toBe('vitality');player.currentHealth=150;expect(chooseAutoplayStat(player,100)).toBe('vitality');});
  it('spends every accumulated point without using Strength',()=>{const player=createPlayerState('magic');player.level=4;player.availableStatPoints=3;const allocated=distributeAutoplayStats(player);expect(allocated).toHaveLength(3);expect(allocated).not.toContain('strength');expect(player.availableStatPoints).toBe(0);});
});
