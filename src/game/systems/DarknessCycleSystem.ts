import { HORROR_THEME_CONFIG } from '../config/horrorThemeConfig';

export type DarknessTransition='started'|'ended'|'none';
export class DarknessCycleSystem{
  isDark=false;
  remainingMs:number=HORROR_THEME_CONFIG.darkness.intervalMs;
  update(deltaMs:number):DarknessTransition{
    if(!HORROR_THEME_CONFIG.darkness.enabled)return'none';
    this.remainingMs-=deltaMs;
    if(this.remainingMs>0)return'none';
    this.isDark=!this.isDark;
    this.remainingMs=this.isDark?HORROR_THEME_CONFIG.darkness.durationMs:HORROR_THEME_CONFIG.darkness.intervalMs;
    return this.isDark?'started':'ended';
  }
}
