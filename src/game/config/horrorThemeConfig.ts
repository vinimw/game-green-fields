export const HORROR_THEME_CONFIG = {
  fog: { enabled: true, density: 0.028, color: "#172126" },
  lighting: {
    ambientIntensity: 0.22,
    moonIntensity: 0.7,
    moonColor: "#91A8C3",
    shadowDarkness: 0.72,
  },
  playerLight: {
    enabled: true,
    intensity: 5.25,
    radius: 15, //10
    color: "#FFD9A0",
    fuelEnabled: false,
  },
  darkness: {
    enabled: true,
    intervalMs: 10000, //30000
    durationMs: 5000,
    fogDensity: 0.065,
    sky: "#020304",
  },
  coreLight: { intensity: 2.2, radius: 18, color: "#FF9A3D" },
  environment: {
    sky: "#111A20",
    ground: "#26352E",
    deadWood: "#302A28",
    deadBranches: "#413833",
    wetRock: "#343C40",
    mud: "#3A3028",
    rust: "#754232",
    ruin: "#45494A",
    bone: "#B5AA91",
    warmFire: "#FF7A25",
  },
} as const;
