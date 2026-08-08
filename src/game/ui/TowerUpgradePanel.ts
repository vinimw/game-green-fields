export type TowerUpgradeView = {
  id: string;
  level: number;
  maxLevel: number;
  damage: number;
  nextDamage: number | null;
  nextCost: number | null;
  coins: number;
  currentHealth: number;
  maxHealth: number;
};

export class TowerUpgradePanel {
  private element = document.createElement("section");
  private selectedId: string | null = null;
  private signature = "";

  constructor(
    private root: HTMLElement,
    private getView: (id: string) => TowerUpgradeView | null,
    private upgrade: (id: string) => string,
  ) {
    this.element.className = "tower-upgrade-panel hidden";
    this.root.append(this.element);
  }
  open(id: string) {
    this.selectedId = id;
    this.signature = "";
    this.update();
  }
  close() {
    this.selectedId = null;
    this.element.classList.add("hidden");
  }
  update() {
    if (!this.selectedId) return;
    const view = this.getView(this.selectedId);
    if (!view) return this.close();
    const signature = JSON.stringify(view);
    if (signature === this.signature) return;
    this.signature = signature;
    this.render(view);
  }
  private render(view: TowerUpgradeView, message = "") {
    const maximum = view.level >= view.maxLevel;
    const affordable =
      !maximum && view.nextCost !== null && view.coins >= view.nextCost;
    this.element.classList.remove("hidden");
    this.element.innerHTML = `<button class="tower-upgrade-close" aria-label="Close">×</button><h3>Mini Tower · LV ${view.level}</h3><p>HP ${view.currentHealth}/${view.maxHealth} · Damage ${view.damage.toLocaleString()}</p><p>${maximum ? "Maximum level reached" : `Next: ${view.nextDamage?.toLocaleString()} damage · ${view.nextCost?.toLocaleString()} Coins`}</p><button class="tower-upgrade-action" ${affordable ? "" : "disabled"}>${maximum ? "MAX LEVEL" : "LEVEL UP"}</button>${message ? `<small>${message}</small>` : ""}`;
    this.element
      .querySelector(".tower-upgrade-close")
      ?.addEventListener("click", () => this.close());
    this.element
      .querySelector(".tower-upgrade-action")
      ?.addEventListener("click", () => {
        const result = this.upgrade(view.id);
        this.signature = "";
        const next = this.getView(view.id);
        if (next) this.render(next, result);
      });
  }
}
