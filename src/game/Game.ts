import "../power-selection.css";
import "../base.css";
import "../coins.css";
import "../shop.css";
import "../boots-shop.css";
import "../modal-controls.css";
import "../autoplay.css";
import "../build.css";
import "../horror-theme.css";
import "../potions.css";
import "../tower-upgrade.css";
import "../boss.css";
import "../survival.css";
import "../life-loss-jumpscare.css";
import "../hud-compact.css";
import { Engine } from "@babylonjs/core";
import type { PowerType } from "./core/types";
import { SaveSystem } from "./systems/SaveSystem";
import { Hud } from "./ui/Hud";
import { PauseMenu } from "./ui/PauseMenu";
import { ShopMenu } from "./ui/ShopMenu";
import { BuildMenu } from "./ui/BuildMenu";
import { TowerUpgradePanel } from "./ui/TowerUpgradePanel";
import { VirtualJoystick } from "./ui/VirtualJoystick";
import { WorldScene } from "./scenes/WorldScene";
import { CheatCodeSystem } from "./systems/CheatCodeSystem";
import { GameAudioSystem } from "./systems/GameAudioSystem";

export class Game {
  private engine: Engine;
  private save = new SaveSystem();
  private world?: WorldScene;
  private cheats?: CheatCodeSystem;
  private audio = new GameAudioSystem();
  constructor(
    canvas: HTMLCanvasElement,
    private ui: HTMLElement,
  ) {
    this.engine = new Engine(canvas, true, { antialias: true });
  }
  start() {
    this.showTitle();
    addEventListener("resize", () => this.engine.resize());
    addEventListener("pointerdown", () => this.audio.unlock(), { once: true });
    addEventListener("keydown", () => this.audio.unlock(), { once: true });
  }
  private showTitle() {
    this.audio.stopAmbient();
    this.ui.innerHTML = `<div class="title-screen"><div class="logo"><span>THE LAST BEACON</span><h1>GREEN FIELDS</h1><p>Dark Fantasy · Survival Horror · Base Defense</p></div><div class="title-actions">${this.save.hasSave() ? '<button data-start="continue">Continue</button>' : ""}<button data-start="new">New Game</button></div></div>`;
    this.ui
      .querySelector('[data-start="continue"]')
      ?.addEventListener("click", () => this.launch(true));
    this.ui
      .querySelector('[data-start="new"]')
      ?.addEventListener("click", () => this.showPowerSelection());
  }
  private showPowerSelection() {
    this.ui.innerHTML = `<div class="title-screen power-screen"><div class="power-selection"><h1>Choose your power</h1><p>This choice defines which attribute increases your damage.</p><div class="power-cards"><button data-power="magic"><strong>✨ Magic</strong><small>Intelligence × 3 damage</small></button><button data-power="archer"><strong>🏹 Archer</strong><small>Agility × 3 damage</small></button><button data-power="healer"><strong>💚 Healer</strong><small>Intelligence × 3 damage</small></button></div><button class="back-title">Back</button></div></div>`;
    this.ui
      .querySelectorAll<HTMLElement>("[data-power]")
      .forEach(
        (button) =>
          (button.onclick = () =>
            this.launch(false, button.dataset.power as PowerType)),
      );
    this.ui
      .querySelector(".back-title")
      ?.addEventListener("click", () => this.showTitle());
  }
  private launch(continuing: boolean, powerType?: PowerType) {
    this.cheats?.dispose();
    const data = continuing ? this.save.load() : null;
    this.ui.innerHTML = "";
    this.audio.stopAmbient();
    this.audio.startAmbient();
    let menu!: PauseMenu,
      shop!: ShopMenu,
      build!: BuildMenu,
      towerUpgrade!: TowerUpgradePanel;
    const hud = new Hud(
      this.ui,
      () => {
        shop.toggle(false);
        build.toggle(false);
        if (menu.isOpen()) menu.toggle(false);
        else menu.openMain();
        if (this.world) this.world.paused = menu.isOpen();
      },
      () => {
        menu.toggle(false);
        build.toggle(false);
        shop.toggle();
        if (this.world) this.world.paused = shop.isOpen();
      },
      () => {
        shop.toggle(false);
        build.toggle(false);
        menu.openCharacter();
        if (this.world) this.world.paused = true;
      },
      (enabled) => this.world?.setAutoplay(enabled),
      () => {
        menu.toggle(false);
        shop.toggle(false);
        build.toggle();
        if (this.world) this.world.paused = build.isOpen();
      },
      () => this.world?.useHealthPotion(),
      () => this.world?.refillLantern(),
      () => this.world?.toggleLantern(),
      () => this.world?.eatRawSteak(),
    );
    this.world = new WorldScene(
      this.engine,
      this.ui,
      hud,
      this.audio,
      data,
      powerType,
      () => this.showGameOver(),
      () => this.showPlayerGameOver(),
    );
    towerUpgrade = new TowerUpgradePanel(
      this.ui,
      (id) => this.world!.getTowerUpgradeState(id),
      (id) => this.world!.upgradeTower(id),
    );
    this.world.setTowerSelectionHandler((id) =>
      id ? towerUpgrade.open(id) : towerUpgrade.close(),
    );
    this.cheats = new CheatCodeSystem((action) => {
      if (action.type === "money") this.world?.addCheatCoins(action.amount);
    });
    menu = new PauseMenu(
      this.ui,
      this.world.player.state,
      () => {
        menu.toggle(false);
        this.world!.paused = false;
      },
      () => {
        this.save.save(this.world!.snapshot());
        hud.toast("Game saved");
      },
    );
    shop = new ShopMenu(
      this.ui,
      () => this.world!.getShopState(),
      () => this.world!.buyBaseHealth(),
      () => this.world!.buyHealthPotion(),
      () => this.world!.buyGasCanister(),
      () => this.world!.buyArcherWeapon(),
      () => this.world!.buyArcherBoots(),
      () => {
        shop.toggle(false);
        this.world!.paused = false;
      },
    );
    build = new BuildMenu(
      this.ui,
      () => this.world!.getBuildState(),
      () => {
        const result = this.world!.startMiniTowerBuild();
        if (result.success) this.world!.paused = false;
        return result;
      },
      () => this.world!.cancelMiniTowerBuild(),
      () => {
        build.toggle(false);
        this.world!.paused = false;
      },
    );
    this.world.setPlacementStatusHandler((text, valid) =>
      build.updatePlacementStatus(text, valid),
    );
    this.world.setPlacementResultHandler((result) =>
      build.handlePlacementResult(result),
    );
    new VirtualJoystick(this.ui, this.world.input);
    let last = performance.now();
    this.engine.runRenderLoop(() => {
      const now = performance.now(),
        dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.world!.update(dt);
      towerUpgrade.update();
      this.world!.scene.render();
    });
  }
  private showGameOver() {
    this.audio.stopAmbient();
    this.cheats?.dispose();
    this.cheats = undefined;
    this.save.clear();
    const overlay = document.createElement("div");
    overlay.className = "overlay game-over";
    overlay.innerHTML = `<div class="panel"><h1>Game Over</h1><p class="empty">The base core was destroyed.</p><p>Your progress has been lost. Begin a new adventure.</p><button>Start New Game</button></div>`;
    this.ui.append(overlay);
    overlay.querySelector("button")?.addEventListener("click", () => {
      this.engine.stopRenderLoop();
      this.world = undefined;
      this.showPowerSelection();
    });
  }
  private showPlayerGameOver() {
    this.audio.stopAmbient();
    const hasSave = this.save.hasSave();
    const overlay = document.createElement("div");
    overlay.className = "overlay game-over";
    overlay.innerHTML = `<div class="panel"><h1>No Lives Remaining</h1><p class="empty">The darkness claimed your final life.</p><p>${hasSave ? "Continue from your last saved game." : "There is no saved game yet. Begin a new adventure."}</p><button data-retry>${hasSave ? "Continue Last Save" : "Start New Game"}</button></div>`;
    this.ui.append(overlay);
    overlay.querySelector("[data-retry]")?.addEventListener("click", () => {
      this.engine.stopRenderLoop();
      this.world = undefined;
      if (hasSave) this.launch(true);
      else this.showPowerSelection();
    });
  }
}
