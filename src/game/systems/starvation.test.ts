import { describe, expect, it } from "vitest";
import { StarvationSystem } from "./StarvationSystem";

describe("Starvation", () => {
  it("deals ten damage for every full second at zero hunger", () => {
    const starvation = new StarvationSystem();
    expect(starvation.update(0, 0.6)).toBe(0);
    expect(starvation.update(0, 0.4)).toBe(10);
    expect(starvation.update(0, 2)).toBe(20);
  });

  it("resets its timer as soon as the player eats", () => {
    const starvation = new StarvationSystem();
    starvation.update(0, 0.8);
    expect(starvation.update(30, 0.5)).toBe(0);
    expect(starvation.update(0, 0.5)).toBe(0);
    expect(starvation.update(0, 0.5)).toBe(10);
  });
});
