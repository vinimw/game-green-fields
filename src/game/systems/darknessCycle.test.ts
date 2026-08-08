import { describe,expect,it } from 'vitest';
import { HORROR_THEME_CONFIG } from '../config/horrorThemeConfig';
import { DarknessCycleSystem } from './DarknessCycleSystem';

describe('Darkness cycle',()=>{
  it('starts darkness after thirty seconds',()=>{const cycle=new DarknessCycleSystem();expect(cycle.update(HORROR_THEME_CONFIG.darkness.intervalMs-1)).toBe('none');expect(cycle.update(1)).toBe('started');expect(cycle.isDark).toBe(true);});
  it('ends darkness after five seconds and restarts the interval',()=>{const cycle=new DarknessCycleSystem();cycle.update(HORROR_THEME_CONFIG.darkness.intervalMs);expect(cycle.update(HORROR_THEME_CONFIG.darkness.durationMs)).toBe('ended');expect(cycle.isDark).toBe(false);expect(cycle.remainingMs).toBe(HORROR_THEME_CONFIG.darkness.intervalMs);});
});
