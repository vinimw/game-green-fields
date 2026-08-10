import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type AbstractMesh,
  type Scene,
} from "@babylonjs/core";
import { DEFENSE_CONFIG, getTowerTargetCount } from "../config/defenseConfig";
import type { DefenseState } from "../core/types";
import type { Monster } from "../entities/Monster";
import { MiniTower } from "./MiniTower";
type Projectile = {
  root: TransformNode;
  target: Monster;
  start: Vector3;
  elapsed: number;
  duration: number;
  damage: number;
  sourceTowerId: string;
};
export type DefenseTarget = {
  id: string;
  position: { x: number; z: number };
  collisionRadius?: number;
  damage: (amount: number) => number;
};
export class DefenseManager {
  private towers: MiniTower[] = [];
  private projectiles: Projectile[] = [];
  constructor(
    private scene: Scene,
    saved: DefenseState[] = [],
    private onMonsterKilled: (monster: Monster) => void = () => {},
    private onDefenseDestroyed: (state: DefenseState) => void = () => {},
    private onTowerDamage: (
      damage: number,
      x: number,
      z: number,
    ) => void = () => {},
  ) {
    saved
      .filter((state) => state.currentHealth > 0)
      .forEach((state) => this.add(state));
  }
  get states() {
    return this.towers
      .filter((tower) => tower.alive)
      .map((tower) => structuredClone(tower.state));
  }
  get count() {
    return this.towers.filter((tower) => tower.alive).length;
  }
  get(id: string) {
    return this.towers.find((tower) => tower.alive && tower.state.id === id);
  }
  findByMesh(mesh: AbstractMesh) {
    return this.towers.find((tower) => tower.alive && tower.containsMesh(mesh));
  }
  targets(): DefenseTarget[] {
    return this.towers
      .filter((tower) => tower.alive)
      .map((tower) => ({
        id: tower.state.id,
        position: tower.position,
        collisionRadius: DEFENSE_CONFIG.placement.footprintRadius,
        damage: (amount) => tower.damage(amount),
      }));
  }
  add(state: DefenseState) {
    const tower = new MiniTower(this.scene, state);
    tower.applyLevelVisual();
    this.towers.push(tower);
    return tower;
  }
  remove(id: string) {
    const index = this.towers.findIndex(
      (tower) => tower.alive && tower.state.id === id,
    );
    const tower = this.towers[index];
    if (!tower) return null;
    const state = structuredClone(tower.state);
    for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
      const projectile = this.projectiles[projectileIndex];
      if (projectile?.sourceTowerId !== id) continue;
      projectile.root.dispose(false, true);
      this.projectiles.splice(projectileIndex, 1);
    }
    tower.dispose();
    this.towers.splice(index, 1);
    return state;
  }
  update(dt: number, monsters: Monster[], canSeeEnemies = true) {
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      tower.cooldownMs = Math.max(0, tower.cooldownMs - dt * 1000);
      if (!canSeeEnemies || tower.cooldownMs > 0) continue;
      const targets = this.nearestTargets(tower, monsters);
      if (targets.length === 0) continue;
      tower.orientTo(targets[0]!.root.position.x, targets[0]!.root.position.z);
      targets.forEach((target) => this.fire(tower, target));
      tower.cooldownMs = DEFENSE_CONFIG.miniTower.attackCooldownMs;
    }
    this.updateProjectiles(dt);
    for (let index = this.towers.length - 1; index >= 0; index--) {
      const tower = this.towers[index];
      if (tower && !tower.alive) {
        this.onDefenseDestroyed(structuredClone(tower.state));
        tower.dispose();
        this.towers.splice(index, 1);
      }
    }
  }
  dispose() {
    this.towers.forEach((tower) => tower.dispose());
    this.projectiles.forEach((projectile) =>
      projectile.root.dispose(false, true),
    );
  }
  private nearestTargets(tower: MiniTower, monsters: Monster[]) {
    return monsters
      .filter(
        (monster) =>
          monster.isTargetable &&
          Math.hypot(
            monster.root.position.x - tower.root.position.x,
            monster.root.position.z - tower.root.position.z,
          ) <= DEFENSE_CONFIG.miniTower.attackRange,
      )
      .sort(
        (a, b) =>
          Math.hypot(
            a.root.position.x - tower.root.position.x,
            a.root.position.z - tower.root.position.z,
          ) -
          Math.hypot(
            b.root.position.x - tower.root.position.x,
            b.root.position.z - tower.root.position.z,
          ),
      )
      .slice(0, getTowerTargetCount(tower.state.level));
  }
  private fire(tower: MiniTower, target: Monster) {
    const startData = tower.muzzle(),
      start = new Vector3(startData.x, startData.y, startData.z),
      end = new Vector3(target.root.position.x, 1, target.root.position.z),
      root = new TransformNode("mini-tower-projectile", this.scene),
      material = new StandardMaterial(
        "mini-tower-projectile-material",
        this.scene,
      );
    material.diffuseColor = Color3.FromHexString("#FFD65A");
    material.emissiveColor = Color3.FromHexString("#D77B14");
    const orb = MeshBuilder.CreateSphere(
      "mini-tower-orb",
      { diameter: 0.3, segments: 8 },
      this.scene,
    );
    orb.parent = root;
    orb.material = material;
    root.position.copyFrom(start);
    this.projectiles.push({
      root,
      target,
      start,
      elapsed: 0,
      duration: Math.max(
        0.1,
        Vector3.Distance(start, end) / DEFENSE_CONFIG.miniTower.projectileSpeed,
      ),
      damage: tower.attackDamage,
      sourceTowerId: tower.state.id,
    });
  }
  private updateProjectiles(dt: number) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      if (!projectile) continue;
      if (!projectile.target.isTargetable) {
        projectile.root.dispose(false, true);
        this.projectiles.splice(index, 1);
        continue;
      }
      projectile.elapsed += dt;
      const progress = Math.min(1, projectile.elapsed / projectile.duration),
        end = new Vector3(
          projectile.target.root.position.x,
          1,
          projectile.target.root.position.z,
        );
      Vector3.LerpToRef(
        projectile.start,
        end,
        progress,
        projectile.root.position,
      );
      if (progress >= 1) {
        const healthBefore = projectile.target.state.health;
        const killed = projectile.target.damage(projectile.damage);
        const appliedDamage = Math.max(
          0,
          healthBefore - projectile.target.state.health,
        );
        if (appliedDamage > 0)
          this.onTowerDamage(
            appliedDamage,
            projectile.target.root.position.x,
            projectile.target.root.position.z,
          );
        if (killed) this.onMonsterKilled(projectile.target);
        projectile.root.dispose(false, true);
        this.projectiles.splice(index, 1);
      }
    }
  }
}
export const nearestDefenseTarget = (
  position: { x: number; z: number },
  targets: { alive: boolean; position: { x: number; z: number } }[],
  range = DEFENSE_CONFIG.miniTower.attackRange,
) =>
  targets
    .filter(
      (target) =>
        target.alive &&
        Math.hypot(
          target.position.x - position.x,
          target.position.z - position.z,
        ) <= range,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.position.x - position.x, a.position.z - position.z) -
        Math.hypot(b.position.x - position.x, b.position.z - position.z),
    )[0];
export const advanceDefenseCooldown = (cooldownMs: number, deltaMs: number) =>
  Math.max(0, cooldownMs - deltaMs);
export const canDefenseFire = (cooldownMs: number, canSeeEnemies = true) =>
  canSeeEnemies && cooldownMs <= 0;
