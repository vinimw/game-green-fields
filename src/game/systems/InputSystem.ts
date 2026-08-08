export class InputSystem {
  private keys = new Set<string>();
  joystick = { x: 0, z: 0 };
  potionRequested = false;
  lanternToggleRequested = false;
  lanternRefillRequested = false;
  steakRequested = false;
  constructor() {
    addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        this.lanternToggleRequested = true;
      }
      if (e.code === "KeyC" && !e.repeat) this.potionRequested = true;
      if (e.code === "KeyQ" && !e.repeat) this.lanternRefillRequested = true;
      if (e.code === "KeyE" && !e.repeat) this.steakRequested = true;
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
  }
  consumePotionRequest() {
    const requested = this.potionRequested;
    this.potionRequested = false;
    return requested;
  }
  consumeLanternToggleRequest() {
    const requested = this.lanternToggleRequested;
    this.lanternToggleRequested = false;
    return requested;
  }
  consumeLanternRefillRequest() {
    const requested = this.lanternRefillRequested;
    this.lanternRefillRequested = false;
    return requested;
  }
  consumeSteakRequest() {
    const requested = this.steakRequested;
    this.steakRequested = false;
    return requested;
  }
  direction() {
    const x =
      (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0) -
      (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
      this.joystick.x;
    const z =
      (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0) -
      (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) +
      this.joystick.z;
    const l = Math.hypot(x, z);
    return l > 1 ? { x: x / l, z: z / l } : { x, z };
  }
}
