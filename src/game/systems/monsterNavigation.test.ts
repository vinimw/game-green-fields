import { describe,expect,it } from 'vitest';
import type { SpawnObstacle } from './SpawnPositionService';
import { MonsterNavigationSystem } from './MonsterNavigationSystem';

describe('monster navigation',()=>{
  it('builds a route around an obstacle',()=>{const navigation=new MonsterNavigationSystem(20,[{x:0,z:0,radius:1}],1,.5),path=navigation.findPath({x:-4,z:0},{x:4,z:0});expect(path.length).toBeGreaterThan(0);expect(path.some(point=>Math.abs(point.z)>1)).toBe(true);expect(path.every(point=>Math.hypot(point.x,point.z)>=1.5)).toBe(true);});
  it('recalculates paths around a newly built tower obstacle',()=>{const obstacles:SpawnObstacle[]=[],navigation=new MonsterNavigationSystem(20,obstacles,1,.5);expect(navigation.findPath({x:-4,z:0},{x:4,z:0}).every(point=>point.z===0)).toBe(true);obstacles.push({x:0,z:0,radius:1.5});navigation.invalidateAll();const path=navigation.findPath({x:-4,z:0},{x:4,z:0});expect(path.length).toBeGreaterThan(0);expect(path.some(point=>Math.abs(point.z)>1)).toBe(true);});
  it('does not create paths outside the playable map',()=>{const navigation=new MonsterNavigationSystem(10,[]);expect(navigation.findPath({x:0,z:0},{x:20,z:0})).toEqual([]);});
});
