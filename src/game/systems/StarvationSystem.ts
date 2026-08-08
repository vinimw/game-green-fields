import { GAME_CONFIG } from "../config/gameConfig";

export class StarvationSystem {
  private elapsedSeconds = 0;

  update(hunger: number, deltaSeconds: number) {
    if (hunger > 0) {
      this.elapsedSeconds = 0;
      return 0;
    }

    this.elapsedSeconds += Math.max(0, deltaSeconds);
    const fullSeconds = Math.floor(this.elapsedSeconds);
    if (fullSeconds === 0) return 0;
    this.elapsedSeconds -= fullSeconds;
    return fullSeconds * GAME_CONFIG.survival.hunger.starvationDamagePerSecond;
  }
}
