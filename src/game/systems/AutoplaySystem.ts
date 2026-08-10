import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTERS_CONFIG, type MonsterType } from "../config/monstersConfig";
import type { PlayerState, Vec2 } from "../core/types";
import { attackRange, maxHealth } from "./StatsSystem";
import { shouldAutoplayEat } from "./HungerSystem";
import { scaledMonsterDamage } from "./MonsterScalingSystem";
import { MAGE_CONFIG } from "../config/mageConfig";

export type AutoplayMonster = {
  id: string;
  type: MonsterType;
  alive: boolean;
  health: number;
  position: Vec2;
};
export type AutoplayContext = {
  darknessActive: boolean;
  darknessRemainingMs: number;
  raidActive: boolean;
  corePosition: Vec2;
  coreHealth: number;
  coreMaxHealth: number;
};
export type AutoplayAction =
  "use-potion" | "refill-lantern" | "toggle-lantern" | "eat-steak";
export type AutoplayDecision = {
  mode: "coins" | "hunt" | "attack" | "kite" | "retreat" | "defend" | "explore" | "idle";
  destination?: Vec2;
  monsterId?: string;
};
export type AutoplayPurchaseAction =
  | "buy-potion"
  | "buy-gas"
  | "repair-core";
const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);
const nearest = <T extends Vec2>(origin: Vec2, items: T[]) =>
  items.reduce<T | undefined>(
    (best, item) =>
      !best || distance(origin, item) < distance(origin, best) ? item : best,
    undefined,
  );

export class AutoplaySystem {
  private explorationTarget?: Vec2;
  private explorationAngle = 0;

  decidePurchase(
    player: PlayerState,
    monsters: AutoplayMonster[],
    context: AutoplayContext,
  ): AutoplayPurchaseAction | null {
    const shopping = GAME_CONFIG.autoplay.shopping,
      corePercent = (context.coreHealth / context.coreMaxHealth) * 100,
      bossAlive = monsters.some(
        (monster) => monster.alive && monster.type === "bear",
      ),
      potionTarget = bossAlive
        ? shopping.bossPotionTarget
        : shopping.potionTarget,
      canRepair =
        context.coreHealth < context.coreMaxHealth &&
        player.coins >= GAME_CONFIG.shop.baseHealthRepair.cost,
      canBuyPotion =
        player.healthPotions < GAME_CONFIG.shop.healthPotion.maxInventory &&
        player.coins >= GAME_CONFIG.shop.healthPotion.cost,
      needsGas =
        player.gasCanisters < shopping.gasCanisterTarget &&
        player.lanternFuel <= shopping.gasFuelThreshold,
      canBuyGas =
        needsGas &&
        player.gasCanisters < GAME_CONFIG.shop.lanternGas.maxInventory &&
        player.coins >= GAME_CONFIG.shop.lanternGas.cost;

    if (canRepair && corePercent <= shopping.coreCriticalPercent)
      return "repair-core";
    if (canBuyPotion && player.healthPotions === 0) return "buy-potion";
    if (canRepair && corePercent < shopping.coreRepairBelowPercent)
      return "repair-core";
    if (canBuyPotion && player.healthPotions < potionTarget)
      return "buy-potion";
    if (canBuyGas) return "buy-gas";
    return null;
  }

