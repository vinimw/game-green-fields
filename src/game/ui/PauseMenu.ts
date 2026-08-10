import type { PlayerState, Stats } from "../core/types";
import {
  criticalChance,
  maxHealth,
  movementSpeed,
  movementSpeedBonuses,
  powerDamage,
  resetStats,
  spendStat,
} from "../systems/StatsSystem";
import { currentArcherWeapon } from "../systems/ArcherWeaponSystem";
import { currentArcherBoots } from "../systems/ArcherBootsSystem";

export class PauseMenu {
  el: HTMLElement;
  private tab: "main" | "character" | "inventory" = "main";
  constructor(
    root: HTMLElement,
    private player: PlayerState,
    private close: () => void,
    private save: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "overlay hidden";
    root.append(this.el);
    this.render();
  }
  toggle(open?: boolean) {
    const shouldOpen = open ?? !this.isOpen();
    this.el.classList.toggle("hidden", !shouldOpen);
    this.render();
  }
  openCharacter() {
    this.tab = "character";
    this.toggle(true);
  }
  openMain() {
    this.tab = "main";
    this.toggle(true);
  }
  isOpen() {
    return !this.el.classList.contains("hidden");
  }
  private closeButton(label: string) {
    return `<button class="modal-close" data-a="resume" aria-label="Close ${label}" title="Close">×</button>`;
  }
  private render() {
    if (this.tab === "main")
      this.el.innerHTML = `<div class="panel modal-panel">${this.closeButton("menu")}<h1>Green Fields</h1><button data-a="resume">Resume</button><button data-a="character">Character</button><button data-a="inventory">Inventory</button><button data-a="save">Save Game</button><section class="controls-guide"><h2>Controls</h2><p><kbd>WASD</kbd> / <kbd>Arrows</kbd> Move</p><p><kbd>Click</kbd> Attack position</p><p><kbd>M</kbd> Mage backpack</p><p><kbd>I</kbd> Learned Mage abilities</p><p><kbd>C</kbd> Use Health Potion</p><p><kbd>Q</kbd> Refill lantern with Gas</p><p><kbd>Space</kbd> Turn lantern on / off</p></section></div>`;
    if (this.tab === "character") {
      const player = this.player,
        stats = player.stats,
        weapon =
          player.powerType === "archer"
            ? currentArcherWeapon(player)
            : undefined,
        boots =
          player.powerType === "archer"
            ? currentArcherBoots(player)
            : undefined,
        speed = movementSpeedBonuses(
          player.level,
          stats.agility,
          player.bootsLevel,
        );
      this.el.innerHTML = `<div class="panel modal-panel">${this.closeButton("character")}<h1>Character</h1><div class="stats"><span>Power</span><b>${player.powerType}</b><span>Power damage</span><b>${powerDamage(player.powerType, stats, player.powerType === "magic" ? player.staffLevel : player.archerWeaponLevel)}</b><span>Level</span><b>${player.level}</b><span>XP</span><b>${player.xp}</b>${(["strength", "agility", "intelligence", "vitality"] as (keyof Stats)[]).map((stat) => `<span>${stat[0].toUpperCase() + stat.slice(1)}</span><b>${stats[stat]} <button class="plus" data-stat="${stat}" ${player.availableStatPoints < 1 ? "disabled" : ""}>+</button></b>`).join("")}<span>Critical</span><b>${criticalChance(stats.agility).toFixed(1)}%</b><span>Movement Speed</span><b>${movementSpeed(player.level, stats.agility, player.bootsLevel).toFixed(2)}</b><span>Level bonus</span><b>+${speed.levelBonusPercent.toFixed(1)}%</b><span>Agility bonus</span><b>+${speed.agilityBonusPercent.toFixed(1)}%</b><span>Boots bonus</span><b>+${speed.bootsBonusPercent.toFixed(1)}%</b><span>Total speed bonus</span><b>+${speed.totalBonusPercent.toFixed(1)}%</b><span>Weapon</span><b>${weapon ? `${weapon.name} LV${weapon.level}` : "None"}</b><span>Boots</span><b>${boots ? `${boots.name} LV${boots.level}` : "No Boots"}</b><span>HP</span><b>${Math.ceil(player.currentHealth)} / ${maxHealth(stats.vitality, player.level)}</b><span>Available points</span><b>${player.availableStatPoints}</b></div><button data-a="reset-stats">Reset Stats</button><button data-a="back">Back</button></div>`;
    }
    if (this.tab === "inventory") {
      const equipment = this.player.equipment,
        weapon =
          this.player.powerType === "archer"
            ? currentArcherWeapon(this.player)
            : undefined;
      this.el.innerHTML = `<div class="panel modal-panel">${this.closeButton("inventory")}<h1>Inventory</h1><p class="empty">Your backpack is empty.</p><h2>Equipment</h2><div class="equipment">${Object.entries(
        equipment,
      )
        .map(
          ([slot, item]) =>
            `<span>${slot}</span><b>${slot === "weapon" && weapon ? `${weapon.name} · Lv ${weapon.level} · +${weapon.damageBonusPercent}%` : (item ?? "Empty")}</b>`,
        )
        .join("")}</div><button data-a="back">Back</button></div>`;
    }
    this.el.querySelectorAll<HTMLElement>("[data-a]").forEach(
      (button) =>
        (button.onclick = () => {
          const action = button.dataset.a;
          if (action === "resume") this.close();
          if (action === "character" || action === "inventory") {
            this.tab = action;
            this.render();
          }
          if (action === "back") {
            this.tab = "main";
            this.render();
          }
          if (action === "save") this.save();
          if (action === "reset-stats") {
            resetStats(this.player);
            this.render();
          }
        }),
    );
    this.el.querySelectorAll<HTMLElement>("[data-stat]").forEach(
      (button) =>
        (button.onclick = () => {
          spendStat(this.player, button.dataset.stat as keyof Stats);
          this.render();
        }),
    );
  }
}
