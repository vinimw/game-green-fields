import {NullEngine,Scene} from "@babylonjs/core";
import {describe,expect,it} from "vitest";
import {GAME_CONFIG} from "../config/gameConfig";
import {MAGE_CONFIG} from "../config/mageConfig";
import {createPlayerState} from "../core/GameState";
import {SkillBookPickupSystem} from "./SkillBookPickupSystem";
import {learnRainAbility,selectMageAbility} from "./MageAbilitySystem";

describe("Rain Skill Book",()=>{
  it("uses a one percent drop chance for every monster kill",()=>expect(GAME_CONFIG.pickups.skillBook.dropChance).toBe(.01));
  it("drops, collects and stores the book in the backpack",()=>{const engine=new NullEngine(),scene=new Scene(engine),player=createPlayerState("magic");let collected=0;const drops=new SkillBookPickupSystem(scene,player,()=>({x:2,z:3}),()=>collected++,()=>0);expect(drops.tryDrop({x:2,z:3})).toBe(true);drops.update(.01);expect(player.inventory).toContain(MAGE_CONFIG.abilities.rain.bookId);expect(collected).toBe(1);scene.dispose();engine.dispose();});
  it("gives Rain fifteen percent more attack power",()=>expect(MAGE_CONFIG.abilities.rain.damageMultiplier).toBe(1.15));
  it("consumes the book when learned and allows Rain to be selected",()=>{const player=createPlayerState("magic");player.inventory.push(MAGE_CONFIG.abilities.rain.bookId);expect(learnRainAbility(player)).toBe(true);expect(player.inventory).not.toContain(MAGE_CONFIG.abilities.rain.bookId);expect(selectMageAbility(player,"rain")).toBe(true);expect(player.selectedMageAbility).toBe("rain");});
});
