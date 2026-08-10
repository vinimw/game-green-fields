import {Color3,MeshBuilder,TransformNode,Vector3,type LinesMesh,type Mesh,type Scene} from "@babylonjs/core";
import {GAME_CONFIG} from "../config/gameConfig";
import {distanceXZ,type GroundPosition} from "./RangedHitResolver";

export type AimInvalidReason="OUT_OF_RANGE"|"INVALID_TERRAIN"|"OUTSIDE_MAP"|"UI_CAPTURED";
export type AimValidation={valid:boolean;position:Vector3;distance:number;reason?:AimInvalidReason};

export const validateAimTarget=(player:GroundPosition,aim:GroundPosition,castRange:number,worldSize:number):Omit<AimValidation,"position">=>{
  const distance=distanceXZ(player,aim);
  if(Math.abs(aim.x)>worldSize/2||Math.abs(aim.z)>worldSize/2)return{valid:false,distance,reason:"OUTSIDE_MAP"};
  if(distance>castRange)return{valid:false,distance,reason:"OUT_OF_RANGE"};
  return{valid:true,distance};
};

export class RangedAimSystem{
  private root:TransformNode;private lines:LinesMesh[]=[];private validation?:AimValidation;private lastImpact?:GroundPosition;private lastHit="—";
  constructor(private scene:Scene,private ground:Mesh,private playerPosition:()=>GroundPosition,private castRange:()=>number,private previewRadius:()=>number){
    this.root=new TransformNode("ranged-aim-reticle",scene);
    const circle=MeshBuilder.CreateLines("aim-circle",{points:Array.from({length:33},(_,index)=>{const angle=index/32*Math.PI*2;return new Vector3(Math.cos(angle),.04,Math.sin(angle));})},scene) as LinesMesh;
    circle.parent=this.root;circle.isPickable=false;circle.alpha=GAME_CONFIG.rangedCombat.aim.opacity;this.lines.push(circle);
    for(const [from,to] of [[[-1.35,0],[-.72,0]],[[.72,0],[1.35,0]],[[0,-1.35],[0,-.72]],[[0,.72],[0,1.35]]] as const){const line=MeshBuilder.CreateLines("aim-tick",{points:[new Vector3(from[0],.04,from[1]),new Vector3(to[0],.04,to[1])]},scene) as LinesMesh;line.parent=this.root;line.isPickable=false;line.alpha=GAME_CONFIG.rangedCombat.aim.opacity;this.lines.push(line);}
    const dot=MeshBuilder.CreateDisc("aim-dot",{radius:.09,tessellation:12},scene);dot.parent=this.root;dot.position.y=.045;dot.rotation.x=Math.PI/2;dot.isPickable=false;
    this.root.setEnabled(false);
  }
  updateFromPointer(){
    const pick=this.scene.pick(this.scene.pointerX,this.scene.pointerY,mesh=>mesh===this.ground);
    if(!pick?.hit||!pick.pickedPoint){this.validation=undefined;this.root.setEnabled(false);return undefined;}
    const position=pick.pickedPoint.clone(),result=validateAimTarget(this.playerPosition(),position,this.castRange(),GAME_CONFIG.world.size);
    this.validation={...result,position};this.root.position.set(position.x,.04,position.z);this.root.scaling.setAll(Math.max(.55,this.previewRadius()));this.root.setEnabled(true);
    const color=Color3.FromHexString(result.valid?GAME_CONFIG.rangedCombat.aim.validColor:GAME_CONFIG.rangedCombat.aim.invalidColor);this.lines.forEach(line=>line.color=color);
    return this.validation;
  }
  current(){return this.validation;}
  targetPosition(){return this.validation?.valid?this.validation.position.clone():undefined;}
  setVisible(visible:boolean){this.root.setEnabled(visible&&Boolean(this.validation));}
  recordImpact(position:GroundPosition,hit:string){this.lastImpact={...position};this.lastHit=hit;}
  debug(){return{aim:this.validation,lastImpact:this.lastImpact,lastHit:this.lastHit};}
}
