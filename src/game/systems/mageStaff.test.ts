import {describe,expect,it} from "vitest";
import {getArcherWeapon} from "../config/archerWeaponsConfig";
import {getStaff,MAGE_STAFFS} from "../config/mageConfig";
import {createPlayerState} from "../core/GameState";
import {purchaseMageStaff} from "./MageStaffSystem";
import {powerDamage} from "./StatsSystem";

describe("Mage Staff upgrades",()=>{
  it("follows the Archer weapon level and price progression",()=>{
    expect(MAGE_STAFFS).toHaveLength(12);
    expect(MAGE_STAFFS.map(staff=>staff.price)).toEqual(
      MAGE_STAFFS.map(staff=>getArcherWeapon(staff.level)?.price),
    );
  });
  it("buys the next Staff, equips it and spends its configured price",()=>{const player=createPlayerState("magic"),next=getStaff(2);player.coins=next.price;expect(purchaseMageStaff(player)).toMatchObject({success:true});expect([player.staffLevel,player.equipment.weapon,player.coins]).toEqual([2,next.id,0]);});
  it("increases AoE without changing magic damage",()=>{const player=createPlayerState("magic");player.staffLevel=2;player.coins=getStaff(3).price;const before=powerDamage("magic",player.stats);purchaseMageStaff(player);expect(getStaff(player.staffLevel).aoeRadius).toBe(1.5);expect(powerDamage("magic",player.stats)).toBe(before);});
  it("does not exceed Staff level twelve",()=>{const player=createPlayerState("magic");player.staffLevel=MAGE_STAFFS.length;expect(purchaseMageStaff(player).success).toBe(false);});
});
