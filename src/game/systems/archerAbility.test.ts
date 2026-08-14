import {describe,expect,it} from "vitest";
import {ARCHER_ABILITIES} from "../config/archerAbilitiesConfig";
import {MONSTERS_CONFIG} from "../config/monstersConfig";
import {createPlayerState} from "../core/GameState";
import {learnArcherAbility,learnArrowRain,selectArcherAbility} from "./ArcherAbilitySystem";
import {selectRicochetTargets} from "./CombatSystem";
import {resolveRangedHits} from "./RangedHitResolver";

describe("Arrow Rain ability",()=>{
  it("uses normal Archer range with 2.10x damage and a large area",()=>expect(ARCHER_ABILITIES["arrow-rain"]).toMatchObject({damageMultiplier:2.1,areaRadius:4.5,arrowCount:11}));
  it("has configurable thirty percent book drops on every monster",()=>{for(const monster of Object.values(MONSTERS_CONFIG)){expect(monster.skillBookDrops.arrowRain).toBe(.3);expect(monster.skillBookDrops.ricochetArrow).toBe(.3);}});
  it("learns the book and selects Arrow Rain",()=>{const player=createPlayerState("archer");player.inventory.push(ARCHER_ABILITIES["arrow-rain"].bookId);expect(learnArrowRain(player)).toBe(true);expect(selectArcherAbility(player,"arrow-rain")).toBe(true);expect(player).toMatchObject({selectedArcherAbility:"arrow-rain",learnedArcherAbilities:["single-arrow","arrow-rain"]});});
  it("hits multiple monsters inside its configured area",()=>{const targets=[{target:"a",position:{x:0,z:0}},{target:"b",position:{x:4,z:0}},{target:"outside",position:{x:5,z:0}}];expect(resolveRangedHits({x:0,z:0},targets,1,ARCHER_ABILITIES["arrow-rain"].areaRadius)).toEqual(["a","b"]);});
  it("configures Ricochet Arrow with 3.5x damage, three fast bounces and maximum range",()=>expect(ARCHER_ABILITIES["ricochet-arrow"]).toMatchObject({damageMultiplier:3.5,maxBounces:3,maxRicochetRange:6,bounceDelayMs:80}));
  it("learns Ricochet Arrow from its book",()=>{const player=createPlayerState("archer");player.inventory.push(ARCHER_ABILITIES["ricochet-arrow"].bookId);expect(learnArcherAbility(player,"ricochet-arrow")).toBe(true);expect(selectArcherAbility(player,"ricochet-arrow")).toBe(true);expect(player.selectedArcherAbility).toBe("ricochet-arrow");});
  it("ricochets to only the three nearest enemies inside maximum range",()=>{const candidates=[{target:"primary",position:{x:0,z:0}},{target:"one",position:{x:1,z:0}},{target:"two",position:{x:2,z:0}},{target:"three",position:{x:3,z:0}},{target:"four",position:{x:4,z:0}},{target:"outside",position:{x:7,z:0}}];expect(selectRicochetTargets("primary",candidates,{x:0,z:0},6,3)).toEqual(["primary","one","two","three"]);});
});
