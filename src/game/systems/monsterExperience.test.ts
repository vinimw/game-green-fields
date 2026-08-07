import { describe,expect,it } from 'vitest';
import { MONSTERS_CONFIG } from '../config/monstersConfig';

describe('monster experience configuration',()=>{
  it('configures a positive XP reward for a slime',()=>expect(MONSTERS_CONFIG.slime.experienceReward).toBeGreaterThan(0));
  it('configures a positive XP reward for an evil sunflower',()=>expect(MONSTERS_CONFIG['evil-sunflower'].experienceReward).toBeGreaterThan(0));
});
