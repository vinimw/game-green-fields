import { describe,expect,it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { createPlayerState } from '../core/GameState';
import { drainLantern,purchaseGasCanister,refillLantern,toggleLantern } from './LanternSystem';

describe('Lantern gas',()=>{
  it('starts empty and turned off',()=>{const player=createPlayerState();expect([player.gasCanisters,player.lanternFuel,player.lanternOn]).toEqual([0,0,false]);});
  it('purchases a gas canister for ten Coins',()=>{const player=createPlayerState();player.coins=GAME_CONFIG.shop.lanternGas.cost;expect(purchaseGasCanister(player).success).toBe(true);expect([player.coins,player.gasCanisters]).toEqual([0,1]);});
  it('limits gas inventory to one hundred canisters',()=>{const player=createPlayerState();player.gasCanisters=100;const coins=player.coins;expect(purchaseGasCanister(player).success).toBe(false);expect([player.coins,player.gasCanisters]).toEqual([coins,100]);});
  it('uses Q refill rules without wasting gas on a full tank',()=>{const player=createPlayerState();player.gasCanisters=2;expect(refillLantern(player).success).toBe(true);expect([player.gasCanisters,player.lanternFuel]).toEqual([1,100]);expect(refillLantern(player).success).toBe(false);expect(player.gasCanisters).toBe(1);});
  it('cannot turn on without fuel and toggles with fuel',()=>{const player=createPlayerState();expect(toggleLantern(player).success).toBe(false);player.lanternFuel=10;expect(toggleLantern(player).success).toBe(true);expect(player.lanternOn).toBe(true);expect(toggleLantern(player).success).toBe(true);expect(player.lanternOn).toBe(false);});
  it('drains three fuel per second and turns off at zero',()=>{const player=createPlayerState();player.lanternFuel=6;player.lanternOn=true;expect(drainLantern(player,1)).toBe(false);expect(player.lanternFuel).toBe(3);expect(drainLantern(player,1)).toBe(true);expect([player.lanternFuel,player.lanternOn]).toEqual([0,false]);});
});
