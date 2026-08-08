import { NullEngine,Scene } from '@babylonjs/core';
import { describe,expect,it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { Monster } from '../entities/Monster';

describe('Monster death smoke',()=>{
  it('creates smoke puffs and waits for the effect before removal',()=>{const engine=new NullEngine(),scene=new Scene(engine),monster=new Monster(scene,{id:'smoke-test',type:'crawler',alive:true,health:1,position:{x:2,z:3},spawnPosition:{x:2,z:3}});expect(monster.damage(1)).toBe(true);expect(scene.meshes.filter(mesh=>mesh.name.startsWith('smoke-test-death-smoke-'))).toHaveLength(GAME_CONFIG.effects.monsterDeathSmoke.puffCount);monster.animateDeath(GAME_CONFIG.effects.monsterDeathSmoke.durationSeconds/2);expect(monster.readyForRemoval).toBe(false);monster.animateDeath(GAME_CONFIG.effects.monsterDeathSmoke.durationSeconds/2);expect(monster.readyForRemoval).toBe(true);monster.dispose();scene.dispose();engine.dispose();});
});
