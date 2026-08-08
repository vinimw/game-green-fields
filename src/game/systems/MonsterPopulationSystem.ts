import { MONSTER_SPAWN_CONFIG, type MonsterType } from '../config/monstersConfig';
import type { PendingRespawn, Vec2 } from '../core/types';
import type { Monster } from '../entities/Monster';
import type { SpawnPositionService } from './SpawnPositionService';

type SpawnRule = { enabled: boolean; maxAlive: number; respawnDelayMs: number; spawnGroupSize: number; spawnWeight: number };
type SpawnRules = Record<MonsterType, SpawnRule>;
export const aliveCountByType = (monsters: readonly { state: { alive: boolean; type: MonsterType } }[], type: MonsterType) => monsters.filter(m => m.state.alive && m.state.type === type).length;
export const allowedSpawnCount = (totalAlive: number, typeAlive: number, groupSize: number, maxTotal: number, maxType: number) => Math.max(0, Math.min(groupSize, maxTotal - totalAlive, maxType - typeAlive));
export const selectSpawnType = (counts: Record<MonsterType, number>, rules: SpawnRules, random: () => number = Math.random): MonsterType | null => {
  const eligible = (Object.keys(rules) as MonsterType[]).filter(type => rules[type].enabled && counts[type] < rules[type].maxAlive);
  const totalWeight = eligible.reduce((sum, type) => sum + rules[type].spawnWeight, 0); if (totalWeight <= 0) return null;
  let roll = random() * totalWeight; for (const type of eligible) { roll -= rules[type].spawnWeight; if (roll < 0) return type; } return eligible.at(-1) ?? null;
};
export class MonsterPopulationSystem {
  readonly pendingRespawns: PendingRespawn[]; private readonly rules: SpawnRules = MONSTER_SPAWN_CONFIG.monsters;
  constructor(private monsters: Monster[], private positions: SpawnPositionService, private createMonster: (type: MonsterType, position: Vec2) => Monster, private playerPosition: () => Vec2, pending: PendingRespawn[] = [], private random: () => number = Math.random) { this.pendingRespawns = pending.map(p => ({ ...p })); }
  get totalAlive(){return this.monsters.filter(m => m.state.alive).length;}
  aliveByType(type: MonsterType){return aliveCountByType(this.monsters,type);}
  initialize(){const target=Math.round(MONSTER_SPAWN_CONFIG.maxMonsters*MONSTER_SPAWN_CONFIG.initialPopulationPercent);let guard=MONSTER_SPAWN_CONFIG.maxSpawnAttempts;while(this.totalAlive<target&&guard-->0){const type=this.selectType();if(!type||this.spawn(type)===0)break;}}
  onMonsterKilled(type:MonsterType){this.pendingRespawns.push({type,remainingTimeMs:this.rules[type].respawnDelayMs??MONSTER_SPAWN_CONFIG.respawn.defaultDelayMs});}
  update(deltaMs:number){for(const pending of this.pendingRespawns)pending.remainingTimeMs-=deltaMs;for(let i=this.pendingRespawns.length-1;i>=0;i--){const pending=this.pendingRespawns[i];if(pending&&pending.remainingTimeMs<=0){if(this.spawn(pending.type)>0)this.pendingRespawns.splice(i,1);else pending.remainingTimeMs=MONSTER_SPAWN_CONFIG.retryDelayMs;}}for(let i=this.monsters.length-1;i>=0;i--){const monster=this.monsters[i];if(monster?.readyForRemoval){monster.dispose();this.monsters.splice(i,1);}}}
  spawn(type:MonsterType){if(!MONSTER_SPAWN_CONFIG.enabled)return 0;const count=allowedSpawnCount(this.totalAlive,this.aliveByType(type),this.rules[type].spawnGroupSize,MONSTER_SPAWN_CONFIG.maxMonsters,this.rules[type].maxAlive);if(count===0)return 0;const player=this.playerPosition(),center=this.positions.findValidSpawnPosition(player);if(!center)return 0;let spawned=0;for(let i=0;i<count;i++){const position=i===0?center:this.positions.findValidSpawnPosition(player,center,MONSTER_SPAWN_CONFIG.groupRadius);if(!position)continue;this.monsters.push(this.createMonster(type,position));spawned++;}return spawned;}
  selectType(){return selectSpawnType({crawler:this.aliveByType('crawler'),wailer:this.aliveByType('wailer'),ghost:this.aliveByType('ghost')},this.rules,this.random);}
  snapshot(){return this.pendingRespawns.map(p=>({...p}));}
}
