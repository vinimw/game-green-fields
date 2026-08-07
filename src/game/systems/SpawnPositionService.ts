import type { Vec2 } from '../core/types';
import type { SafeZone, SpawnArea } from '../world/worldData';

export type SpawnObstacle = Vec2 & { radius: number };
export type SpawnValidationOptions = { minDistanceFromPlayer: number; maxAttempts: number; obstacleClearance: number };
export const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);
export const isValidSpawnPosition = (position: Vec2, player: Vec2, areas: SpawnArea[], safeZones: SafeZone[], obstacles: SpawnObstacle[], options: SpawnValidationOptions) =>
  areas.some(a => position.x >= a.minX && position.x <= a.maxX && position.z >= a.minZ && position.z <= a.maxZ) &&
  distance(position, player) >= options.minDistanceFromPlayer &&
  !safeZones.some(z => distance(position, z.center) < z.radius) &&
  !obstacles.some(o => distance(position, o) < o.radius + options.obstacleClearance);

export class SpawnPositionService {
  attemptsLastSearch = 0;
  constructor(private areas: SpawnArea[], private safeZones: SafeZone[], private obstacles: SpawnObstacle[], private options: SpawnValidationOptions, private random: () => number = Math.random) {}
  findValidSpawnPosition(player: Vec2, preferredCenter?: Vec2, groupRadius = 0): Vec2 | null {
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      this.attemptsLastSearch = attempt;
      let position: Vec2;
      if (preferredCenter) { const angle = this.random() * Math.PI * 2, radius = this.random() * groupRadius; position = { x: preferredCenter.x + Math.cos(angle) * radius, z: preferredCenter.z + Math.sin(angle) * radius }; }
      else { const area = this.areas[Math.floor(this.random() * this.areas.length)]; if (!area) return null; position = { x: area.minX + this.random() * (area.maxX - area.minX), z: area.minZ + this.random() * (area.maxZ - area.minZ) }; }
      if (isValidSpawnPosition(position, player, this.areas, this.safeZones, this.obstacles, this.options)) return position;
    }
    return null;
  }
}
