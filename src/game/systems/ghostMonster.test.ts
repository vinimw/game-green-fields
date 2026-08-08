import { NullEngine,Scene } from '@babylonjs/core';
import { describe,expect,it } from 'vitest';
import { MONSTERS_CONFIG,MONSTER_SPAWN_CONFIG } from '../config/monstersConfig';
import { createPlayerState } from '../core/GameState';
import { Monster } from '../entities/Monster';
import { Player } from '../entities/Player';

const createGhost=(scene:Scene)=>new Monster(scene,{id:'ghost-test',type:'ghost',alive:true,health:60,position:{x:0,z:2},spawnPosition:{x:0,z:2}});
describe('Ghost monster',()=>{
  it('has its configured combat stats and extended vision',()=>{expect(MONSTERS_CONFIG.ghost).toMatchObject({level:3,health:60,damage:60,experienceReward:50,detectionRadius:18,coinDrop:{chance:.4,amount:20}});expect(MONSTERS_CONFIG.ghost.detectionRadius).toBeGreaterThan(MONSTERS_CONFIG.wailer.detectionRadius);expect(MONSTER_SPAWN_CONFIG.monsters.ghost.maxAlive).toBeGreaterThan(0);});
  it('blinks twice, becomes untargetable for two seconds, then returns',()=>{const engine=new NullEngine(),scene=new Scene(engine),player=new Player(scene,createPlayerState()),ghost=createGhost(scene);ghost.update(player,2.55,()=>{},false);expect([ghost.root.isEnabled(),ghost.isTargetable]).toEqual([false,true]);ghost.update(player,.15,()=>{},false);expect(ghost.root.isEnabled()).toBe(true);ghost.update(player,.15,()=>{},false);expect([ghost.root.isEnabled(),ghost.isTargetable]).toEqual([false,true]);ghost.update(player,.15,()=>{},false);expect(ghost.isTargetable).toBe(false);ghost.update(player,2,()=>{},false);expect([ghost.root.isEnabled(),ghost.isTargetable]).toEqual([true,true]);ghost.dispose();player.root.dispose(false,true);scene.dispose();engine.dispose();});
  it('continues attacking while invisible',()=>{const engine=new NullEngine(),scene=new Scene(engine),player=new Player(scene,createPlayerState()),ghost=createGhost(scene);let damage=0;ghost.update(player,3,value=>damage+=value,false);expect(ghost.isTargetable).toBe(false);ghost.update(player,1.5,value=>damage+=value,false);expect(ghost.isTargetable).toBe(false);expect(damage).toBe(60);ghost.dispose();player.root.dispose(false,true);scene.dispose();engine.dispose();});
});
