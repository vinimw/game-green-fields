import { getArcherWeapon } from "./archerWeaponsConfig";
export type MageSpellType = "ice-lance" | "lightning-lance";
export type StaffVisualStyle =
  | "branch"
  | "crystal"
  | "runed"
  | "orbital"
  | "rift"
  | "eclipse"
  | "eternity";
export type StaffDefinition = {
  id: string;
  name: string;
  level: number;
  price: number;
  aoeRadius: number;
  visual: { woodColor: string; crystalColor: string; style: StaffVisualStyle };
};
const staff = (
  level: number,
  id: string,
  name: string,
  aoeRadius: number,
  woodColor: string,
  crystalColor: string,
  style: StaffVisualStyle
): StaffDefinition => ({
  level,
  id,
  name,
  price: getArcherWeapon(level)?.price ?? 0,
  aoeRadius,
  visual: { woodColor, crystalColor, style },
});
export const MAGE_STAFFS: readonly StaffDefinition[] = [
  staff(
    1,
    "wanderers-branch",
    "Wanderer's Branch",
    0,
    "#65472d",
    "#8fd9e8",
    "branch"
  ),
  staff(
    2,
    "apprentice-staff",
    "Apprentice Staff",
    0,
    "#765336",
    "#55bde9",
    "crystal"
  ),
  staff(
    3,
    "runed-oak-staff",
    "Runed Oak Staff",
    1.5,
    "#3e2b24",
    "#8068e8",
    "runed"
  ),
  staff(
    4,
    "crystalweaver-staff",
    "Crystalweaver Staff",
    1.7,
    "#533b2c",
    "#76dff2",
    "crystal"
  ),
  staff(
    5,
    "emberglass-staff",
    "Emberglass Staff",
    1.9,
    "#452d26",
    "#ef6b36",
    "crystal"
  ),
  staff(
    6,
    "moonstone-staff",
    "Moonstone Staff",
    2.1,
    "#a68f70",
    "#bdefff",
    "orbital"
  ),
  staff(
    7,
    "arcane-conduit",
    "Arcane Conduit",
    2.3,
    "#49372d",
    "#9b5bea",
    "orbital"
  ),
  staff(
    8,
    "voidroot-staff",
    "Voidroot Staff",
    2.5,
    "#211b20",
    "#713cc9",
    "runed"
  ),
  staff(
    9,
    "astral-scepter",
    "Astral Scepter",
    2.7,
    "#39405c",
    "#86b5ff",
    "orbital"
  ),
  staff(
    10,
    "staff-of-the-rift",
    "Staff of the Rift",
    2.9,
    "#252039",
    "#665cff",
    "rift"
  ),
  staff(
    11,
    "eclipse-staff",
    "Eclipse Staff",
    3.1,
    "#171720",
    "#d0a4ff",
    "eclipse"
  ),
  staff(
    12,
    "heart-of-eternity",
    "Heart of Eternity",
    3.3,
    "#d2b06b",
    "#72f1ff",
    "eternity"
  ),
] as const;
export const MAGE_CONFIG = {
  damage: { baseDamage: 3, intelligenceMultiplier: 3 },
  combat: {
    range: 18,
    cooldownMs: 420,
    projectileSpeed: 20,
    autoplayRetreatDistance: 3.4,
    aoeDamageMultiplier: 1,
  },
  initialSpell: "ice-lance" as MageSpellType,
  initialStaffLevel: 1,
  spellFeedbackMs: 850,
  debug: { showMageAttackRange: false, showMageAoERadius: false },
  spells: {
    "ice-lance": { id: "ice-lance", name: "Ice Lance", icon: "❄️" },
    "lightning-lance": {
      id: "lightning-lance",
      name: "Lightning Lance",
      icon: "⚡",
    },
  },
} as const;
export const getStaff = (level: number) =>
  MAGE_STAFFS.find((item) => item.level === level) ?? MAGE_STAFFS[0]!;
export const getNextStaff = (level: number) =>
  MAGE_STAFFS.find((item) => item.level === level + 1);
export const toggleMageSpell = (spell: MageSpellType): MageSpellType =>
  spell === "ice-lance" ? "lightning-lance" : "ice-lance";
