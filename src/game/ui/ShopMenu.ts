import type { ArcherWeaponConfig } from '../config/archerWeaponsConfig';
import type { PowerType } from '../core/types';

export type ShopView = { powerType: PowerType; coins: number; baseHealth: number; baseMaxHealth: number; cost: number; healthRestore: number; currentWeapon?: ArcherWeaponConfig; nextWeapon?: ArcherWeaponConfig; currentDamage: number; nextDamage: number | null };
const weaponCard = (weapon: ArcherWeaponConfig, label: string) => `<article class="weapon-card rarity-${weapon.rarity}"><span class="weapon-label">${label}</span><div class="weapon-picture" style="--weapon-color:${weapon.placeholderColor}"><img src="${weapon.image}" alt="${weapon.name}" onerror="this.hidden=true"><span>🏹</span></div><div><small>${weapon.rarity} · Level ${weapon.level}</small><h2>${weapon.name}</h2><b>+${weapon.damageBonusPercent}% damage</b></div></article>`;

export class ShopMenu {
  el: HTMLElement;
  constructor(root: HTMLElement, private view: () => ShopView, private buyBase: () => string, private upgradeWeapon: () => string, private close: () => void) { this.el = document.createElement('div'); this.el.className = 'overlay hidden'; root.append(this.el); this.render(); }
  toggle(open?: boolean) { const shouldOpen = open ?? !this.isOpen(); this.el.classList.toggle('hidden', !shouldOpen); this.render(); }
  isOpen() { return !this.el.classList.contains('hidden'); }
  private render(message = '') {
    const state = this.view(), full = state.baseHealth >= state.baseMaxHealth, repairDisabled = state.coins < state.cost || full;
    const equipment = state.powerType === 'archer' && state.currentWeapon ? `<section class="weapon-shop"><h2>Archer Equipment</h2><div class="weapon-grid">${weaponCard(state.currentWeapon, 'Equipped')}${state.nextWeapon ? weaponCard(state.nextWeapon, 'Next upgrade') : '<article class="weapon-card max-weapon"><span>🏆</span><h2>MAX LEVEL</h2><p>You own the Celestial Bow.</p></article>'}</div>${state.nextWeapon ? `<div class="damage-preview"><span>Damage now <b>${state.currentDamage}</b></span><span>After upgrade <b>${state.nextDamage}</b></span></div><button data-upgrade ${state.coins < state.nextWeapon.price ? 'disabled' : ''}>Buy ${state.nextWeapon.name} · ● ${state.nextWeapon.price} Coins</button>${state.coins < state.nextWeapon.price ? '<p class="not-enough">Not enough Coins</p>' : ''}` : '<button disabled>MAX LEVEL · +24% damage</button>'}</section>` : '<section class="weapon-shop unavailable"><h2>Equipment</h2><p>Bow upgrades are exclusive to the Archer class.</p></section>';
    this.el.innerHTML = `<div class="panel shop-panel modal-panel"><button class="modal-close" data-close aria-label="Close shop" title="Close">×</button><h1>Golden Shop</h1><div class="shop-balances"><span>● ${state.coins} Coins</span></div>${equipment}<section class="shop-item"><div class="shop-fire">🔥</div><div><h2>Repair the Core</h2><p>Restore up to ${state.healthRestore} base HP.</p><small>Core: ${state.baseHealth} / ${state.baseMaxHealth}</small></div><button data-buy-base ${repairDisabled ? 'disabled' : ''}>Buy · ● ${state.cost} Coins</button></section>${full ? '<p class="hint">The core is already at full health.</p>' : ''}<p class="shop-message">${message}</p><button data-close>Return to Game</button></div>`;
    this.el.querySelector('[data-buy-base]')?.addEventListener('click', () => this.render(this.buyBase()));
    this.el.querySelector('[data-upgrade]')?.addEventListener('click', () => this.render(this.upgradeWeapon()));
    this.el.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',this.close));
  }
}
