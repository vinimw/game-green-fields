import {getNextStaff,getStaff,MAGE_STAFFS} from "../config/mageConfig";
import type {PlayerState} from "../core/types";
export const currentMageStaff=(player:PlayerState)=>player.powerType==="magic"?getStaff(player.staffLevel):undefined;
export const nextMageStaff=(player:PlayerState)=>player.powerType==="magic"?getNextStaff(player.staffLevel):undefined;
export const purchaseMageStaff=(player:PlayerState)=>{if(player.powerType!=="magic")return{success:false,message:"Only Mage can equip Staffs"};const next=getNextStaff(player.staffLevel);if(!next)return{success:false,message:"Staff is already at maximum level"};if(player.coins<next.price)return{success:false,message:"Not enough Coins"};player.coins-=next.price;player.staffLevel=Math.min(MAGE_STAFFS.length,next.level);player.equipment.weapon=next.id;return{success:true,message:`Equipped ${next.name}`};};
