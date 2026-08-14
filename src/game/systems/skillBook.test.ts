import {NullEngine,Scene} from "@babylonjs/core";
import {describe,expect,it} from "vitest";
import {MAGE_CONFIG} from "../config/mageConfig";
import {MONSTERS_CONFIG} from "../config/monstersConfig";
import {createPlayerState} from "../core/GameState";
import {learnMageAbility,learnRainAbility,selectMageAbility} from "./MageAbilitySystem";
import {SkillBookPickupSystem} from "./SkillBookPickupSystem";

describe("Mage Skill Books",()=>{
  it("keeps drop rates configurable for every monster type",()=>{for(const monster of Object.values(MONSTERS_CONFIG)){expect(monster.skillBookDrops.rain).toBe(.01);expect(monster.skillBookDrops.frostMeteor).toBe(.3);}});
  it("drops and collects the Rain book",()=>{const engine=new NullEngine(),scene=new Scene(engine),player=createPlayerState("magic"),rolls=[.005,.4,.9],drops=new SkillBookPickupSystem(scene,player,()=>({x:2,z:3}),()=>{},()=>rolls.shift()??.9);expect(drops.tryDrop("crawler",{x:2,z:3})).toBe(true);drops.update(.01);expect(player.inventory).toContain(MAGE_CONFIG.abilities.rain.bookId);scene.dispose();engine.dispose();});
  it("drops and collects the Frost Meteor book at thirty percent",()=>{const engine=new NullEngine(),scene=new Scene(engine),player=createPlayerState("magic"),rolls=[.9,.2,.4],drops=new SkillBookPickupSystem(scene,player,()=>({x:2,z:3}),()=>{},()=>rolls.shift()??.9);expect(drops.tryDrop("crawler",{x:2,z:3})).toBe(true);drops.update(.01);expect(player.inventory).toContain(MAGE_CONFIG.abilities["frost-meteor"].bookId);scene.dispose();engine.dispose();});
  it("defines three sequential meteors, 2.5x damage and larger impact",()=>expect(MAGE_CONFIG.abilities["frost-meteor"]).toMatchObject({damageMultiplier:2.5,meteorCount:3,impactRadiusMultiplier:1.6}));
  it("learns and selects both unlockable abilities",()=>{const player=createPlayerState("magic");player.inventory.push(MAGE_CONFIG.abilities.rain.bookId,MAGE_CONFIG.abilities["frost-meteor"].bookId);expect(learnRainAbility(player)).toBe(true);expect(learnMageAbility(player,"frost-meteor")).toBe(true);expect(selectMageAbility(player,"frost-meteor")).toBe(true);expect(player.selectedMageAbility).toBe("frost-meteor");});
});
