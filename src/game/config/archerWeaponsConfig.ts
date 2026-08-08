export type WeaponRarity =
  "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type ArcherWeaponConfig = {
  level: number;
  id: string;
  name: string;
  rarity: WeaponRarity;
  image: string;
  model: string;
  damageBonusPercent: number;
  price: number;
  placeholderColor: string;
};
const bow = (
  level: number,
  id: string,
  name: string,
  rarity: WeaponRarity,
  price: number,
  placeholderColor: string,
): ArcherWeaponConfig => ({
  level,
  id,
  name,
  rarity,
  image: `/assets/items/bows/${id}.png`,
  model: `/assets/models/weapons/${id}.glb`,
  damageBonusPercent: level * 2,
  price,
  placeholderColor,
});
export const ARCHER_WEAPONS: readonly ArcherWeaponConfig[] = [
  bow(1, "training-bow", "Training Bow", "common", 0, "#8B542F"),
  bow(2, "hunter-bow", "Hunter Bow", "common", 100, "#80542E"),
  bow(3, "reinforced-bow", "Reinforced Bow", "common", 250, "#6F5137"),
  bow(4, "ranger-bow", "Ranger Bow", "uncommon", 500, "#398A52"),
  bow(5, "oakheart-bow", "Oakheart Bow", "uncommon", 900, "#477B39"),
  bow(6, "falcon-bow", "Falcon Bow", "uncommon", 1500, "#6A873B"),
  bow(7, "shadowstring-bow", "Shadowstring Bow", "rare", 2500, "#385A91"),
  bow(8, "stormwood-bow", "Stormwood Bow", "rare", 4000, "#337C9F"),
  bow(9, "dragonbone-bow", "Dragonbone Bow", "epic", 6500, "#804AA8"),
  bow(10, "moonpiercer-bow", "Moonpiercer Bow", "epic", 10000, "#9A55C3"),
  bow(11, "sunfire-bow", "Sunfire Bow", "legendary", 16000, "#E58A28"),
  bow(12, "celestial-bow", "Celestial Bow", "mythic", 25000, "#D7C5FF"),
] as const;
export const MAX_ARCHER_WEAPON_LEVEL = ARCHER_WEAPONS.length;
export const getArcherWeapon = (level: number) =>
  ARCHER_WEAPONS.find((weapon) => weapon.level === level);
export const getNextArcherWeapon = (level: number) =>
  getArcherWeapon(level + 1);
