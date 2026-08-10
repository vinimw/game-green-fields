import {Color3,MeshBuilder,StandardMaterial,TransformNode,type Scene} from "@babylonjs/core";
import {GAME_CONFIG} from "../config/gameConfig";
import {MAGE_CONFIG} from "../config/mageConfig";
import type {PlayerState,Vec2} from "../core/types";

type BookPickup={root:TransformNode;remainingMs:number;phase:number};
export class SkillBookPickupSystem{
  private pickups:BookPickup[]=[];
  constructor(private scene:Scene,private player:PlayerState,private playerPosition:()=>Vec2,private onCollected:()=>void,private random:()=>number=Math.random){}
  tryDrop(position:Vec2){if(this.random()>=GAME_CONFIG.pickups.skillBook.dropChance)return false;this.pickups.push({root:this.createBook(position),remainingMs:GAME_CONFIG.pickups.skillBook.lifetimeMs,phase:this.random()*Math.PI*2});return true;}
  positions(){return this.pickups.map(value=>({x:value.root.position.x,z:value.root.position.z}));}
  update(dt:number){const player=this.playerPosition();for(let index=this.pickups.length-1;index>=0;index--){const pickup=this.pickups[index];if(!pickup)continue;pickup.remainingMs-=dt*1000;pickup.phase+=dt*3;pickup.root.rotation.y+=dt*1.6;pickup.root.position.y=.55+Math.sin(pickup.phase)*.08;if(pickup.remainingMs<=0){pickup.root.dispose(false,true);this.pickups.splice(index,1);continue;}if(Math.hypot(player.x-pickup.root.position.x,player.z-pickup.root.position.z)>GAME_CONFIG.pickups.skillBook.pickupRadius)continue;if(!this.player.inventory.includes(MAGE_CONFIG.abilities.rain.bookId)&&!this.player.learnedMageAbilities.includes("rain"))this.player.inventory.push(MAGE_CONFIG.abilities.rain.bookId);pickup.root.dispose(false,true);this.pickups.splice(index,1);this.onCollected();}}
  private createBook(position:Vec2){const root=new TransformNode(`rain-skill-book-${Date.now()}`,this.scene);root.position.set(position.x,.55,position.z);const cover=new StandardMaterial("rain-book-cover",this.scene),pages=new StandardMaterial("rain-book-pages",this.scene),rune=new StandardMaterial("rain-book-rune",this.scene);cover.diffuseColor=Color3.FromHexString("#31528F");pages.diffuseColor=Color3.FromHexString("#EADDB8");rune.diffuseColor=Color3.FromHexString("#7FE8FF");rune.emissiveColor=Color3.FromHexString("#246D91");const book=MeshBuilder.CreateBox("rain-skill-book",{width:.72,height:.16,depth:.9},this.scene);book.parent=root;book.material=cover;const pageBlock=MeshBuilder.CreateBox("rain-book-page-block",{width:.62,height:.12,depth:.78},this.scene);pageBlock.parent=root;pageBlock.position.x=.05;pageBlock.material=pages;const symbol=MeshBuilder.CreateTorus("rain-book-symbol",{diameter:.3,thickness:.055,tessellation:12},this.scene);symbol.parent=root;symbol.position.y=.11;symbol.rotation.x=Math.PI/2;symbol.material=rune;return root;}
}
