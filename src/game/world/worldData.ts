import type { MonsterState, Vec2 } from '../core/types'; import { MONSTERS_CONFIG } from '../config/monstersConfig';
export type WorldObject = { id: string; type: 'tree'|'rock'|'flower'|'campfire'; position: Vec2; scale?: number };
export type SpawnArea = { id: string; minX: number; maxX: number; minZ: number; maxZ: number };
export type SafeZone = { id: string; center: Vec2; radius: number };
export const spawnAreas: SpawnArea[] = [
  { id: 'north-field', minX: -27, maxX: 27, minZ: 16, maxZ: 27 },
  { id: 'south-field', minX: -27, maxX: 27, minZ: -27, maxZ: -16 },
  { id: 'east-meadow', minX: 18, maxX: 27, minZ: -14, maxZ: 14 },
  { id: 'west-meadow', minX: -27, maxX: -18, minZ: -14, maxZ: 14 }
];
export const safeZones: SafeZone[] = [{ id: 'initial-camp', center: { x: 0, z: 0 }, radius: 10 }];
export const worldObjects: WorldObject[] = [
  {id:'camp-001',type:'campfire',position:{x:2,z:1}}, {id:'tree-001',type:'tree',position:{x:-7,z:-3},scale:1.2},{id:'tree-002',type:'tree',position:{x:8,z:2}},{id:'tree-003',type:'tree',position:{x:-9,z:9}},{id:'tree-004',type:'tree',position:{x:12,z:-9},scale:1.3},{id:'rock-001',type:'rock',position:{x:5,z:7}},{id:'rock-002',type:'rock',position:{x:-5,z:5}},
  ...Array.from({length:18},(_,i)=>({id:`flower-${i}`,type:'flower' as const,position:{x:(i*7%31)-15,z:(i*11%29)-14},scale:.7})) ];
const monster = (id: string, type: MonsterState['type'], x:number,z:number): MonsterState => ({ id,type,alive:true,health:MONSTERS_CONFIG[type].health,position:{x,z},spawnPosition:{x,z} });
export const initialMonsters = [monster('slime-green-fields-001','slime',8,-5),monster('slime-green-fields-002','slime',10,-4),monster('slime-green-fields-003','slime',9,-7),monster('sunflower-green-fields-001','evil-sunflower',-10,-8)];
