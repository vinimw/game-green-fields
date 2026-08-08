import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../config/gameConfig";
import { createPlayerState } from "./GameState";
describe("initial game state", () => {
  it("uses the configured initial coin balance", () =>
    expect(createPlayerState().coins).toBe(GAME_CONFIG.player.initialCoins));
});
