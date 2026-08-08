import { DEFENSE_CONFIG } from "../config/defenseConfig";
import type { DefenseState, Vec2 } from "../core/types";
import type { SpawnObstacle } from "../systems/SpawnPositionService";
export type PlacementValidation = {
  valid: boolean;
  reason: string;
  distanceToCore: number;
  nearestDefenseDistance: number | null;
};
export class DefensePlacementValidator {
  constructor(
    private core: Vec2,
    private worldSize: number,
    private obstacles: SpawnObstacle[],
  ) {}
  validate(position: Vec2, defenses: DefenseState[]): PlacementValidation {
    const config = DEFENSE_CONFIG.placement,
      distanceToCore = Math.hypot(
        position.x - this.core.x,
        position.z - this.core.z,
      ),
      nearestDefenseDistance = defenses.length
        ? Math.min(
            ...defenses.map((defense) =>
              Math.hypot(
                position.x - defense.position.x,
                position.z - defense.position.z,
              ),
            ),
          )
        : null;
    let reason = "Valid Position";
    if (
      Math.abs(position.x) > this.worldSize / 2 - config.footprintRadius ||
      Math.abs(position.z) > this.worldSize / 2 - config.footprintRadius
    )
      reason = "Outside the map";
    else if (distanceToCore < config.minDistanceFromCore)
      reason = "Too close to the Core";
    else if (distanceToCore > config.maxDistanceFromCore)
      reason = "Outside the Core build area";
    else if (
      nearestDefenseDistance !== null &&
      nearestDefenseDistance < config.minDistanceBetweenDefenses
    )
      reason = "Too close to another Defense";
    else if (
      this.obstacles.some(
        (obstacle) =>
          Math.hypot(position.x - obstacle.x, position.z - obstacle.z) <
          obstacle.radius + config.footprintRadius,
      )
    )
      reason = "Position blocked by an obstacle";
    return {
      valid: reason === "Valid Position",
      reason,
      distanceToCore,
      nearestDefenseDistance,
    };
  }
}