  decideActions(
    player: PlayerState,
    position: Vec2,
    monsters: AutoplayMonster[],
    context: AutoplayContext,
  ): AutoplayAction[] {
    const actions: AutoplayAction[] = [],
      maximum = maxHealth(player.stats.vitality, player.level),
      missingHealth = maximum - player.currentHealth;
    const nearby = monsters.filter(
      (monster) =>
        monster.alive &&
        distance(position, monster.position) <=
          MONSTERS_CONFIG[monster.type].detectionRadius,
    );
    const bossAlive = monsters.some(
      (monster) => monster.alive && monster.type === "bear",
    );
    const incomingDamage = nearby.reduce(
      (highest, monster) =>
        Math.max(highest, scaledMonsterDamage(monster.type, player.level)),
      0,
    );
    const dangerHealth = Math.max(
      (maximum * GAME_CONFIG.autoplay.criticalHealthPercent) / 100,
      incomingDamage * GAME_CONFIG.autoplay.potionDangerDamageMultiplier,
    );
    const bossPotionThreshold =
      (maximum * GAME_CONFIG.autoplay.bossPotionHealthPercent) / 100;
    if (
      player.healthPotions > 0 &&
      missingHealth > 0 &&
      (player.currentHealth <= dangerHealth ||
        (bossAlive && player.currentHealth <= bossPotionThreshold)) &&
      missingHealth >= Math.min(GAME_CONFIG.shop.healthPotion.healthRestore, maximum * 0.2)
    )
      actions.push("use-potion");
    if (shouldAutoplayEat(player)) actions.push("eat-steak");
    if (!context.darknessActive) {
      if (player.lanternOn) actions.push("toggle-lantern");
      return actions;
    }
    if (context.darknessRemainingMs <= 250) {
      if (player.lanternOn) actions.push("toggle-lantern");
      return actions;
    }
    const gas = GAME_CONFIG.shop.lanternGas,
      refillThreshold =
        gas.consumptionPerSecond *
        GAME_CONFIG.autoplay.lanternRefillLeadSeconds;
    let usableFuel = player.lanternFuel;
    if (usableFuel <= refillThreshold && player.gasCanisters > 0) {
      actions.push("refill-lantern");
      usableFuel = gas.tankCapacity;
    }
    if (!player.lanternOn && usableFuel > 0) actions.push("toggle-lantern");
    return actions;
  }
  decide(
    player: PlayerState,
    position: Vec2,
    monsters: AutoplayMonster[],
    coins: Vec2[],
    context?: AutoplayContext,
  ): AutoplayDecision {
    const maximum = maxHealth(player.stats.vitality, player.level),
      healthPercent = (player.currentHealth / maximum) * 100,
      critical = healthPercent <= GAME_CONFIG.autoplay.criticalHealthPercent;
    const alive = monsters.filter((monster) => monster.alive),
      boss = alive.find((monster) => monster.type === "bear"),
      closestMonster = nearest(
        position,
        alive.map((monster) => ({
          ...monster,
          x: monster.position.x,
          z: monster.position.z,
        })),
      ) as (AutoplayMonster & Vec2) | undefined;
    if (critical) {
      const threat = boss ?? closestMonster;
      if (threat) {
        const dx = position.x - threat.position.x,
          dz = position.z - threat.position.z,
          length = Math.hypot(dx, dz) || 1;
        return {
          mode: "retreat",
          destination: {
            x: position.x + (dx / length) * GAME_CONFIG.autoplay.bossRetreatStep,
            z: position.z + (dz / length) * GAME_CONFIG.autoplay.bossRetreatStep,
          },
        };
      }
      return { mode: "idle" };
    }
    if (boss) {
      const bossDistance = distance(position, boss.position),
        bossRetreatDistance = Math.min(
          GAME_CONFIG.autoplay.bossRetreatDistance,
          Math.max(
            MONSTERS_CONFIG.bear.attackRadius + 0.15,
            attackRange(player.powerType) - 0.1,
          ),
        );
      if (bossDistance <= bossRetreatDistance) {
        const dx = position.x - boss.position.x,
          dz = position.z - boss.position.z,
          length = Math.hypot(dx, dz) || 1;
        return {
          mode: "kite",
          monsterId: boss.id,
          destination: {
            x: position.x +
              (dx / length) * GAME_CONFIG.autoplay.bossRetreatStep,
            z: position.z +
              (dz / length) * GAME_CONFIG.autoplay.bossRetreatStep,
          },
        };
      }
      return bossDistance <= attackRange(player.powerType)
        ? { mode: "attack", destination: boss.position, monsterId: boss.id }
        : { mode: "hunt", destination: boss.position, monsterId: boss.id };
    }
    if (
      player.powerType === "magic" &&
      closestMonster &&
      distance(position, closestMonster.position) <=
        MAGE_CONFIG.combat.autoplayRetreatDistance
    ) {
      const dx = position.x - closestMonster.position.x,
        dz = position.z - closestMonster.position.z,
        length = Math.hypot(dx, dz) || 1;
      return {
        mode: "kite",
        monsterId: closestMonster.id,
        destination: {
          x: position.x + (dx / length) * GAME_CONFIG.autoplay.bossRetreatStep,
          z: position.z + (dz / length) * GAME_CONFIG.autoplay.bossRetreatStep,
        },
      };
    }
    if (context?.raidActive) {
      const target = alive.reduce<AutoplayMonster | undefined>(
        (best, monster) =>
          !best ||
          distance(monster.position, context.corePosition) <
            distance(best.position, context.corePosition)
            ? monster
            : best,
        undefined,
      );
      if (!target) return { mode: "defend", destination: context.corePosition };
      const targetDistance = distance(position, target.position);
      return targetDistance <= attackRange(player.powerType)
        ? { mode: "attack", destination: target.position, monsterId: target.id }
        : { mode: "hunt", destination: target.position, monsterId: target.id };
    }
    const coin = nearest(position, coins);
    if (
      coin &&
      (!closestMonster ||
        distance(position, closestMonster.position) >
          MONSTERS_CONFIG[closestMonster.type].detectionRadius * 0.75)
    )
      return { mode: "coins", destination: coin };
    const safe = alive.filter(
        (monster) =>
          player.currentHealth >
          scaledMonsterDamage(monster.type, player.level) *
            GAME_CONFIG.autoplay.safeHealthDamageMultiplier,
      ),
      target = safe.reduce<AutoplayMonster | undefined>((best, monster) => {
        if (!best) return monster;
        const score =
            distance(position, monster.position) + monster.health * 0.05,
          bestScore = distance(position, best.position) + best.health * 0.05;
        return score < bestScore ? monster : best;
      }, undefined);
    if (!target) {
      if (coin) return { mode: "coins", destination: coin };
      if (context?.darknessActive && closestMonster) {
        const dx = position.x - closestMonster.position.x,
          dz = position.z - closestMonster.position.z,
          length = Math.hypot(dx, dz) || 1;
        return {
          mode: "retreat",
          destination: {
            x: position.x + (dx / length) * GAME_CONFIG.autoplay.bossRetreatStep,
            z: position.z + (dz / length) * GAME_CONFIG.autoplay.bossRetreatStep,
          },
        };
      }
      if (context?.darknessActive)
        return {
          mode: "explore",
          destination: this.darknessExplorationDestination(position),
        };
      return { mode: "idle" };
    }
    const targetDistance = distance(position, target.position);
    if (targetDistance <= attackRange(player.powerType))
      return {
        mode: "attack",
        destination: target.position,
        monsterId: target.id,
      };
    return { mode: "hunt", destination: target.position, monsterId: target.id };
  }

  private darknessExplorationDestination(position: Vec2) {
    const config = GAME_CONFIG.autoplay;
    if (
      this.explorationTarget &&
      distance(position, this.explorationTarget) >
        config.darknessExplorationArrivalRadius
    )
      return this.explorationTarget;

    this.explorationAngle += Math.PI * (3 - Math.sqrt(5));
    const limit = GAME_CONFIG.world.size / 2 - 2,
      step = config.darknessExplorationStep;
    this.explorationTarget = {
      x: Math.max(
        -limit,
        Math.min(limit, position.x + Math.cos(this.explorationAngle) * step),
      ),
      z: Math.max(
        -limit,
        Math.min(limit, position.z + Math.sin(this.explorationAngle) * step),
      ),
    };
    return this.explorationTarget;
  }
}
