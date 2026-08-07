import type { Scene } from '@babylonjs/core';
import { MONSTERS_CONFIG, type MonsterType } from '../config/monstersConfig';
import type { Vec2 } from '../core/types';
import { Monster } from '../entities/Monster';

export class MonsterFactory {
  private sequence = 0;
  constructor(private scene: Scene, private mapId: string) {}
  create(type: MonsterType, position: Vec2): Monster {
    const id = `${type}-${this.mapId}-${Date.now()}-${++this.sequence}`;
    return new Monster(this.scene, { id, type, alive: true, health: MONSTERS_CONFIG[type].health, position: { ...position }, spawnPosition: { ...position } });
  }
}
