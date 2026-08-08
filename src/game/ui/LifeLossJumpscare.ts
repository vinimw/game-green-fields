import { GAME_CONFIG } from "../config/gameConfig";
import type { GameAudioSystem } from "../systems/GameAudioSystem";

export class LifeLossJumpscare {
  private active = false;

  constructor(
    private root: HTMLElement,
    private audio: GameAudioSystem,
  ) {
    const image = new Image();
    image.src = GAME_CONFIG.effects.lifeLossJumpscare.imageUrl;
  }

  play(onComplete: () => void) {
    if (this.active) return;
    this.active = true;

    const overlay = document.createElement("div");
    overlay.className = "life-loss-jumpscare";
    overlay.setAttribute("role", "presentation");

    const image = document.createElement("img");
    image.src = GAME_CONFIG.effects.lifeLossJumpscare.imageUrl;
    image.alt = "";
    image.draggable = false;
    overlay.append(image);
    this.root.append(overlay);
    this.audio.playEvilLaugh();

    window.setTimeout(() => {
      overlay.remove();
      this.active = false;
      onComplete();
    }, GAME_CONFIG.effects.lifeLossJumpscare.durationMs);
  }

}
