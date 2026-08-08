import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  type Scene,
} from "@babylonjs/core";
import { DEFENSE_CONFIG } from "../config/defenseConfig";
import type { DefenseState, Vec2 } from "../core/types";
import type {
  DefensePlacementValidator,
  PlacementValidation,
} from "./DefensePlacementValidator";
export class DefensePlacementSystem {
  active = false;
  private ghost?: TransformNode;
  private ghostMaterials: StandardMaterial[] = [];
  private attackRange?: Mesh;
  private buildArea?: Mesh;
  candidate: Vec2 = { x: 0, z: 0 };
  validation?: PlacementValidation;
  constructor(
    private scene: Scene,
    private ground: Mesh,
    private validator: DefensePlacementValidator,
    private defenses: () => DefenseState[],
    private onStatus: (validation: PlacementValidation) => void,
  ) {}
  start() {
    if (this.active) return;
    this.active = true;
    this.ghost = this.createGhost();
    this.attackRange = this.circle(
      "placement-attack-range",
      DEFENSE_CONFIG.miniTower.attackRange,
      "#63D6FF",
    );
    this.buildArea = this.circle(
      "core-build-area",
      DEFENSE_CONFIG.placement.maxDistanceFromCore,
      "#F2D36D",
    );
    this.buildArea.position.y = 0.03;
    this.update();
  }
  update() {
    if (!this.active) return;
    const pick = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => mesh === this.ground,
    );
    if (pick?.hit && pick.pickedPoint)
      this.candidate = { x: pick.pickedPoint.x, z: pick.pickedPoint.z };
    this.validation = this.validator.validate(this.candidate, this.defenses());
    const color = this.validation.valid
      ? Color3.FromHexString("#54E879")
      : Color3.FromHexString("#F05A55");
    this.ghostMaterials.forEach((material) => (material.diffuseColor = color));
    this.ghost?.position.set(this.candidate.x, 0, this.candidate.z);
    this.attackRange?.position.set(this.candidate.x, 0.05, this.candidate.z);
    this.onStatus(this.validation);
  }
  cancel() {
    this.active = false;
    this.ghost?.dispose(false, true);
    this.attackRange?.dispose(false, true);
    this.buildArea?.dispose(false, true);
    this.ghost = undefined;
    this.attackRange = undefined;
    this.buildArea = undefined;
    this.ghostMaterials = [];
    this.validation = undefined;
  }
  private createGhost() {
    const root = new TransformNode("mini-tower-placement-ghost", this.scene),
      material = this.material("placement-ghost", "#54E879", 0.5);
    this.ghostMaterials.push(material);
    const base = MeshBuilder.CreateCylinder(
      "ghost-base",
      { height: 0.45, diameter: 2.2, tessellation: 12 },
      this.scene,
    );
    base.parent = root;
    base.position.y = 0.23;
    base.material = material;
    const body = MeshBuilder.CreateCylinder(
      "ghost-body",
      {
        height: 2.4,
        diameterTop: 1.15,
        diameterBottom: 1.65,
        tessellation: 12,
      },
      this.scene,
    );
    body.parent = root;
    body.position.y = 1.55;
    body.material = material;
    const top = MeshBuilder.CreateCylinder(
      "ghost-top",
      { height: 0.55, diameter: 1.55, tessellation: 12 },
      this.scene,
    );
    top.parent = root;
    top.position.y = 2.85;
    top.material = material;
    return root;
  }
  private circle(name: string, radius: number, color: string) {
    const mesh = MeshBuilder.CreateTorus(
      name,
      { diameter: radius * 2, thickness: 0.08, tessellation: 96 },
      this.scene,
    );
    mesh.material = this.material(`${name}-material`, color, 0.8);
    return mesh;
  }
  private material(name: string, color: string, alpha: number) {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.emissiveColor = Color3.FromHexString(color).scale(0.25);
    material.alpha = alpha;
    return material;
  }
}
