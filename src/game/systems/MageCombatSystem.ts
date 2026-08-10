import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Scene,
} from "@babylonjs/core";
import {
  getStaff,
  MAGE_CONFIG,
  type MageSpellType,
  type MageAbilityType,
} from "../config/mageConfig";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";
import { addExperience } from "./ExperienceSystem";
import { consumeAttackHunger } from "./HungerSystem";
import {
  attackCooldownMs,
  attackRange,
  criticalChance,
  powerDamage,
} from "./StatsSystem";
import { GAME_CONFIG } from "../config/gameConfig";
import {
  distanceXZ,
  resolveRangedHits,
  targetsWithinRadius,
  type GroundPosition,
} from "./RangedHitResolver";

type Projectile = {
  root: TransformNode;
  targetPosition: Vector3;
  spell: MageSpellType;
  ability:MageAbilityType;
};
export const targetsInsideRadius = <
  T extends { position: { x: number; z: number } },
>(
  center: { x: number; z: number },
  targets: T[],
  radius: number,
) =>
  targetsWithinRadius(
    center,
    targets.map((target) => ({ target, position: target.position })),
    radius,
  ).map((value) => value.target);
export const rollMageDamage = (
  baseDamage: number,
  agility: number,
  random: () => number = Math.random,
) => {
  const critical = random() * 100 < criticalChance(agility);
  return {
    critical,
    damage: Math.round(
      baseDamage *
        (critical ? GAME_CONFIG.player.critical.damageMultiplier : 1) *
        MAGE_CONFIG.combat.aoeDamageMultiplier,
    ),
  };
};

