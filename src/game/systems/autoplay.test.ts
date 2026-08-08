import { describe,expect,it } from 'vitest';
import { createPlayerState } from '../core/GameState';
import type { AutoplayContext,AutoplayMonster } from './AutoplaySystem';
import { AutoplaySystem } from './AutoplaySystem';
import { maxHealth } from './StatsSystem';

const position={x:0,z:0},crawler:AutoplayMonster={id:'crawler-1',type:'crawler',alive:true,health:16,position:{x:6,z:0}},wailer:AutoplayMonster={id:'wailer-1',type:'wailer',alive:true,health:32,position:{x:6,z:0}};
const context=(values:Partial<AutoplayContext>={}):AutoplayContext=>({darknessActive:false,darknessRemainingMs:30000,raidActive:false,corePosition:{x:0,z:0},...values});

describe('autoplay decisions',()=>{
  it('hunts a safe living monster',()=>{const player=createPlayerState('archer');expect(new AutoplaySystem().decide(player,position,[crawler],[])).toMatchObject({mode:'attack',monsterId:'crawler-1'});});
  it('walks toward a monster outside attack range',()=>{const player=createPlayerState('magic');expect(new AutoplaySystem().decide(player,position,[crawler],[])).toMatchObject({mode:'hunt',monsterId:'crawler-1',destination:crawler.position});});
  it('collects Coins before hunting when the area is safe',()=>{const player=createPlayerState('magic'),coin={x:1,z:1};expect(new AutoplaySystem().decide(player,position,[{...crawler,position:{x:20,z:0}}],[coin])).toEqual({mode:'coins',destination:coin});});
  it('retreats from the nearest monster at critical health',()=>{const player=createPlayerState('magic');player.currentHealth=maxHealth(player.stats.vitality,player.level)*.3;const decision=new AutoplaySystem().decide(player,position,[crawler],[]);expect(decision.mode).toBe('retreat');expect(decision.destination!.x).toBeLessThan(0);});
  it('does not choose a monster whose expected damage is unsafe',()=>{const player=createPlayerState('magic');player.currentHealth=60;expect(new AutoplaySystem().decide(player,position,[wailer],[]).mode).toBe('idle');});
  it('ignores dead monsters',()=>{const player=createPlayerState('magic');expect(new AutoplaySystem().decide(player,position,[{...crawler,alive:false}],[]).mode).toBe('idle');});
  it('uses a potion only when nearby danger could kill the player',()=>{const player=createPlayerState();player.healthPotions=1;player.currentHealth=20;const autoplay=new AutoplaySystem();expect(autoplay.decideActions(player,position,[{...crawler,position:{x:2,z:0}}],context())).toContain('use-potion');player.currentHealth=90;expect(autoplay.decideActions(player,position,[crawler],context())).not.toContain('use-potion');});
  it('uses gas and turns on the lantern only during darkness',()=>{const player=createPlayerState();player.gasCanisters=1;const autoplay=new AutoplaySystem();expect(autoplay.decideActions(player,position,[],context({darknessActive:true,darknessRemainingMs:4000}))).toEqual(['refill-lantern','toggle-lantern']);player.lanternFuel=50;expect(autoplay.decideActions(player,position,[],context({darknessActive:true,darknessRemainingMs:4000}))).toEqual(['toggle-lantern']);});
  it('does not waste gas while the lantern still has useful fuel',()=>{const player=createPlayerState();player.gasCanisters=3;player.lanternFuel=50;player.lanternOn=true;expect(new AutoplaySystem().decideActions(player,position,[],context({darknessActive:true,darknessRemainingMs:4000}))).toEqual([]);});
  it('turns the lantern off outside darkness',()=>{const player=createPlayerState();player.lanternFuel=50;player.lanternOn=true;expect(new AutoplaySystem().decideActions(player,position,[],context())).toEqual(['toggle-lantern']);});
  it('prioritizes the monster closest to the Core during a raid',()=>{const player=createPlayerState('archer'),nearCore={...crawler,id:'core-threat',position:{x:1,z:0}},nearPlayer={...crawler,id:'player-threat',position:{x:8,z:0}};expect(new AutoplaySystem().decide(player,{x:8,z:0},[nearPlayer,nearCore],[],context({raidActive:true})).monsterId).toBe('core-threat');});
  it('returns to defend the Core when a raid target is not visible',()=>{const player=createPlayerState();expect(new AutoplaySystem().decide(player,{x:8,z:8},[],[],context({raidActive:true}))).toEqual({mode:'defend',destination:{x:0,z:0}});});
});
