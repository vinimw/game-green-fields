import { describe,expect,it } from 'vitest';
import { createPlayerState } from '../core/GameState';import { GAME_CONFIG } from '../config/gameConfig';
import { addExperience,requiredXP } from './ExperienceSystem';
import { maxHealth } from './StatsSystem';

describe('level health',()=>{
  it('adds the configured maximum health for every level after level one',()=>{expect(maxHealth(1,1)).toBe(100);expect(maxHealth(1,10)).toBe(100+9*GAME_CONFIG.player.healthPerLevel);});
  it('fully restores health after gaining a level',()=>{const player=createPlayerState();player.currentHealth=12;addExperience(player,requiredXP(1));expect(player.level).toBe(2);expect(player.currentHealth).toBe(maxHealth(player.stats.vitality,2));});
});
