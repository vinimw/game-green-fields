import { describe, expect, it, vi } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { CheatCodeSystem } from './CheatCodeSystem';

describe('CheatCodeSystem',()=>{
  it('rewards the configured number of coins when money is typed',()=>{
    const onAction=vi.fn(),cheats=new CheatCodeSystem(onAction,()=>1000,false);
    for(const key of 'money')cheats.input(key);
    expect(onAction).toHaveBeenCalledWith({type:'money',amount:GAME_CONFIG.cheats.moneyRewardCoins});
  });

  it('accepts the code regardless of letter case',()=>{
    const onAction=vi.fn(),cheats=new CheatCodeSystem(onAction,()=>1000,false);
    for(const key of 'MoNeY')cheats.input(key);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('resets an incomplete code after the configured timeout',()=>{
    let now=0;const onAction=vi.fn(),cheats=new CheatCodeSystem(onAction,()=>now,false);
    for(const key of 'mon')cheats.input(key);
    now=GAME_CONFIG.cheats.inputTimeoutMs+1;
    for(const key of 'ey')cheats.input(key);
    expect(onAction).not.toHaveBeenCalled();
  });
});
