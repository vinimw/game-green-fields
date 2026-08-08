import type { WeaponRarity as EquipmentRarity } from "./archerWeaponsConfig";
export type ArcherBootConfig = {
  level: number;
  id: string;
  name: string;
  rarity: EquipmentRarity;
  image: string;
  model: string;
  movementSpeedBonusPercent: number;
  price: number;
  placeholderColor: string;
};
const boot = (
  level: number,
  id: string,
  name: string,
  rarity: EquipmentRarity,
  price: number,
  placeholderColor: string
): ArcherBootConfig => ({
  level,
  id,
  name,
  rarity,
  image: `/assets/items/boots/${id}.png`,
  model: `/assets/models/armor/boots/${id}.glb`,
  movementSpeedBonusPercent: level * 2,
  price,
  placeholderColor,
});
export const ARCHER_BOOTS: readonly ArcherBootConfig[] = [
  boot(1, "traveler-boots", "Traveler Boots", "common", 75, "#8A6544"),
  boot(2, "scout-boots", "Scout Boots", "common", 150, "#75583E"),
  boot(3, "pathfinder-boots", "Pathfinder Boots", "common", 300, "#66523E"),
  boot(4, "ranger-boots", "Ranger Boots", "uncommon", 550, "#438358"),
  boot(5, "windrunner-boots", "Windrunner Boots", "uncommon", 900, "#4E914D"),
  boot(6, "falconstep-boots", "Falconstep Boots", "uncommon", 1500, "#6C8F43"),
  boot(7, "shadowstep-boots", "Shadowstep Boots", "rare", 2400, "#3E5790"),
  boot(8, "stormstride-boots", "Stormstride Boots", "rare", 3800, "#367D9D"),
  boot(9, "dragonhide-boots", "Dragonhide Boots", "epic", 6000, "#7D4B9F"),
  boot(10, "moonstep-boots", "Moonstep Boots", "epic", 9500, "#9B5BB7"),
  boot(11, "sunstride-boots", "Sunstride Boots", "legendary", 15000, "#D9892E"),
  boot(
    12,
    "celestial-striders",
    "Celestial Striders",
    "mythic",
    24000,
    "#C9B5FF"
  ),
] as const;
export const MAX_ARCHER_BOOTS_LEVEL = ARCHER_BOOTS.length;
export const getArcherBoots = (level: number) =>
  level === 0 ? undefined : ARCHER_BOOTS.find((boots) => boots.level === level);
export const getNextArcherBoots = (level: number) => getArcherBoots(level + 1);
