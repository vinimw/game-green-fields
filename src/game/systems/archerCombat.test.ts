import {describe,expect,it} from "vitest";
import {createPlayerState} from "../core/GameState";
import {attackRange} from "./StatsSystem";
import {isTargetInRange} from "./CombatSystem";
describe("archer combat",()=>{
  it("starts with a bow equipped",()=>expect(createPlayerState("archer").equipment.weapon).toBe("training-bow"));
  it("keeps its range while Mage has specialized long range",()=>expect(attackRange("magic")).toBeGreaterThan(attackRange("archer")));
  it("only accepts targets inside its radius",()=>{expect(isTargetInRange(attackRange("archer"),attackRange("archer"))).toBe(true);expect(isTargetInRange(attackRange("archer")+.1,attackRange("archer"))).toBe(false);});
});
