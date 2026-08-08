import { describe,expect,it } from 'vitest';import { createPlayerState } from '../core/GameState';import type { AutoplayMonster } from './AutoplaySystem';import { AutoplaySystem } from './AutoplaySystem';import { maxHealth } from './StatsSystem';
const position={x:0,z:0};const slime:AutoplayMonster={id:'slime-1',type:'slime',alive:true,health:5,position:{x:6,z:0}};
describe('autoplay decisions',()=>{
  it('hunts a safe living monster',()=>{const player=createPlayerState('archer');expect(new AutoplaySystem().decide(player,position,[slime],[],[])).toMatchObject({mode:'attack',monsterId:'slime-1'});});
  it('walks toward a monster outside attack range',()=>{const player=createPlayerState('magic');expect(new AutoplaySystem().decide(player,position,[slime],[],[])).toMatchObject({mode:'hunt',monsterId:'slime-1',destination:slime.position});});
  it('collects Coins before hunting when the area is safe',()=>{const player=createPlayerState('magic'),coin={x:1,z:1};expect(new AutoplaySystem().decide(player,position,[{...slime,position:{x:20,z:0}}],[],[coin])).toEqual({mode:'coins',destination:coin});});
  it('does not seek a heart when health does not need restoration',()=>{const player=createPlayerState('magic');expect(new AutoplaySystem().decide(player,position,[],[{x:1,z:0}],[]).mode).toBe('idle');});
  it('prioritizes a heart when health is low',()=>{const player=createPlayerState('magic'),heart={x:2,z:0};player.currentHealth=maxHealth(player.stats.vitality,player.level)*.3;expect(new AutoplaySystem().decide(player,position,[slime],[heart],[{x:1,z:0}])).toEqual({mode:'heart',destination:heart});});
  it('retreats from the nearest monster at critical health without a heart',()=>{const player=createPlayerState('magic');player.currentHealth=maxHealth(player.stats.vitality,player.level)*.3;const decision=new AutoplaySystem().decide(player,position,[slime],[],[]);expect(decision.mode).toBe('retreat');expect(decision.destination!.x).toBeLessThan(0);});
  it('does not choose a monster whose expected damage is unsafe',()=>{const player=createPlayerState('magic');player.currentHealth=50;expect(new AutoplaySystem().decide(player,position,[slime],[],[]).mode).toBe('retreat');});
  it('ignores dead monsters',()=>{const player=createPlayerState('magic');expect(new AutoplaySystem().decide(player,position,[{...slime,alive:false}],[],[]).mode).toBe('idle');});
});
