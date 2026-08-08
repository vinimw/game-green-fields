import { describe,expect,it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { createPlayerState } from '../core/GameState';
import { purchaseHealthPotion,useHealthPotion } from './HealthPotionSystem';

describe('Health Potions',()=>{
  it('starts a new player with zero potions',()=>expect(createPlayerState().healthPotions).toBe(0));
  it('purchases one potion with Coins',()=>{const player=createPlayerState();player.coins=GAME_CONFIG.shop.healthPotion.cost;expect(purchaseHealthPotion(player).success).toBe(true);expect([player.coins,player.healthPotions]).toEqual([0,1]);});
  it('limits the inventory to one hundred potions',()=>{const player=createPlayerState();player.healthPotions=GAME_CONFIG.shop.healthPotion.maxInventory;const coins=player.coins;expect(purchaseHealthPotion(player).success).toBe(false);expect([player.coins,player.healthPotions]).toEqual([coins,100]);});
  it('restores up to 300 HP and consumes one potion',()=>{const player=createPlayerState();player.level=10;player.currentHealth=100;player.healthPotions=1;expect(useHealthPotion(player)).toMatchObject({success:true,restored:300});expect([player.currentHealth,player.healthPotions]).toEqual([400,0]);});
  it('does not consume a potion at full health',()=>{const player=createPlayerState();player.healthPotions=1;expect(useHealthPotion(player).success).toBe(false);expect(player.healthPotions).toBe(1);});
});
