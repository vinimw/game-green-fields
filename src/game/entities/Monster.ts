import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Scene,
} from "@babylonjs/core";
import type { MonsterState, Vec2 } from "../core/types";
import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG } from "../config/monstersConfig";
import { DEFENSE_CONFIG } from "../config/defenseConfig";
import type { MonsterNavigationSystem } from "../systems/MonsterNavigationSystem";
import type { DefenseTarget } from "../defenses/DefenseManager";
import type { Player } from "./Player";
export type MonsterAIState =
  "IDLE" | "CHASING" | "ATTACKING" | "RETURNING" | "DEAD";
export class Monster {
  root: TransformNode;
  meshes: Mesh[] = [];
  aiState: MonsterAIState;
  readyForRemoval = false;
  private visual: TransformNode;
  private cooldown = 0;
  private deathTime = 0;
  private animationTime = Math.random() * 10;
  private moving = false;
  private wanderTarget?: Vec2;
  private wanderWaitMs = Math.random() * 1000;
  private navigation?: MonsterNavigationSystem;
  private invisible = false;
  private visibilityTimerMs = 3000;
  private smokePuffs: { mesh: Mesh; velocity: Vector3 }[] = [];
  private smokeMaterial?: StandardMaterial;
  constructor(
    private scene: Scene,
    public state: MonsterState,
  ) {
    this.root = new TransformNode(state.id, scene);
    this.visual = new TransformNode(`${state.id}-visual`, scene);
    this.visual.parent = this.root;
    this.root.position.set(state.position.x, 0, state.position.z);
    this.aiState = state.alive ? "IDLE" : "DEAD";
    this.build();
    if (!state.alive) this.root.setEnabled(false);
  }
  private material(name: string, color: string) {
    const result = new StandardMaterial(name, this.scene);
    result.diffuseColor = Color3.FromHexString(color);
    return result;
  }
  private add(mesh: Mesh, y: number, value: StandardMaterial) {
    mesh.parent = this.visual;
    mesh.position.y = y;
    mesh.material = value;
    this.meshes.push(mesh);
  }
  private build() {
    if (this.state.type === "crawler") {
      const flesh = this.material("crawler-flesh", "#454A43"),
        bone = this.material("crawler-bone", "#777568"),
        voidMaterial = this.material("crawler-eyes", "#B8633D"),
        torso = MeshBuilder.CreateCapsule(
          "crawler-torso",
          { height: 1.65, radius: 0.38 },
          this.scene,
        );
      this.add(torso, 0.6, flesh);
      torso.rotation.x = Math.PI / 2;
      torso.scaling.z = 1.25;
      const head = MeshBuilder.CreateSphere(
        "crawler-head",
        { diameter: 0.62, segments: 10 },
        this.scene,
      );
      this.add(head, 0.65, bone);
      head.position.z = 0.75;
      head.scaling.y = 0.72;
      for (const x of [-0.42, 0.42]) {
        const arm = MeshBuilder.CreateCapsule(
          "crawler-long-arm",
          { height: 1.75, radius: 0.1 },
          this.scene,
        );
        arm.parent = this.visual;
        arm.material = flesh;
        arm.position.set(x, 0.45, 0.25);
        arm.rotation.z = x > 0 ? -0.75 : 0.75;
        this.meshes.push(arm);
        const eye = MeshBuilder.CreateSphere(
          "crawler-eye",
          { diameter: 0.08, segments: 6 },
          this.scene,
        );
        eye.parent = this.visual;
        eye.material = voidMaterial;
        eye.position.set(x * 0.18, 0.7, 1.03);
        this.meshes.push(eye);
      }
    } else if (this.state.type === "wailer") {
      const cloth = this.material("wailer-cloth", "#30363B"),
        skin = this.material("wailer-skin", "#777A73"),
        face = this.material("wailer-void", "#17191C"),
        body = MeshBuilder.CreateCapsule(
          "wailer-body",
          { height: 3.8, radius: 0.28 },
          this.scene,
        );
      this.add(body, 1.9, cloth);
      body.scaling.x = 0.72;
      const head = MeshBuilder.CreateSphere(
        "wailer-head",
        { diameter: 0.7, segments: 10 },
        this.scene,
      );
      this.add(head, 4, skin);
      head.scaling.y = 1.45;
      const hollow = MeshBuilder.CreateSphere(
        "wailer-face",
        { diameter: 0.32, segments: 8 },
        this.scene,
      );
      hollow.parent = this.visual;
      hollow.material = face;
      hollow.position.set(0, 4, 0.32);
      hollow.scaling.y = 1.4;
      this.meshes.push(hollow);
      for (const x of [-0.44, 0.44]) {
        const arm = MeshBuilder.CreateCapsule(
          "wailer-arm",
          { height: 3.2, radius: 0.09 },
          this.scene,
        );
        arm.parent = this.visual;
        arm.material = skin;
        arm.position.set(x, 2.1, 0);
        arm.rotation.z = x > 0 ? -0.12 : 0.12;
        this.meshes.push(arm);
      }
    } else if (this.state.type === "bear") {
      const fur = this.material("bear-fur", "#241613"),
        darkFur = this.material("bear-dark-fur", "#0E0A0A"),
        bone = this.material("bear-bone", "#C7B99B"),
        blood = this.material("bear-blood", "#65110D"),
        eyes = this.material("bear-eyes", "#FF2418");
      eyes.emissiveColor = Color3.FromHexString("#FF160B");
      blood.emissiveColor = Color3.FromHexString("#270302");
      const body = MeshBuilder.CreateSphere(
        "bear-body",
        { diameter: 2.8, segments: 12 },
        this.scene,
      );
      this.add(body, 1.5, fur);
      body.scaling.set(0.9, 0.85, 1.3);
      const head = MeshBuilder.CreateSphere(
        "bear-head",
        { diameter: 1.75, segments: 12 },
        this.scene,
      );
      this.add(head, 2.35, darkFur);
      head.position.z = 1.35;
      head.scaling.set(1.08, 0.9, 1.2);
      const snout = MeshBuilder.CreateSphere(
        "bear-snout",
        { diameter: 1.05, segments: 10 },
        this.scene,
      );
      snout.parent = this.visual;
      snout.material = blood;
      snout.position.set(0, 2.18, 2.18);
      snout.scaling.set(1.1, 0.6, 0.85);
      this.meshes.push(snout);
      for (const x of [-0.55, 0.55]) {
        const ear = MeshBuilder.CreateSphere(
          "bear-ear",
          { diameter: 0.55, segments: 8 },
          this.scene,
        );
        ear.parent = this.visual;
        ear.material = fur;
        ear.position.set(x, 3.05, 1.25);
        this.meshes.push(ear);
        const eye = MeshBuilder.CreateSphere(
          "bear-eye",
          { diameter: 0.16, segments: 6 },
          this.scene,
        );
        eye.parent = this.visual;
        eye.material = eyes;
        eye.position.set(x * 0.5, 2.55, 2.12);
        this.meshes.push(eye);
        const horn = MeshBuilder.CreateCylinder(
          "bear-horn",
          {
            height: 1.05,
            diameterTop: 0,
            diameterBottom: 0.28,
            tessellation: 7,
          },
          this.scene,
        );
        horn.parent = this.visual;
        horn.material = bone;
        horn.position.set(x * 1.12, 3.48, 1.18);
        horn.rotation.z = x > 0 ? -0.38 : 0.38;
        this.meshes.push(horn);
        const fang = MeshBuilder.CreateCylinder(
          "bear-fang",
          {
            height: 0.72,
            diameterTop: 0,
            diameterBottom: 0.2,
            tessellation: 7,
          },
          this.scene,
        );
        fang.parent = this.visual;
        fang.material = bone;
        fang.position.set(x * 0.43, 1.85, 2.58);
        fang.rotation.x = Math.PI;
        this.meshes.push(fang);
      }
      for (const [x, z] of [
        [-0.75, -0.65],
        [0.75, -0.65],
        [-0.75, 0.75],
        [0.75, 0.75],
      ] as const) {
        const leg = MeshBuilder.CreateCapsule(
          "bear-leg",
          { height: 1.45, radius: 0.28 },
          this.scene,
        );
        leg.parent = this.visual;
        leg.material = darkFur;
        leg.position.set(x, 0.6, z);
        this.meshes.push(leg);
        if (z > 0) {
          for (let clawIndex = -1; clawIndex <= 1; clawIndex++) {
            const claw = MeshBuilder.CreateCylinder(
              "bear-claw",
              {
                height: 0.65,
                diameterTop: 0,
                diameterBottom: 0.13,
                tessellation: 6,
              },
              this.scene,
            );
            claw.parent = this.visual;
            claw.material = bone;
            claw.position.set(x + clawIndex * 0.14, 0.18, z + 0.55);
            claw.rotation.x = Math.PI / 2;
            this.meshes.push(claw);
          }
        }
      }
      for (let index = 0; index < 5; index++) {
        const spike = MeshBuilder.CreateCylinder(
          "bear-back-spike",
          {
            height: 0.85 + index * 0.09,
            diameterTop: 0,
            diameterBottom: 0.24,
            tessellation: 7,
          },
          this.scene,
        );
        spike.parent = this.visual;
        spike.material = bone;
        spike.position.set(0, 2.8, -0.95 + index * 0.46);
        this.meshes.push(spike);
      }
      this.root.scaling.setAll(1.48);
    } else {
      const spirit = this.material("ghost-spirit", "#A8D9E8"),
        voidMaterial = this.material("ghost-void", "#172C3A");
      spirit.alpha = 0.68;
      spirit.emissiveColor = Color3.FromHexString("#315C70");
      const body = MeshBuilder.CreateCapsule(
        "ghost-body",
        { height: 2.5, radius: 0.48 },
        this.scene,
      );
      this.add(body, 1.55, spirit);
      body.scaling.y = 1.15;
      const head = MeshBuilder.CreateSphere(
        "ghost-head",
        { diameter: 1.05, segments: 12 },
        this.scene,
      );
      this.add(head, 2.95, spirit);
      head.scaling.y = 1.2;
      for (const x of [-0.2, 0.2]) {
        const eye = MeshBuilder.CreateSphere(
          "ghost-eye",
          { diameter: 0.13, segments: 6 },
          this.scene,
        );
        eye.parent = this.visual;
        eye.material = voidMaterial;
        eye.position.set(x, 3.05, 0.48);
        this.meshes.push(eye);
      }
      for (const x of [-0.72, 0.72]) {
        const arm = MeshBuilder.CreateCapsule(
          "ghost-arm",
          { height: 1.8, radius: 0.1 },
          this.scene,
        );
        arm.parent = this.visual;
        arm.material = spirit;
        arm.position.set(x, 1.75, 0);
        arm.rotation.z = x > 0 ? -0.38 : 0.38;
        this.meshes.push(arm);
      }
      const tail = MeshBuilder.CreateCylinder(
        "ghost-tail",
        { height: 1.2, diameterTop: 0.8, diameterBottom: 0, tessellation: 10 },
        this.scene,
      );
      tail.parent = this.visual;
      tail.material = spirit;
      tail.position.y = 0.15;
      this.meshes.push(tail);
    }
  }
  update(
    player: Player,
    dt: number,
    damagePlayer: (damage: number) => void,
    paused: boolean,
    raid?: {
      active: boolean;
      position: Vec2;
      damageBase: (damage: number) => void;
    },
    defenses: DefenseTarget[] = [],
  ) {
    if (paused || this.aiState === "DEAD") return;
    this.moving = false;
    this.cooldown = Math.max(0, this.cooldown - dt * 1000);
    this.wanderWaitMs = Math.max(0, this.wanderWaitMs - dt * 1000);
    const config = MONSTERS_CONFIG[this.state.type];
    if (this.state.type === "bear") {
      this.wanderTarget = undefined;
      const distance = Math.hypot(
        this.root.position.x - player.root.position.x,
        this.root.position.z - player.root.position.z,
      );
      this.aiState = distance <= config.attackRadius ? "ATTACKING" : "CHASING";
      if (this.aiState === "CHASING")
        this.moveToward(
          player.root.position.x,
          player.root.position.z,
          config.movementSpeed,
          dt,
        );
      if (this.aiState === "ATTACKING" && this.cooldown === 0) {
        damagePlayer(config.damage);
        this.cooldown = config.attackCooldownMs;
      }
      this.finishUpdate(dt);
      return;
    }
    if (raid?.active) {
      this.wanderTarget = undefined;
      const distance = Math.hypot(
        this.root.position.x - raid.position.x,
        this.root.position.z - raid.position.z,
      );
      this.aiState = distance <= config.attackRadius ? "ATTACKING" : "CHASING";
      if (this.aiState === "CHASING")
        this.moveToward(
          raid.position.x,
          raid.position.z,
          config.movementSpeed,
          dt,
        );
      if (this.aiState === "ATTACKING" && this.cooldown === 0) {
        raid.damageBase(config.damage);
        this.cooldown = config.attackCooldownMs;
      }
      this.finishUpdate(dt);
      return;
    }
    const defense = defenses
      .filter(
        (candidate) =>
          Math.hypot(
            this.root.position.x - candidate.position.x,
            this.root.position.z - candidate.position.z,
          ) <= DEFENSE_CONFIG.miniTower.attackRange,
      )
      .sort(
        (a, b) =>
          Math.hypot(
            this.root.position.x - a.position.x,
            this.root.position.z - a.position.z,
          ) -
          Math.hypot(
            b.position.x - this.root.position.x,
            b.position.z - this.root.position.z,
          ),
      )[0];
    if (defense) {
      this.wanderTarget = undefined;
      const collisionRadius =
          defense.collisionRadius ?? DEFENSE_CONFIG.placement.footprintRadius,
        dx = this.root.position.x - defense.position.x,
        dz = this.root.position.z - defense.position.z,
        distance = Math.hypot(dx, dz),
        attackDistance = config.attackRadius + collisionRadius;
      this.aiState = distance <= attackDistance ? "ATTACKING" : "CHASING";
      if (this.aiState === "CHASING") {
        const length = distance || 1,
          approachDistance = collisionRadius + 0.7;
        this.moveToward(
          defense.position.x + (dx / length) * approachDistance,
          defense.position.z + (dz / length) * approachDistance,
          config.movementSpeed,
          dt,
        );
      }
      if (this.aiState === "ATTACKING" && this.cooldown === 0) {
        defense.damage(config.damage);
        this.cooldown = config.attackCooldownMs;
      }
      this.finishUpdate(dt);
      return;
    }
    const target = player.root.position,
      spawn = this.state.spawnPosition,
      playerDistance = Vector3.Distance(this.root.position, target),
      spawnDistance = Math.hypot(
        this.root.position.x - spawn.x,
        this.root.position.z - spawn.z,
      );
    if (
      (this.aiState === "IDLE" || this.aiState === "RETURNING") &&
      playerDistance < config.detectionRadius
    ) {
      this.aiState = "CHASING";
      this.wanderTarget = undefined;
    } else if (
      spawnDistance > config.leashRadius &&
      playerDistance >= config.detectionRadius
    )
      this.aiState = "RETURNING";
    else if (
      this.aiState === "CHASING" &&
      playerDistance <= config.attackRadius
    )
      this.aiState = "ATTACKING";
    else if (
      this.aiState === "ATTACKING" &&
      playerDistance > config.attackRadius
    )
      this.aiState = "CHASING";
    else if (
      (this.aiState === "CHASING" || this.aiState === "ATTACKING") &&
      playerDistance > config.detectionRadius * 1.45
    )
      this.aiState = "RETURNING";
    if (this.aiState === "IDLE")
      this.updateWander(spawn, config.movementSpeed, dt);
    if (this.aiState === "CHASING")
      this.moveToward(target.x, target.z, config.movementSpeed, dt);
    if (this.aiState === "RETURNING") {
      this.wanderTarget = undefined;
      this.moveToward(spawn.x, spawn.z, config.movementSpeed, dt);
      if (spawnDistance < 0.15) {
        this.aiState = "IDLE";
        this.scheduleWanderPause();
      }
    }
    if (this.aiState === "ATTACKING" && this.cooldown === 0) {
      damagePlayer(config.damage);
      this.cooldown = config.attackCooldownMs;
    }
    this.finishUpdate(dt);
    return;
  }
  private updateWander(spawn: Vec2, speed: number, dt: number) {
    if (!this.wanderTarget && this.wanderWaitMs === 0)
      this.wanderTarget =
        this.navigation?.findNearbyWalkable(
          spawn,
          GAME_CONFIG.monsterWander.radius,
          GAME_CONFIG.monsterWander.maxTargetAttempts,
        ) ?? undefined;
    if (!this.wanderTarget) return;
    this.moveToward(
      this.wanderTarget.x,
      this.wanderTarget.z,
      speed * GAME_CONFIG.monsterWander.speedMultiplier,
      dt,
    );
    if (
      Math.hypot(
        this.root.position.x - this.wanderTarget.x,
        this.root.position.z - this.wanderTarget.z,
      ) < 0.2
    ) {
      this.wanderTarget = undefined;
      this.scheduleWanderPause();
    }
  }
  private scheduleWanderPause() {
    const config = GAME_CONFIG.monsterWander;
    this.wanderWaitMs =
      config.pauseMinMs +
      Math.random() * (config.pauseMaxMs - config.pauseMinMs);
  }
  private finishUpdate(dt: number) {
    this.updateInvisibility(dt);
    this.state.position = { x: this.root.position.x, z: this.root.position.z };
    this.animateMovement(dt);
  }
  setNavigation(navigation: MonsterNavigationSystem) {
    this.navigation = navigation;
  }
  private moveToward(x: number, z: number, speed: number, dt: number) {
    const waypoint = this.navigation
      ? this.navigation.getNextWaypoint(
          this.state.id,
          { x: this.root.position.x, z: this.root.position.z },
          { x, z },
        )
      : { x, z };
    if (!waypoint) return;
    const dx = waypoint.x - this.root.position.x,
      dz = waypoint.z - this.root.position.z,
      length = Math.hypot(dx, dz) || 1;
    this.root.position.x += (dx / length) * speed * dt;
    this.root.position.z += (dz / length) * speed * dt;
    this.root.rotation.y = Math.atan2(dx, dz);
    this.moving = true;
  }
  private animateMovement(dt: number) {
    this.animationTime += dt;
    const attacking = this.aiState === "ATTACKING";
    if (this.state.type === "crawler") {
      const pace = this.moving ? 8 : 2;
      this.visual.position.y =
        Math.abs(Math.sin(this.animationTime * pace)) *
        (this.moving ? 0.09 : 0.018);
      this.visual.rotation.z =
        Math.sin(this.animationTime * pace) * (this.moving ? 0.09 : 0.025);
      const lunge = attacking ? 1 + Math.sin(this.animationTime * 12) * 0.1 : 1;
      this.visual.scaling.z = lunge;
    } else if (this.state.type === "wailer") {
      const pace = this.moving ? 3.2 : 1.4;
      this.visual.rotation.z =
        Math.sin(this.animationTime * pace) * (this.moving ? 0.075 : 0.025);
      this.visual.position.y = Math.sin(this.animationTime * pace) * 0.035;
      const distortion = attacking
        ? 1 + Math.sin(this.animationTime * 10) * 0.055
        : 1;
      this.visual.scaling.x = distortion;
      this.visual.scaling.z = distortion;
    } else if (this.state.type === "bear") {
      const pace = this.moving ? 5 : 1.5;
      this.visual.position.y =
        Math.abs(Math.sin(this.animationTime * pace)) * 0.09;
      this.visual.rotation.z = Math.sin(this.animationTime * pace) * 0.035;
      this.visual.scaling.z = attacking
        ? 1 + Math.sin(this.animationTime * 4) * 0.12
        : 1;
    } else {
      this.visual.position.y = 0.18 + Math.sin(this.animationTime * 3.5) * 0.18;
      this.visual.rotation.z = Math.sin(this.animationTime * 2.2) * 0.06;
    }
  }
  private updateInvisibility(dt: number) {
    if (this.state.type !== "ghost" || !this.state.alive) return;
    const config = MONSTERS_CONFIG.ghost.invisibility;
    this.visibilityTimerMs -= dt * 1000;
    if (this.invisible) {
      if (this.visibilityTimerMs <= 0) {
        this.invisible = false;
        this.visibilityTimerMs = config.visibleDurationMs;
        this.root.setEnabled(true);
      }
      return;
    }
    if (this.visibilityTimerMs <= 0) {
      this.invisible = true;
      this.visibilityTimerMs = config.invisibleDurationMs;
      this.root.setEnabled(false);
      return;
    }
    const warningDuration = config.warningBlinks * 2 * config.blinkIntervalMs;
    if (this.visibilityTimerMs <= warningDuration) {
      const phase = Math.floor(this.visibilityTimerMs / config.blinkIntervalMs);
      this.root.setEnabled(phase % 2 === 0);
    } else this.root.setEnabled(true);
  }
  get isTargetable() {
    return this.state.alive && !this.invisible;
  }
  returnHome() {
    if (this.state.alive) {
      this.aiState = "RETURNING";
      this.wanderTarget = undefined;
    }
  }
  damage(amount: number) {
    if (!this.isTargetable) return false;
    this.state.health = Math.max(0, this.state.health - amount);
    this.meshes.forEach((mesh) => {
      const previous = mesh.scaling.clone();
      mesh.scaling = previous.scale(0.85);
      setTimeout(() => (mesh.scaling = previous), 100);
    });
    if (this.state.health === 0) {
      this.state.alive = false;
      this.aiState = "DEAD";
      this.deathTime = GAME_CONFIG.effects.monsterDeathSmoke.durationSeconds;
      this.spawnDeathSmoke();
      return true;
    }
    return false;
  }
  animateDeath(dt: number) {
    if (this.deathTime <= 0) return;
    const config = GAME_CONFIG.effects.monsterDeathSmoke;
    this.deathTime -= dt;
    const progress = 1 - Math.max(0, this.deathTime) / config.durationSeconds;
    for (const puff of this.smokePuffs) {
      puff.mesh.position.addInPlace(puff.velocity.scale(dt));
      puff.mesh.scaling.setAll(1 + progress * 1.8);
    }
    if (this.smokeMaterial)
      this.smokeMaterial.alpha = Math.max(0, 0.58 * (1 - progress));
    this.root.scaling.scaleInPlace(Math.max(0, 1 - dt * 2.4));
    this.root.rotation.y += dt * 8;
    if (this.deathTime <= 0) {
      this.root.setEnabled(false);
      this.readyForRemoval = true;
    }
  }
  private spawnDeathSmoke() {
    const config = GAME_CONFIG.effects.monsterDeathSmoke;
    this.smokeMaterial = this.material(
      `${this.state.id}-death-smoke-material`,
      "#667078",
    );
    this.smokeMaterial.alpha = 0.58;
    this.smokeMaterial.emissiveColor = Color3.FromHexString("#20282C");
    for (let index = 0; index < config.puffCount; index++) {
      const angle = Math.random() * Math.PI * 2,
        spread = Math.random() * config.spread,
        puff = MeshBuilder.CreateSphere(
          `${this.state.id}-death-smoke-${index}`,
          { diameter: 0.28 + Math.random() * 0.38, segments: 7 },
          this.scene,
        );
      puff.position.set(
        this.root.position.x + Math.cos(angle) * spread,
        0.35 + Math.random() * 1.8,
        this.root.position.z + Math.sin(angle) * spread,
      );
      puff.material = this.smokeMaterial;
      this.smokePuffs.push({
        mesh: puff,
        velocity: new Vector3(
          Math.cos(angle) * 0.22,
          config.riseSpeed * (0.7 + Math.random() * 0.5),
          Math.sin(angle) * 0.22,
        ),
      });
    }
  }
  dispose() {
    this.navigation?.clear(this.state.id);
    this.root.dispose(false, true);
    this.smokePuffs.forEach((puff) => puff.mesh.dispose());
    this.smokeMaterial?.dispose();
  }
}
