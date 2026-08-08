import type { Scene } from '@babylonjs/core';
import type { MonsterType } from '../config/monstersConfig';
import type { Vec2 } from '../core/types';
import { Monster } from '../entities/Monster';
import { scaledMonsterHealth } from '../systems/MonsterScalingSystem';

export class MonsterFactory {
  private sequence = 0;
  constructor(
    private scene: Scene,
    private mapId: string,
    private playerLevel: () => number = () => 1,
  ) {}
  create(type: MonsterType, position: Vec2): Monster {
    const id = `${type}-${this.mapId}-${Date.now()}-${++this.sequence}`;
    const level = this.playerLevel();
    return new Monster(this.scene, { id, type, alive: true, health: scaledMonsterHealth(type, level), scaledToPlayerLevel: level, position: { ...position }, spawnPosition: { ...position } });
  }
}
