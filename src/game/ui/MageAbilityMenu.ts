import {
  ARCHER_ABILITIES,
  type ArcherAbilityType,
} from "../config/archerAbilitiesConfig";
import { MAGE_CONFIG, type MageAbilityType } from "../config/mageConfig";
import type { PlayerState } from "../core/types";
import {
  learnArcherAbility,
  selectArcherAbility,
} from "../systems/ArcherAbilitySystem";
import {
  learnMageAbility,
  selectMageAbility,
} from "../systems/MageAbilitySystem";
import { powerDamage } from "../systems/StatsSystem";
type LearnableMage = Exclude<MageAbilityType, "lance">;
type LearnableArcher = Exclude<ArcherAbilityType, "single-arrow">;
const mageBooks: [LearnableMage, string, string][] = [
    ["rain", "📘", "Livro da Chuva"],
    ["frost-meteor", "🧊", "Livro Meteoro de Gelo"],
  ],
  archerBooks: [LearnableArcher, string, string][] = [
    ["arrow-rain", "🏹", "Livro Chuva de Flechas"],
    ["ricochet-arrow", "↗️", "Livro Flecha Ricochete"],
  ];
export class MageAbilityMenu {
  private el: HTMLElement;
  private mode: "backpack" | "abilities" = "backpack";
  private selected?: MageAbilityType | ArcherAbilityType;
  private keyHandler: (event: KeyboardEvent) => void;
  constructor(
    root: HTMLElement,
    private player: PlayerState,
    private pause: (paused: boolean) => void,
    private toast: (text: string) => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "overlay hidden mage-inventory-overlay";
    root.append(this.el);
    this.keyHandler = (event) => {
      if (
        event.repeat ||
        (player.powerType !== "magic" && player.powerType !== "archer")
      )
        return;
      if (event.code === "KeyM") {
        event.preventDefault();
        this.toggle("backpack");
      }
      if (event.code === "KeyI") {
        event.preventDefault();
        this.toggle("abilities");
      }
      if (event.code === "Escape" && this.open()) this.close();
    };
    addEventListener("keydown", this.keyHandler);
  }
  dispose() {
    removeEventListener("keydown", this.keyHandler);
    this.el.remove();
  }
  private open() {
    return !this.el.classList.contains("hidden");
  }
  private close() {
    this.el.classList.add("hidden");
    this.pause(false);
  }
  private toggle(mode: "backpack" | "abilities") {
    if (this.open() && this.mode === mode) {
      this.close();
      return;
    }
    this.mode = mode;
    this.el.classList.remove("hidden");
    this.pause(true);
    this.render();
  }
  private render() {
    if (this.player.powerType === "archer") this.renderArcher();
    else this.renderMage();
  }
  private shell(content: string) {
    this.el.innerHTML = `<div class="panel modal-panel mage-inventory"><button class="modal-close" data-close>×</button>${content}</div>`;
    this.el
      .querySelector("[data-close]")
      ?.addEventListener("click", () => this.close());
  }
  private renderArcher() {
    const learned = this.player.learnedArcherAbilities;
    if (this.mode === "backpack") {
      const cards = archerBooks
          .filter(([ability]) =>
            this.player.inventory.includes(ARCHER_ABILITIES[ability].bookId),
          )
          .map(
            ([ability, icon, label]) =>
              `<button class="skill-book ${this.selected === ability ? "selected" : ""}" data-archer-book="${ability}"><span>${icon}</span><b>${label}</b></button>`,
          )
          .join(""),
        selected = this.selected as LearnableArcher | undefined,
        description =
          selected &&
          this.player.inventory.includes(ARCHER_ABILITIES[selected].bookId)
            ? `<section class="skill-description">${selected === "arrow-rain" ? "<h2>Chuva de Flechas</h2><p>Atinge uma grande área com 2.10× de dano.</p>" : "<h2>Flecha Ricochete</h2><p>Acerta o alvo inicial e rebate rapidamente em até 3 adversários próximos.</p><p><b>3.5× de dano · alcance máximo 6</b></p>"}<button data-learn-archer="${selected}">Aprender</button></section>`
            : "";
      this.shell(
        `<h1>Mochila</h1><nav class="inventory-tabs"><button class="active">Habilidades</button></nav><div class="book-grid">${cards || '<p class="empty">Nenhum livro de habilidade na mochila.</p>'}</div>${description}`,
      );
      this.el.querySelectorAll<HTMLElement>("[data-archer-book]").forEach(
        (button) =>
          (button.onclick = () => {
            this.selected = button.dataset.archerBook as LearnableArcher;
            this.render();
          }),
      );
      this.el
        .querySelector<HTMLElement>("[data-learn-archer]")
        ?.addEventListener("click", (event) => {
          const ability = (event.currentTarget as HTMLElement).dataset
            .learnArcher as LearnableArcher;
          if (learnArcherAbility(this.player, ability))
            this.toast(`🏹 ${ARCHER_ABILITIES[ability].name} aprendida!`);
          this.selected = undefined;
          this.render();
        });
      return;
    }
    const damage = (ability: ArcherAbilityType) =>
        Math.round(
          powerDamage(
            "archer",
            this.player.stats,
            this.player.archerWeaponLevel,
          ) * ARCHER_ABILITIES[ability].damageMultiplier,
        ),
      cards = (Object.keys(ARCHER_ABILITIES) as ArcherAbilityType[])
        .filter((ability) => learned.includes(ability))
        .map(
          (ability) =>
            `<button class="ability-card ${this.player.selectedArcherAbility === ability ? "selected" : ""}" data-archer-ability="${ability}"><b>🏹 ${ARCHER_ABILITIES[ability].name}</b><span>Dano ${damage(ability)}</span><small>${ability === "arrow-rain" ? "2.10× · grande área" : ability === "ricochet-arrow" ? "3.5× · 3 ricochetes" : "Ataque padrão"}</small></button>`,
        )
        .join("");
    this.shell(
      `<h1>Habilidades aprendidas</h1><div class="ability-list">${cards}</div>`,
    );
    this.el.querySelectorAll<HTMLElement>("[data-archer-ability]").forEach(
      (button) =>
        (button.onclick = () => {
          const ability = button.dataset.archerAbility as ArcherAbilityType;
          if (selectArcherAbility(this.player, ability)) {
            this.toast(`${ARCHER_ABILITIES[ability].name} equipada`);
            this.render();
          }
        }),
    );
  }
  private renderMage() {
    const learned = this.player.learnedMageAbilities,
      element = this.player.selectedSpell === "ice-lance" ? "gelo" : "raio";
    if (this.mode === "backpack") {
      const cards = mageBooks
          .filter(([ability]) =>
            this.player.inventory.includes(
              MAGE_CONFIG.abilities[ability].bookId,
            ),
          )
          .map(
            ([ability, icon, label]) =>
              `<button class="skill-book ${this.selected === ability ? "selected" : ""}" data-mage-book="${ability}"><span>${icon}</span><b>${label}</b></button>`,
          )
          .join(""),
        selected = this.selected as LearnableMage | undefined,
        description =
          selected &&
          this.player.inventory.includes(MAGE_CONFIG.abilities[selected].bookId)
            ? `<section class="skill-description">${selected === "rain" ? `<h2>Chuva de ${element}</h2><p>Uma chuva de ${element}. +15% de poder.</p>` : "<h2>Meteoro de Gelo</h2><p>Três meteoros sequenciais. 2.5× de poder e área ampliada.</p>"}<button data-learn-mage="${selected}">Aprender</button></section>`
            : "";
      this.shell(
        `<h1>Mochila</h1><div class="book-grid">${cards || '<p class="empty">Nenhum livro de habilidade na mochila.</p>'}</div>${description}`,
      );
      this.el.querySelectorAll<HTMLElement>("[data-mage-book]").forEach(
        (button) =>
          (button.onclick = () => {
            this.selected = button.dataset.mageBook as LearnableMage;
            this.render();
          }),
      );
      this.el
        .querySelector<HTMLElement>("[data-learn-mage]")
        ?.addEventListener("click", (event) => {
          const ability = (event.currentTarget as HTMLElement).dataset
            .learnMage as LearnableMage;
          if (learnMageAbility(this.player, ability))
            this.toast(`✨ ${MAGE_CONFIG.abilities[ability].name} aprendida!`);
          this.selected = undefined;
          this.render();
        });
      return;
    }
    const damage = (ability: MageAbilityType) =>
        Math.round(
          powerDamage("magic", this.player.stats, this.player.staffLevel) *
            MAGE_CONFIG.abilities[ability].damageMultiplier,
        ),
      cards = (Object.keys(MAGE_CONFIG.abilities) as MageAbilityType[])
        .filter((ability) => learned.includes(ability))
        .map(
          (ability) =>
            `<button class="ability-card ${this.player.selectedMageAbility === ability ? "selected" : ""}" data-mage-ability="${ability}"><b>✨ ${MAGE_CONFIG.abilities[ability].name}</b><span>Dano ${damage(ability)}</span></button>`,
        )
        .join("");
    this.shell(
      `<h1>Habilidades aprendidas</h1><div class="ability-list">${cards}</div>`,
    );
    this.el.querySelectorAll<HTMLElement>("[data-mage-ability]").forEach(
      (button) =>
        (button.onclick = () => {
          const ability = button.dataset.mageAbility as MageAbilityType;
          if (selectMageAbility(this.player, ability)) {
            this.toast(`${MAGE_CONFIG.abilities[ability].name} equipada`);
            this.render();
          }
        }),
    );
  }
}
