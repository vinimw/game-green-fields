import { describe, expect, it } from 'vitest';
import type { MonsterType } from '../config/monstersConfig';
import type { Monster } from '../entities/Monster';
import type { MonsterState, Vec2 } from '../core/types';
import { allowedSpawnCount, aliveCountByType, MonsterPopulationSystem, selectSpawnType } from './MonsterPopulationSystem';
import { isValidSpawnPosition, SpawnPositionService } from './SpawnPositionService';

const areas=[{id:'field',minX:-10,maxX:10,minZ:-10,maxZ:10}],zones=[{id:'camp',center:{x:0,z:0},radius:2}],options={minDistanceFromPlayer:3,maxAttempts:3,obstacleClearance:1};
const state=(type:MonsterType,alive=true,position:Vec2={x:8,z:8}):MonsterState=>({id:`${type}-${Math.random()}`,type,alive,health:5,position:{...position},spawnPosition:{...position}});
const fake=(type:MonsterType,alive=true,position?:Vec2)=>({state:state(type,alive,position),readyForRemoval:false,dispose(){}}) as unknown as Monster;
const rules={slime:{enabled:true,maxAlive:2,respawnDelayMs:10,spawnGroupSize:3,spawnWeight:70},'evil-sunflower':{enabled:true,maxAlive:1,respawnDelayMs:10,spawnGroupSize:1,spawnWeight:30}};

describe('spawn position',()=>{
  it('rejects positions near the player',()=>expect(isValidSpawnPosition({x:3,z:0},{x:1,z:0},areas,zones,[],options)).toBe(false));
  it('rejects safe zones',()=>expect(isValidSpawnPosition({x:1,z:1},{x:10,z:10},areas,zones,[],options)).toBe(false));
  it('stops after max attempts',()=>{const service=new SpawnPositionService(areas,zones,[],options,()=>.5);expect(service.findValidSpawnPosition({x:0,z:0})).toBeNull();expect(service.attemptsLastSearch).toBe(3);});
});
describe('population rules',()=>{
  it('never exceeds global or type limits',()=>{expect(allowedSpawnCount(15,1,3,15,12)).toBe(0);expect(allowedSpawnCount(5,12,3,15,12)).toBe(0);});
  it('shrinks a group to available capacity',()=>expect(allowedSpawnCount(14,11,3,15,12)).toBe(1));
  it('a dead monster releases a slot',()=>expect(aliveCountByType([fake('slime'),fake('slime',false)],'slime')).toBe(1));
  it('ignores types at their limit',()=>expect(selectSpawnType({slime:2,'evil-sunflower':0},rules,()=>0)).toBe('evil-sunflower'));
  it('respawns after its delay with a new home position',()=>{const monsters=[fake('slime')],positions={findValidSpawnPosition:()=>({x:7,z:-7})} as unknown as SpawnPositionService;let created:MonsterState|undefined;const population=new MonsterPopulationSystem(monsters,positions,(type,position)=>{created=state(type,true,position);return {state:created,readyForRemoval:false,dispose(){}} as unknown as Monster;},()=>({x:0,z:0}));population.onMonsterKilled('slime');monsters[0]!.state.alive=false;expect(population.totalAlive).toBe(0);population.update(5000);expect(population.totalAlive).toBeGreaterThan(0);expect(created?.spawnPosition).toEqual({x:7,z:-7});});
});
