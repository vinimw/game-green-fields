import type { Player } from "../entities/Player";
import type { Monster } from "../entities/Monster";
import { GAME_CONFIG } from "../config/gameConfig";
import {
  attackCooldownMs,
  attackRange,
  criticalChance,
  powerDamage,
} from "./StatsSystem";
import { addExperience } from "./ExperienceSystem";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { consumeAttackHunger } from "./HungerSystem";
import {
  distanceXZ,
  resolveRangedHits,
  type GroundPosition,
} from "./RangedHitResolver";

export const isTargetInRange = (distance: number, range: number) =>
  distance <= range;
export const selectRicochetTargets = <T>(
  primary: T,
  candidates: { target: T; position: GroundPosition }[],
  primaryPosition: GroundPosition,
  maxRange: number,
  maxBounces: number,
) => [
  primary,
  ...candidates
    .filter(
      (value) =>
        value.target !== primary &&
        distanceXZ(value.position, primaryPosition) <= maxRange,
    )
    .sort(
      (a, b) =>
        distanceXZ(a.position, primaryPosition) -
        distanceXZ(b.position, primaryPosition),
    )
    .slice(0, maxBounces)
    .map((value) => value.target),
];

export class CombatSystem {
  private cooldown = 0;
  constructor(
    private player: Player,
    private monsters: () => Monster[],
    private feedback: (
      text: string,
      x: number,
      z: number,
      crit: boolean,
    ) => void,
    private onMonsterKilled: (monster: Monster) => void = () => {},
    private onLevelUp: () => void = () => {},
    private onImpact: (
      position: GroundPosition,
      targets: Monster[],
    ) => void = () => {},
  ) {}
  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt * 1000);
  }
  attackPosition(targetPosition: GroundPosition) {
    const range = attackRange(this.player.state.powerType);
    if (
      this.cooldown > 0 ||
      !isTargetInRange(
        distanceXZ(this.player.root.position, targetPosition),
        range,
      )
    )
      return false;
    this.cooldown = attackCooldownMs(
      this.player.state.powerType,
      this.player.state.archerWeaponLevel,
    );
    consumeAttackHunger(this.player.state);
    const dx = targetPosition.x - this.player.root.position.x,
      dz = targetPosition.z - this.player.root.position.z;
    this.player.root.rotation.y = Math.atan2(dx, dz);
    return true;
  }
  resolveImpact(
    impactPosition: GroundPosition,
    areaRadius = 0,
    damageMultiplier = 1,
  ) {
    const hitRadius =
      this.player.state.powerType === "archer"
        ? GAME_CONFIG.rangedCombat.archer.hitRadius
        : GAME_CONFIG.rangedCombat.healer.hitRadius;
    const targets = resolveRangedHits(
      impactPosition,
      this.monsters()
        .filter((monster) => monster.isTargetable)
        .map((monster) => ({
          target: monster,
          position: monster.root.position,
        })),
      hitRadius,
      areaRadius,
    );
    if (targets.length === 0) {
      this.onImpact(impactPosition, []);
      return [];
    }
    for (const target of targets) {
      const critical =
          Math.random() * 100 < criticalChance(this.player.state.stats.agility),
        damage = Math.round(
          powerDamage(
            this.player.state.powerType,
            this.player.state.stats,
            this.player.state.archerWeaponLevel,
          ) *
            damageMultiplier *
            (critical ? GAME_CONFIG.player.critical.damageMultiplier : 1),
        );
      this.feedback(
        String(damage),
        target.root.position.x,
        target.root.position.z,
        critical,
      );
      if (target.damage(damage)) {
        const levelsGained = addExperience(
          this.player.state,
          MONSTERS_CONFIG[target.state.type].experienceReward,
        );
        if (levelsGained > 0) this.onLevelUp();
        this.onMonsterKilled(target);
      }
    }
    this.onImpact(impactPosition, targets);
    return targets;
  }
  resolveRicochetImpact(
    impactPosition: GroundPosition,
    maxRange: number,
    maxBounces: number,
    damageMultiplier: number,
  ) {
    const available = this.monsters()
        .filter((monster) => monster.isTargetable)
        .map((monster) => ({
          target: monster,
          position: monster.root.position,
        })),
      primary = resolveRangedHits(
        impactPosition,
        available,
        GAME_CONFIG.rangedCombat.archer.hitRadius,
      )[0];
    if (!primary) {
      this.onImpact(impactPosition, []);
      return [];
    }
    const targets = selectRicochetTargets(primary,available,primary.root.position,maxRange,maxBounces),critical=Math.random()*100<criticalChance(this.player.state.stats.agility),damage=Math.round(powerDamage("archer",this.player.state.stats,this.player.state.archerWeaponLevel)*damageMultiplier*(critical?GAME_CONFIG.player.critical.damageMultiplier:1));
    for (const target of targets) {
      this.feedback(
        String(damage),
        target.root.position.x,
        target.root.position.z,
        critical,
      );
      if (target.damage(damage)) {
        const levels = addExperience(
          this.player.state,
          MONSTERS_CONFIG[target.state.type].experienceReward,
        );
        if (levels > 0) this.onLevelUp();
        this.onMonsterKilled(target);
      }
    }
    this.onImpact(impactPosition, targets);
    return targets;
  }
}