export class MageCombatSystem {
  private cooldownMs = 0;
  private projectiles: Projectile[] = [];
  constructor(
    private scene: Scene,
    private player: Player,
    private monsters: () => Monster[],
    private feedback: (
      text: string,
      x: number,
      z: number,
      critical: boolean,
    ) => void,
    private onMonsterKilled: (monster: Monster) => void = () => {},
    private onLevelUp: () => void = () => {},
    private onImpact: (
      position: GroundPosition,
      targets: Monster[],
    ) => void = () => {},
  ) {}
  cast(targetPosition: GroundPosition) {
    if (
      this.player.state.powerType !== "magic" ||
      this.cooldownMs > 0 ||
      distanceXZ(this.player.root.position, targetPosition) >
        attackRange("magic")
    )
      return false;
    this.cooldownMs = attackCooldownMs("magic", this.player.state.staffLevel);
    consumeAttackHunger(this.player.state);
    const dx = targetPosition.x - this.player.root.position.x,
      dz = targetPosition.z - this.player.root.position.z;
    this.player.root.rotation.y = Math.atan2(dx, dz);
    this.player.playMageAttack();
    const spell = this.player.state.selectedSpell,
      ability=this.player.state.selectedMageAbility,
      start = ability==="rain"?new Vector3(targetPosition.x,9,targetPosition.z):new Vector3(this.player.root.position.x,1.65,this.player.root.position.z),
      root = ability==="rain"?this.createRainProjectile(spell):this.createProjectile(spell);
    root.position.copyFrom(start);
    this.projectiles.push({
      root,
      targetPosition: new Vector3(targetPosition.x, 1, targetPosition.z),
      spell,
      ability,
    });
    return true;
  }
  update(dt: number) {
    this.cooldownMs = Math.max(0, this.cooldownMs - dt * 1000);
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      if (!projectile) continue;
      const delta = projectile.targetPosition.subtract(
          projectile.root.position,
        ),
        distance = delta.length(),
        step = MAGE_CONFIG.combat.projectileSpeed * dt;
      if (distance <= step) {
        this.impact(projectile);
        projectile.root.dispose(false, true);
        this.projectiles.splice(index, 1);
        continue;
      }
      projectile.root.position.addInPlace(delta.scale(step / (distance || 1)));
      projectile.root.rotation.y = Math.atan2(delta.x, delta.z);
    }
  }
  private impact(projectile: Projectile) {
    const staff = getStaff(this.player.state.staffLevel),
      center = {
        x: projectile.targetPosition.x,
        z: projectile.targetPosition.z,
      },
      available = this.monsters()
        .filter((monster) => monster.isTargetable)
        .map((monster) => ({
          target: monster,
          position: monster.root.position,
        })),
      candidates = resolveRangedHits(
        center,
        available,
        MAGE_CONFIG.combat.singleTargetHitRadius,
        staff.level >= 3 ? staff.aoeRadius : 0,
      );
    for (const monster of candidates) {
      const { critical, damage } = rollMageDamage(
        powerDamage(
          "magic",
          this.player.state.stats,
          this.player.state.staffLevel,
        )*MAGE_CONFIG.abilities[projectile.ability].damageMultiplier,
        this.player.state.stats.agility,
      );
      this.feedback(
        String(damage),
        monster.root.position.x,
        monster.root.position.z,
        critical,
      );
      if (monster.damage(damage)) {
        const levels = addExperience(
          this.player.state,
          MONSTERS_CONFIG[monster.state.type].experienceReward,
        );
        if (levels > 0) this.onLevelUp();
        this.onMonsterKilled(monster);
      }
    }
    this.createImpact(
      projectile.spell,
      projectile.targetPosition,
      staff.aoeRadius,
    );
    this.onImpact(center, candidates);
  }
  private createProjectile(spell: MageSpellType) {
    const root = new TransformNode(`mage-${spell}`, this.scene),
      color = spell === "ice-lance" ? "#8eefff" : "#fff36a",
      mat = new StandardMaterial(`${spell}-material`, this.scene);
    mat.diffuseColor = Color3.FromHexString(color);
    mat.emissiveColor = Color3.FromHexString(color);
    const shaft = MeshBuilder.CreateCylinder(
      `${spell}-shaft`,
      {
        height: 1.05,
        diameter: 0.1,
        tessellation: spell === "ice-lance" ? 6 : 4,
      },
      this.scene,
    );
    shaft.parent = root;
    shaft.rotation.x = Math.PI / 2;
    shaft.material = mat;
    const tip = MeshBuilder.CreateCylinder(
      `${spell}-tip`,
      { height: 0.35, diameterTop: 0, diameterBottom: 0.22, tessellation: 6 },
      this.scene,
    );
    tip.parent = root;
    tip.position.z = 0.68;
    tip.rotation.x = Math.PI / 2;
    tip.material = mat;
    return root;
  }
  private createRainProjectile(spell:MageSpellType){const root=new TransformNode(`mage-${spell}-rain`,this.scene),color=spell==="ice-lance"?"#8eefff":"#fff36a",material=new StandardMaterial(`${spell}-rain-material`,this.scene);material.diffuseColor=Color3.FromHexString(color);material.emissiveColor=Color3.FromHexString(color);for(let index=0;index<7;index++){const angle=index/7*Math.PI*2,drop=MeshBuilder.CreateCylinder(`${spell}-rain-drop`,{height:1.1,diameter:.1,tessellation:6},this.scene);drop.parent=root;drop.position.set(Math.cos(angle)*(index%2?.7:1.2),(index%3)*.45,Math.sin(angle)*(index%2?.7:1.2));drop.material=material;}return root;}
  private createImpact(
    spell: MageSpellType,
    position: Vector3,
    radius: number,
  ) {
    const color = spell === "ice-lance" ? "#70e8ff" : "#ffe85c",
      mat = new StandardMaterial(`${spell}-impact-material`, this.scene);
    mat.diffuseColor = Color3.FromHexString(color);
    mat.emissiveColor = Color3.FromHexString(color);
    const count = radius > 0 ? 8 : 4;
    for (let index = 0; index < count; index++) {
      const fragment = MeshBuilder.CreatePolyhedron(
        `${spell}-impact`,
        { type: 1, size: 0.08 },
        this.scene,
      );
      fragment.position.set(
        position.x +
          Math.cos((index / count) * Math.PI * 2) *
            Math.max(0.25, radius * 0.55),
        0.35 + (index % 3) * 0.12,
        position.z +
          Math.sin((index / count) * Math.PI * 2) *
            Math.max(0.25, radius * 0.55),
      );
      fragment.material = mat;
      fragment.isPickable = false;
      setTimeout(() => fragment.dispose(false, true), 280);
    }
    if (
      import.meta.env.DEV &&
      (MAGE_CONFIG.debug.showMageAoERadius ||
        GAME_CONFIG.rangedCombat.debug.showMageAoE) &&
      radius > 0
    ) {
      const points = Array.from({ length: 33 }, (_, index) => {
          const angle = (index / 32) * Math.PI * 2;
          return new Vector3(
            position.x + Math.cos(angle) * radius,
            0.06,
            position.z + Math.sin(angle) * radius,
          );
        }),
        ring = MeshBuilder.CreateLines(
          "mage-aoe-debug",
          { points },
          this.scene,
        );
      ring.color = Color3.FromHexString(color);
      ring.isPickable = false;
      setTimeout(() => ring.dispose(false, true), 500);
    }
  }
}
