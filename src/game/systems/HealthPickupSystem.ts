import { Color3, MeshBuilder, StandardMaterial, TransformNode, type Scene } from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';
import type { PlayerState, Vec2 } from '../core/types';
import { maxHealth } from './StatsSystem';

export const shouldDropHeart = (randomValue: number, chance = GAME_CONFIG.pickups.heart.dropChance) => randomValue < chance;
export const restoreHealth = (currentHealth: number, maximumHealth: number, amount = GAME_CONFIG.pickups.heart.healthRestore) => Math.min(maximumHealth, currentHealth + amount);

type HeartPickup = { root: TransformNode; phase: number };
export class HealthPickupSystem {
  private hearts: HeartPickup[] = [];
  constructor(private scene: Scene, private player: PlayerState, private playerPosition: () => Vec2, private onCollected: (restored: number) => void, private random: () => number = Math.random) {}
  tryDrop(position: Vec2) { if (!shouldDropHeart(this.random())) return false; this.hearts.push({ root: this.createHeart(position), phase: this.random() * Math.PI * 2 }); return true; }
  update(dt: number) { const config=GAME_CONFIG.pickups.heart,position=this.playerPosition();for(let index=this.hearts.length-1;index>=0;index--){const heart=this.hearts[index];if(!heart)continue;heart.phase+=dt*3;heart.root.rotation.y+=dt*config.rotationSpeed;heart.root.position.y=config.hoverHeight+Math.sin(heart.phase)*.1;if(Math.hypot(position.x-heart.root.position.x,position.z-heart.root.position.z)<=config.pickupRadius){const before=this.player.currentHealth,maximum=maxHealth(this.player.stats.vitality,this.player.level);this.player.currentHealth=restoreHealth(before,maximum);const restored=this.player.currentHealth-before;heart.root.dispose(false,true);this.hearts.splice(index,1);this.onCollected(restored);}} }
  private createHeart(position: Vec2) { const root=new TransformNode(`heart-${Date.now()}`,this.scene);root.position.set(position.x,GAME_CONFIG.pickups.heart.hoverHeight,position.z);const material=new StandardMaterial('heart-material',this.scene);material.diffuseColor=Color3.FromHexString('#F13E55');material.emissiveColor=Color3.FromHexString('#7A101F');for(const x of [-.22,.22]){const lobe=MeshBuilder.CreateSphere('heart-lobe',{diameter:.5,segments:12},this.scene);lobe.parent=root;lobe.position.set(x,.14,0);lobe.material=material;}const point=MeshBuilder.CreateCylinder('heart-point',{height:.65,diameterTop:.62,diameterBottom:0,tessellation:12},this.scene);point.parent=root;point.position.y=-.18;point.material=material;return root; }
}
