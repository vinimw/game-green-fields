import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  StandardMaterial,
  TransformNode,
  type AbstractMesh,
  type Scene,
} from "@babylonjs/core";
import {
  DEFENSE_CONFIG,
  getTowerDamage,
  getTowerMaxHealth,
} from "../config/defenseConfig";
import type { DefenseState, Vec2 } from "../core/types";
export class MiniTower {
  root: TransformNode;
  head: TransformNode;
  cooldownMs = 0;
  private healthFill: Mesh;
  private levelParts: { mesh: Mesh; level: number }[] = [];
  private structuralMaterials: StandardMaterial[] = [];
  constructor(
    private scene: Scene,
    public state: DefenseState,
  ) {
    state.currentHealth = Math.max(
      0,
      Math.min(getTowerMaxHealth(state.level), state.currentHealth),
    );
    this.root = new TransformNode(state.id, scene);
    this.root.position.set(
      state.position.x,
      state.position.y,
      state.position.z,
    );
    this.root.rotation.y = state.rotation;
    const wood = this.material(`${state.id}-charred-wood`, "#3C3028"),
      rust = this.material(`${state.id}-rust`, "#754232"),
      iron = this.material(`${state.id}-iron`, "#353B3D"),
      light = this.material(`${state.id}-lantern`, "#FFB04A");
    this.structuralMaterials = [wood, rust, iron];
    light.emissiveColor = Color3.FromHexString("#D66C24");
    const base = MeshBuilder.CreateCylinder(
      `${state.id}-scrap-base`,
      { height: 0.42, diameter: 2.2, tessellation: 9 },
      scene,
    );
    base.parent = this.root;
    base.position.y = 0.21;
    base.material = iron;
    const supports = MeshBuilder.CreateCylinder(
      `${state.id}-wood-support`,
      {
        height: 2.35,
        diameterTop: 1.05,
        diameterBottom: 1.55,
        tessellation: 8,
      },
      scene,
    );
    supports.parent = this.root;
    supports.position.y = 1.5;
    supports.material = wood;
    for (const angle of [0, Math.PI / 2]) {
      const band = MeshBuilder.CreateTorus(
        `${state.id}-rust-band`,
        { diameter: 1.2, thickness: 0.1, tessellation: 12 },
        scene,
      );
      band.parent = this.root;
      band.position.y = 1.7 + angle / 4;
      band.rotation.x = Math.PI / 2;
      band.material = rust;
    }
    this.head = new TransformNode(`${state.id}-head`, scene);
    this.head.parent = this.root;
    this.head.position.y = 2.75;
    const mechanism = MeshBuilder.CreateBox(
      `${state.id}-mechanism`,
      { width: 1.35, height: 0.58, depth: 1 },
      scene,
    );
    mechanism.parent = this.head;
    mechanism.material = rust;
    const cannon = MeshBuilder.CreateCylinder(
      `${state.id}-scrap-cannon`,
      { height: 1.5, diameter: 0.3, tessellation: 8 },
      scene,
    );
    cannon.parent = this.head;
    cannon.position.z = 0.85;
    cannon.rotation.x = Math.PI / 2;
    cannon.material = iron;
    for (let level = 2; level <= DEFENSE_CONFIG.miniTower.maxLevel; level++) {
      const angle = ((level - 2) / 8) * Math.PI * 2;
      for (const side of [0, Math.PI]) {
        const plateAngle = angle + side;
        const armor = MeshBuilder.CreateBox(
          `${state.id}-level-${level}-armor-${side === 0 ? "a" : "b"}`,
          {
            width: 0.72 + level * 0.035,
            height: 0.48 + level * 0.035,
            depth: 0.18 + level * 0.008,
          },
          scene,
        );
        armor.parent = this.root;
        armor.position.set(
          Math.sin(plateAngle) * 0.76,
          1 + ((level - 2) % 3) * 0.67,
          Math.cos(plateAngle) * 0.76,
        );
        armor.rotation.y = plateAngle;
        armor.material = level >= 5 ? iron : rust;
        this.levelParts.push({ mesh: armor, level });
      }
      const spike = MeshBuilder.CreateCylinder(
        `${state.id}-level-${level}-spike`,
        {
          height: 0.48 + level * 0.025,
          diameterTop: 0,
          diameterBottom: 0.22 + level * 0.01,
          tessellation: 7,
        },
        scene,
      );
      spike.parent = this.head;
      spike.position.set(Math.sin(angle) * 0.72, 0.48, Math.cos(angle) * 0.72);
      spike.material = iron;
      this.levelParts.push({ mesh: spike, level });
      if (level >= 3 && level % 2 === 1) {
        const barrel = MeshBuilder.CreateCylinder(
          `${state.id}-level-${level}-cannon`,
          {
            height: 1.55 + level * 0.04,
            diameter: 0.24 + level * 0.012,
            tessellation: 8,
          },
          scene,
        );
        barrel.parent = this.head;
        barrel.position.set(level % 4 === 1 ? 0.48 : -0.48, 0.03, 0.9);
        barrel.rotation.x = Math.PI / 2;
        barrel.material = iron;
        this.levelParts.push({ mesh: barrel, level });
      }
    }
    for (const level of [5, 10]) {
      const crown = MeshBuilder.CreateTorus(
        `${state.id}-level-${level}-reinforcement`,
        {
          diameter: level === 10 ? 1.75 : 1.5,
          thickness: level === 10 ? 0.2 : 0.14,
          tessellation: 12,
        },
        scene,
      );
      crown.parent = this.head;
      crown.position.y = level === 10 ? 0.28 : -0.25;
      crown.rotation.x = Math.PI / 2;
      crown.material = level === 10 ? light : iron;
      this.levelParts.push({ mesh: crown, level });
    }
    const lantern = MeshBuilder.CreateSphere(
      `${state.id}-lantern`,
      { diameter: 0.3, segments: 8 },
      scene,
    );
    lantern.parent = this.root;
    lantern.position.set(0.65, 2.3, 0.1);
    lantern.material = light;
    const lanternLight = new PointLight(
      `${state.id}-lantern-light`,
      lantern.position.clone(),
      scene,
    );
    lanternLight.parent = this.root;
    lanternLight.diffuse = Color3.FromHexString("#FFB04A");
    lanternLight.intensity = 0.35;
    lanternLight.range = 4;
    const healthBar = new TransformNode(`${state.id}-health-bar`, scene);
    healthBar.parent = this.root;
    healthBar.position.set(0, 3.65, 0);
    healthBar.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    const healthBack = MeshBuilder.CreatePlane(
      `${state.id}-health-back`,
      { width: 1.9, height: 0.24 },
      scene,
    );
    healthBack.parent = healthBar;
    healthBack.isPickable = false;
    const backMaterial = this.material(
      `${state.id}-health-back-material`,
      "#171313",
    );
    backMaterial.emissiveColor = Color3.FromHexString("#171313");
    backMaterial.backFaceCulling = false;
    healthBack.material = backMaterial;
    this.healthFill = MeshBuilder.CreatePlane(
      `${state.id}-health-fill`,
      { width: 1.76, height: 0.14 },
      scene,
    );
    this.healthFill.parent = healthBar;
    this.healthFill.position.z = -0.015;
    this.healthFill.isPickable = false;
    const fillMaterial = this.material(
      `${state.id}-health-fill-material`,
      "#63A85F",
    );
    fillMaterial.backFaceCulling = false;
    this.healthFill.material = fillMaterial;
    this.updateHealthBar();
    if (DEFENSE_CONFIG.debug.showDefenseRanges) {
      const range = MeshBuilder.CreateTorus(
        `${state.id}-range`,
        {
          diameter: DEFENSE_CONFIG.miniTower.attackRange * 2,
          thickness: 0.05,
          tessellation: 64,
        },
        scene,
      );
      range.parent = this.root;
      range.position.y = 0.04;
      range.material = this.material(`${state.id}-range-material`, "#7D8C91");
    }
    this.applyLevelVisual();
  }
  get alive() {
    return this.state.currentHealth > 0;
  }
  get position(): Vec2 {
    return { x: this.root.position.x, z: this.root.position.z };
  }
  get attackDamage() {
    return getTowerDamage(this.state.level);
  }
  get maxHealth() {
    return getTowerMaxHealth(this.state.level);
  }
  containsMesh(mesh: AbstractMesh) {
    let node: AbstractMesh | TransformNode | null = mesh;
    while (node) {
      if (node.parent === this.root) return true;
      node = node.parent as AbstractMesh | TransformNode | null;
    }
    return false;
  }
  applyLevelVisual() {
    const level = Math.max(
      1,
      Math.min(DEFENSE_CONFIG.miniTower.maxLevel, this.state.level),
    );
    const towerScale = level >= 10 ? 1.25 : level >= 5 ? 1.14 : 1;
    this.root.scaling.setAll(towerScale);
    this.head.scaling.setAll(1 + Math.min(0.32, (level - 1) * 0.036));
    this.levelParts.forEach((part) =>
      part.mesh.setEnabled(level >= part.level),
    );
    const golden = level >= 10;
    const colors = golden
      ? ["#A87316", "#D5A62E", "#F1C84B"]
      : ["#3C3028", "#754232", "#353B3D"];
    this.structuralMaterials.forEach((material, index) => {
      material.diffuseColor = Color3.FromHexString(colors[index] ?? colors[0]!);
      material.specularColor = golden
        ? Color3.FromHexString("#FFE69A")
        : Color3.Black();
      material.emissiveColor = golden
        ? Color3.FromHexString("#4A2A00")
        : Color3.Black();
    });
    this.updateHealthBar();
  }
  damage(amount: number) {
    if (!this.alive) return 0;
    const before = this.state.currentHealth;
    this.state.currentHealth = Math.max(0, before - amount);
    this.updateHealthBar();
    return before - this.state.currentHealth;
  }
  orientTo(x: number, z: number) {
    this.head.rotation.y =
      Math.atan2(x - this.root.position.x, z - this.root.position.z) -
      this.root.rotation.y;
  }
  muzzle() {
    return {
      x: this.root.position.x,
      y: 3 * this.root.scaling.y,
      z: this.root.position.z,
    };
  }
  dispose() {
    this.root.dispose(false, true);
  }
  private updateHealthBar() {
    const ratio =
      this.state.currentHealth / getTowerMaxHealth(this.state.level);
    this.healthFill.scaling.x = Math.max(0.001, ratio);
    this.healthFill.position.x = -(1 - ratio) * 0.88;
    const material = this.healthFill.material as StandardMaterial;
    material.diffuseColor =
      ratio > 0.5
        ? Color3.FromHexString("#63A85F")
        : ratio > 0.25
          ? Color3.FromHexString("#D39A42")
          : Color3.FromHexString("#C64F47");
    material.emissiveColor = material.diffuseColor.scale(0.65);
  }
  private material(name: string, color: string) {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = Color3.Black();
    return material;
  }
}
