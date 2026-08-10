import type { BaseState, PlayerState } from "../core/types";
import { maxHealth } from "../systems/StatsSystem";
import { requiredXP } from "../systems/ExperienceSystem";
import { MAGE_CONFIG } from "../config/mageConfig";

export class Hud {
  el: HTMLElement;
  constructor(
    root: HTMLElement,
    onMenu: () => void,
    onShop: () => void,
    onCharacter: () => void,
    onAutoplay: (enabled: boolean) => void,
    onBuild: () => void,
    onPotion: () => void,
    onGas: () => void,
    onLantern: () => void,
    onSteak: () => void,
    onSpell: () => void,
    onMageAttack: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "hud";
    this.el.innerHTML = `<div class="top-actions"><button class="menu-btn">☰ Menu</button><button class="character-btn" aria-label="Open character status" title="Character status">👤</button><button class="shop-btn" aria-label="Open shop" title="Shop">🛒</button><button class="build-btn" aria-label="Build defenses" title="Build defenses">🏰 BUILD</button><div class="coin-total" aria-label="Coins">● <span>0</span></div><label class="autoplay-switch"><input type="checkbox"><span></span><b>Autoplay</b></label></div><div class="item-slots"><button class="potion-slot" aria-label="Use Health Potion" title="Use Health Potion (C)"><span class="item-icon">🧪</span><b class="potion-count">0</b><kbd>C</kbd></button><button class="gas-slot" aria-label="Refill Lantern" title="Refill Lantern (Q)"><span class="item-icon">⛽</span><b class="gas-count">0</b><kbd>Q</kbd></button><button class="lantern-slot" aria-label="Toggle Lantern" title="Toggle Lantern (Space)"><span class="item-icon">🔦</span><b class="lantern-fuel">0</b><kbd>SPACE</kbd></button></div><div class="meters"><b class="level"></b><label>HP <span class="hptext"></span><i class="bar hp"><i></i></i></label><label>XP <span class="xptext"></span><i class="bar xp"><i></i></i></label></div><div class="base-status"><b class="raid-label"></b><span class="base-health"></span><i class="base-bar"><i></i></i></div><div class="toast"></div>`;
    const mageActions = document.createElement("div");
    mageActions.className = "mage-actions hidden";
    mageActions.innerHTML = `<button class="mage-attack" aria-label="Cast selected spell"><b>CAST</b><span>✨</span></button><button class="mage-spell" aria-label="Switch Mage spell"><span>❄️</span><b>ICE LANCE</b></button>`;
    const actionDock = document.createElement("div");
    actionDock.className = "bottom-right-controls";
    const itemSlots = this.el.querySelector(".item-slots");
    if (itemSlots) actionDock.append(itemSlots);
    actionDock.append(mageActions);
    this.el.append(actionDock);
    const lives = document.createElement("div");
    lives.className = "lives-display";
    lives.setAttribute("aria-label", "Player lives");
    this.el.append(lives);
    this.el
      .querySelector(".item-slots")
      ?.insertAdjacentHTML(
        "beforeend",
        `<button class="steak-slot" aria-label="Eat Raw Beef" title="Eat Raw Beef (E)"><span class="item-icon">🥩</span><b class="steak-count">0</b><kbd>E</kbd></button>`,
      );
    const hunger = document.createElement("div");
    hunger.className = "hunger-status";
    hunger.innerHTML = `<span>HUNGER <b class="hunger-text">100</b></span><i class="hunger-bar"><i></i></i>`;
    this.el.append(hunger);
    root.append(this.el);
    this.el.querySelector(".menu-btn")?.addEventListener("click", onMenu);
    this.el.querySelector(".shop-btn")?.addEventListener("click", onShop);
    this.el
      .querySelector(".character-btn")
      ?.addEventListener("click", onCharacter);
    this.el.querySelector(".build-btn")?.addEventListener("click", onBuild);
    this.el.querySelector(".potion-slot")?.addEventListener("click", onPotion);
    this.el.querySelector(".gas-slot")?.addEventListener("click", onGas);
    this.el
      .querySelector(".lantern-slot")
      ?.addEventListener("click", onLantern);
    this.el.querySelector(".steak-slot")?.addEventListener("click", onSteak);
    this.el.querySelector(".mage-spell")?.addEventListener("click", onSpell);
    this.el.querySelector(".mage-attack")?.addEventListener("click", onMageAttack);
    this.el
      .querySelector<HTMLInputElement>(".autoplay-switch input")
      ?.addEventListener("change", (event) =>
        onAutoplay((event.currentTarget as HTMLInputElement).checked),
      );
  }
  update(player: PlayerState) {
    const maximum = maxHealth(player.stats.vitality, player.level),
      required = requiredXP(player.level);
    this.set(".level", `LV ${player.level}`);
    this.set(".hptext", `${Math.ceil(player.currentHealth)} / ${maximum}`);
    this.set(".xptext", `${player.xp} / ${required}`);
    this.set(".coin-total span", String(player.coins));
    this.set(".lives-display", "♥".repeat(player.lives));
    this.set(".potion-count", String(player.healthPotions));
    this.set(".gas-count", String(player.gasCanisters));
    this.set(".lantern-fuel", String(Math.ceil(player.lanternFuel)));
    this.set(".steak-count", String(player.rawSteaks));
    this.set(".hunger-text", `${player.hunger.toFixed(1)} / 100`);
    const mage = player.powerType === "magic",
      spell = MAGE_CONFIG.spells[player.selectedSpell];
    this.el.querySelector(".mage-actions")?.classList.toggle("hidden", !mage);
    this.set(".mage-spell span", spell.icon);
    this.set(".mage-spell b", `${spell.name.split(" ")[0]} ${player.selectedMageAbility}`.toUpperCase());
    this.el
      .querySelector(".potion-slot")
      ?.classList.toggle("empty", player.healthPotions === 0);
    this.el
      .querySelector(".gas-slot")
      ?.classList.toggle("empty", player.gasCanisters === 0);
    this.el
      .querySelector(".lantern-slot")
      ?.classList.toggle("active", player.lanternOn);
    this.el
      .querySelector(".lantern-slot")
      ?.classList.toggle("empty", player.lanternFuel === 0);
    this.el
      .querySelector(".steak-slot")
      ?.classList.toggle("empty", player.rawSteaks === 0);
    this.width(".hp i", (player.currentHealth / maximum) * 100);
    this.width(".xp i", (player.xp / required) * 100);
    this.width(".hunger-bar i", player.hunger);
  }
  updateBase(base: BaseState, maximumHealth: number) {
    const seconds = Math.ceil(base.remainingTimeMs / 1000);
    this.set(
      ".raid-label",
      base.raidActive
        ? `⚠ BASE UNDER ATTACK · ${seconds}s`
        : `Next raid · ${seconds}s`,
    );
    this.set(".base-health", `Core ${base.currentHealth} / ${maximumHealth}`);
    this.width(".base-bar i", (base.currentHealth / maximumHealth) * 100);
  }
  toast(value: string, durationMs = 1200) {
    const element = this.el.querySelector(".toast") as HTMLElement;
    element.textContent = value;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), durationMs);
  }
  private set(selector: string, value: string) {
    const element = this.el.querySelector(selector);
    if (element) element.textContent = value;
  }
  private width(selector: string, value: number) {
    (this.el.querySelector(selector) as HTMLElement).style.width =
      `${Math.max(0, value)}%`;
  }
}
