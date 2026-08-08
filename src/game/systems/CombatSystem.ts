import type { Player } from "../entities/Player";
import type { Monster } from "../entities/Monster";
import { GAME_CONFIG } from "../config/gameConfig";
import { attackRange, criticalChance, powerDamage } from "./StatsSystem";
import { addExperience } from "./ExperienceSystem";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { consumeAttackHunger } from "./HungerSystem";
export const isTargetInRange = (distance: number, range: number) =>
  distance <= range;
export class CombatSystem {
  private cooldown = 0;
  constructor(
    private player: Player,
    private feedback: (
      text: string,
      x: number,
      z: number,
      crit: boolean,
    ) => void,
    private onMonsterKilled: (monster: Monster) => void = () => {},
    private onLevelUp: () => void = () => {},
  ) {}
  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt * 1000);
  }
  attackTarget(target: Monster) {
    if (this.cooldown > 0 || !target.isTargetable) return false;
    const dx = target.root.position.x - this.player.root.position.x,
      dz = target.root.position.z - this.player.root.position.z,
      distance = Math.hypot(dx, dz);
    if (!isTargetInRange(distance, attackRange(this.player.state.powerType)))
      return false;
    this.cooldown = GAME_CONFIG.player.attack.cooldownMs;
    consumeAttackHunger(this.player.state);
    this.player.root.rotation.y = Math.atan2(dx, dz);
    const critical =
        Math.random() * 100 < criticalChance(this.player.state.stats.agility),
      damage = Math.round(
        powerDamage(
          this.player.state.powerType,
          this.player.state.stats,
          this.player.state.archerWeaponLevel,
        ) * (critical ? GAME_CONFIG.player.critical.damageMultiplier : 1),
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
    return true;
  }
}
