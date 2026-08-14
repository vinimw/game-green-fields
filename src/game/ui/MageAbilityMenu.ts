import { MAGE_CONFIG, type MageAbilityType } from "../config/mageConfig";
import type { PlayerState } from "../core/types";
import {
  learnMageAbility,
  selectMageAbility,
} from "../systems/MageAbilitySystem";
import { powerDamage } from "../systems/StatsSystem";

const unlockable = ["rain", "frost-meteor"] as const;
export class MageAbilityMenu {
  private el: HTMLElement;
  private mode: "backpack" | "abilities" = "backpack";
  private selectedBook?: (typeof unlockable)[number];
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
      if (event.repeat || this.player.powerType !== "magic") return;
      if (event.code === "KeyM") {
        event.preventDefault();
        this.toggle("backpack");
      }
      if (event.code === "KeyI") {
        event.preventDefault();
        this.toggle("abilities");
      }
      if (event.code === "Escape" && this.isOpen()) this.close();
    };
    addEventListener("keydown", this.keyHandler);
  }
  dispose() {
    removeEventListener("keydown", this.keyHandler);
    this.el.remove();
  }
  private isOpen() {
    return !this.el.classList.contains("hidden");
  }
  private toggle(mode: "backpack" | "abilities") {
    if (this.isOpen() && this.mode === mode) {
      this.close();
      return;
    }
    this.mode = mode;
    this.el.classList.remove("hidden");
    this.pause(true);
    this.render();
  }
  private close() {
    this.el.classList.add("hidden");
    this.pause(false);
  }
  private damage(ability: MageAbilityType) {
    return Math.round(
      powerDamage("magic", this.player.stats, this.player.staffLevel) *
        MAGE_CONFIG.abilities[ability].damageMultiplier,
    );
  }
  private bookCard(ability: (typeof unlockable)[number]) {
    const config = MAGE_CONFIG.abilities[ability],
      owned = this.player.inventory.includes(config.bookId);
    if (!owned) return "";
    return `<button class="skill-book ${this.selectedBook === ability ? "selected" : ""}" data-book="${ability}"><span>${ability === "rain" ? "📘" : "🧊"}</span><b>${ability === "rain" ? "Livro da Chuva" : "Livro Meteoro de Gelo"}</b><small>Habilidade para Mago</small></button>`;
  }
  private description(ability: (typeof unlockable)[number], element: string) {
    if (ability === "rain")
      return `<h2>Chuva de ${element}</h2><p>Uma chuva de ${element}.</p><p><b>+15% de poder de ataque</b></p>`;
    return `<h2>Meteoro de Gelo</h2><p>Invoca 3 meteoros de gelo em sequência em locais diferentes próximos da mira.</p><p><b>2.5× de poder · área de impacto ampliada</b></p>`;
  }
  private render() {
    const element = this.player.selectedSpell === "ice-lance" ? "gelo" : "raio",
      ownedBooks = unlockable.map((value) => this.bookCard(value)).join(""),
      selected = this.selectedBook,
      learnedRain = this.player.learnedMageAbilities.includes("rain"),
      learnedMeteor = this.player.learnedMageAbilities.includes("frost-meteor");
    if (this.mode === "backpack")
      this.el.innerHTML = `<div class="panel modal-panel mage-inventory"><button class="modal-close" data-close>×</button><h1>Mochila</h1><nav class="inventory-tabs"><button class="active">Habilidades</button></nav><div class="book-grid">${ownedBooks || '<p class="empty">Nenhum livro de habilidade na mochila.</p>'}</div>${selected && this.player.inventory.includes(MAGE_CONFIG.abilities[selected].bookId) ? `<section class="skill-description">${this.description(selected, element)}<button data-learn="${selected}">Aprender</button></section>` : ""}${learnedRain || learnedMeteor ? '<p class="learned-note">Pressione I para escolher uma habilidade aprendida.</p>' : ""}</div>`;
    else
      this.el.innerHTML = `<div class="panel modal-panel mage-inventory"><button class="modal-close" data-close>×</button><h1>Habilidades aprendidas</h1><p>Selecione qual forma de ataque será usada.</p><div class="ability-list">${this.abilityButton("lance", `Lança de ${element}`)}${learnedRain ? this.abilityButton("rain", `Chuva de ${element}`) : ""}${learnedMeteor ? this.abilityButton("frost-meteor", "Meteoro de Gelo") : ""}</div></div>`;
    this.bind();
  }
  private bind() {
    this.el
      .querySelector("[data-close]")
      ?.addEventListener("click", () => this.close());
    this.el.querySelectorAll<HTMLElement>("[data-book]").forEach(
      (button) =>
        (button.onclick = () => {
          this.selectedBook = button.dataset
            .book as (typeof unlockable)[number];
          this.render();
        }),
    );
    this.el
      .querySelector<HTMLElement>("[data-learn]")
      ?.addEventListener("click", (event) => {
        const ability = (event.currentTarget as HTMLElement).dataset
          .learn as (typeof unlockable)[number];
        if (learnMageAbility(this.player, ability))
          this.toast(`✨ ${MAGE_CONFIG.abilities[ability].name} aprendida!`);
        this.selectedBook = undefined;
        this.render();
      });
    this.el.querySelectorAll<HTMLElement>("[data-ability]").forEach(
      (button) =>
        (button.onclick = () => {
          const ability = button.dataset.ability as MageAbilityType;
          if (selectMageAbility(this.player, ability)) {
            this.toast(`${MAGE_CONFIG.abilities[ability].name} equipada`);
            this.render();
          }
        }),
    );
  }
  private abilityButton(ability: MageAbilityType, name: string) {
    const multiplier = MAGE_CONFIG.abilities[ability].damageMultiplier;
    return `<button class="ability-card ${this.player.selectedMageAbility === ability ? "selected" : ""}" data-ability="${ability}"><b>${ability === "rain" ? "🌧️" : ability === "frost-meteor" ? "☄️" : "✨"} ${name}</b><span>Dano ${this.damage(ability)}</span><small>${multiplier === 1 ? "Ataque padrão" : `${multiplier}× de poder`}</small></button>`;
  }
}
