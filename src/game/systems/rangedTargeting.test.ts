import {describe,expect,it} from "vitest";
import {validateAimTarget} from "./RangedAimSystem";
import {resolveRangedHits} from "./RangedHitResolver";

describe("free ranged targeting",()=>{
  const player={x:0,z:0};
  it("accepts an aim position inside cast range",()=>expect(validateAimTarget(player,{x:10,z:0},15,60)).toMatchObject({valid:true,distance:10}));
  it("rejects an aim position outside cast range without clamping it",()=>expect(validateAimTarget(player,{x:16,z:0},15,60)).toMatchObject({valid:false,distance:16,reason:"OUT_OF_RANGE"}));
  it("rejects positions outside the playable map",()=>expect(validateAimTarget(player,{x:31,z:0},40,60).reason).toBe("OUTSIDE_MAP"));
  const monsters=[
    {target:"far",position:{x:1.8,z:0}},
    {target:"nearest",position:{x:.2,z:0}},
    {target:"other",position:{x:.7,z:0}},
  ];
  it("Archer misses when no monster remains in hit radius at impact",()=>expect(resolveRangedHits({x:5,z:5},monsters,1)).toEqual([]));
  it("Archer hits only the nearest monster when several overlap",()=>expect(resolveRangedHits({x:0,z:0},monsters,1)).toEqual(["nearest"]));
  it("Mage levels one and two use the same single-target rule",()=>expect(resolveRangedHits({x:0,z:0},monsters,1,0)).toEqual(["nearest"]));
  it("Mage level three and above hits every monster around impact position",()=>expect(resolveRangedHits({x:1,z:0},monsters,1,1)).toEqual(["far","nearest","other"]));
  it("Mage AoE does not require a monster at its center",()=>expect(resolveRangedHits({x:0,z:0},[{target:"left",position:{x:-1,z:0}},{target:"right",position:{x:1,z:0}}],1,1.1)).toEqual(["left","right"]));
  it("keeps monsters outside AoE untouched",()=>expect(resolveRangedHits({x:0,z:0},monsters,1,1).includes("far")).toBe(false));
});
