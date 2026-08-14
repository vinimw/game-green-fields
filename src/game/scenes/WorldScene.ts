import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  LinesMesh,
  Matrix,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Engine,
} from "@babylonjs/core";
import { GAME_CONFIG } from "../config/gameConfig";
import { MONSTER_SPAWN_CONFIG } from "../config/monstersConfig";
import type { PowerType, SaveData } from "../core/types";
import { createPlayerState } from "../core/GameState";
import { safeZones, spawnAreas, worldObjects } from "../world/worldData";
import { createWorldObject } from "../factories/WorldObjectFactory";
import { MonsterFactory } from "../factories/MonsterFactory";
import { Player } from "../entities/Player";
import { Monster } from "../entities/Monster";
import { GameCamera } from "../camera/GameCamera";
import { InputSystem } from "../systems/InputSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { CoinPickupSystem } from "../systems/CoinPickupSystem";
import { MeatPickupSystem } from "../systems/MeatPickupSystem";
import { SkillBookPickupSystem } from "../systems/SkillBookPickupSystem";
import { eatRawSteak } from "../systems/HungerSystem";
import {
  purchaseHealthPotion,
  useHealthPotion,
} from "../systems/HealthPotionSystem";
import { DarknessCycleSystem } from "../systems/DarknessCycleSystem";
import {
  drainLantern,
  purchaseGasCanister,
  refillLantern,
  toggleLantern,
} from "../systems/LanternSystem";
import {
  distributeAutoplayStats,
  summarizeStatAllocation,
} from "../systems/AutoplayStatsSystem";
import { BaseRaidSystem } from "../systems/BaseRaidSystem";
import { MonsterPopulationSystem } from "../systems/MonsterPopulationSystem";
import {
  SpawnPositionService,
  type SpawnObstacle,
} from "../systems/SpawnPositionService";
import { MonsterNavigationSystem } from "../systems/MonsterNavigationSystem";
import { purchaseBaseHealth } from "../systems/ShopSystem";
import {
  currentArcherWeapon,
  nextArcherWeapon,
  purchaseArcherWeapon,
} from "../systems/ArcherWeaponSystem";
import {
  currentArcherBoots,
  nextArcherBoots,
  purchaseArcherBoots,
} from "../systems/ArcherBootsSystem";
import { AutoplaySystem } from "../systems/AutoplaySystem";
import { DefenseManager } from "../defenses/DefenseManager";
import { DefensePlacementValidator } from "../defenses/DefensePlacementValidator";
import { DefensePlacementSystem } from "../defenses/DefensePlacementSystem";
import {
  purchaseMiniTower,
  purchaseTowerUpgrade,
} from "../defenses/DefensePurchaseSystem";
import { AutoplayTowerUpgradeSystem } from "../defenses/AutoplayTowerUpgradeSystem";
import {
  DEFENSE_CONFIG,
  getNextDefenseCost,
  getTowerDamage,
  getTowerUpgradeCost,
  getTowerRemovalRefund,
  getTowerTotalInvestment,
} from "../config/defenseConfig";
import type { TowerUpgradeView } from "../ui/TowerUpgradePanel";
import { HORROR_THEME_CONFIG } from "../config/horrorThemeConfig";
import type { Hud } from "../ui/Hud";
import {
  movementSpeed,
  movementSpeedBonuses,
  powerDamage,
  attackRange,
} from "../systems/StatsSystem";
import { grantTowerKillExperience } from "../defenses/TowerRewardSystem";
import { BossSpawnSystem } from "../systems/BossSpawnSystem";
import { consumePlayerLife } from "../systems/PlayerLivesSystem";
import { LifeLossJumpscare } from "../ui/LifeLossJumpscare";
import type { GameAudioSystem } from "../systems/GameAudioSystem";
import { StarvationSystem } from "../systems/StarvationSystem";
import { MageCombatSystem } from "../systems/MageCombatSystem";
import {
  currentMageStaff,
  nextMageStaff,
  purchaseMageStaff,
} from "../systems/MageStaffSystem";
import { getStaff, MAGE_CONFIG, toggleMageSpell } from "../config/mageConfig";
import { scaledMonsterDamage } from "../systems/MonsterScalingSystem";
import {
  ARCHER_ABILITIES,
  type ArcherAbilityType,
} from "../config/archerAbilitiesConfig";
import { RangedAimSystem } from "../systems/RangedAimSystem";
import type { GroundPosition } from "../systems/RangedHitResolver";

export class WorldScene {
  scene: Scene;
  player: Player;
  monsters: Monster[];
  camera: GameCamera;
  input = new InputSystem();
  combat: CombatSystem;
  mageCombat: MageCombatSystem;
  private rangedAim: RangedAimSystem;
  paused = false;
  private obstacles: SpawnObstacle[] = [];
  private staticObstacleCount = 0;
  private debug: HTMLElement;
  private fpsTick = 0;
  private population: MonsterPopulationSystem;
  private coinPickups: CoinPickupSystem;
  private meatPickups: MeatPickupSystem;
  private skillBookPickups: SkillBookPickupSystem;
  private baseRaid: BaseRaidSystem;
  private coreMaterial: StandardMaterial;
  private playerLight?: PointLight;
  private gameOverTriggered = false;
  private lifeLossTransition = false;
  private lifeLossJumpscare: LifeLossJumpscare;
  private arrows: {
    root: TransformNode;
    start: Vector3;
    end: Vector3;
    elapsed: number;
    duration: number;
    impactPosition: GroundPosition;
    resolveImpact: boolean;
    areaRadius: number;
    damageMultiplier: number;
    ability: ArcherAbilityType;
  }[] = [];
  private navigation: MonsterNavigationSystem;
  private autoplay = new AutoplaySystem();
  private bossSpawn = new BossSpawnSystem();
  private bossWarning: HTMLElement;
  private autoplayTowerUpgrades = new AutoplayTowerUpgradeSystem();
  private autoplayEnabled = false;
  private autoplayLastPosition?: { x: number; z: number };
  private autoplayStuckMs = 0;
  private autoplayRecoveryMs = 0;
  private autoplayRecoveryDirection = { x: 0, z: 0 };
  private autoplayPurchaseCooldownMs = 0;
  private darkness = new DarknessCycleSystem();
  private starvation = new StarvationSystem();
  private ground: Mesh;
  private defenses: DefenseManager;
  private placement: DefensePlacementSystem;
  private defenseValidator: DefensePlacementValidator;
  private placementStatus: (text: string, valid: boolean) => void = () => {};
  private placementResult: (result: {
    success: boolean;
    message: string;
  }) => void = () => {};
  private towerSelection: (id: string | null) => void = () => {};
  constructor(
    engine: Engine,
    private ui: HTMLElement,
    private hud: Hud,
    private audio: GameAudioSystem,
    save: SaveData | null,
    powerType?: PowerType,
    private onGameOver: () => void = () => {},
    private onPlayerGameOver: () => void = () => {},
  ) {
    const theme = HORROR_THEME_CONFIG;
    this.scene = new Scene(engine);
    this.bossWarning = document.createElement("div");
    this.bossWarning.className = "boss-warning";
    this.ui.append(this.bossWarning);
    this.lifeLossJumpscare = new LifeLossJumpscare(this.ui, this.audio);
    this.scene.clearColor = Color4.FromColor3(
      Color3.FromHexString(theme.environment.sky),
      1,
    );
    this.scene.ambientColor = Color3.FromHexString(theme.fog.color);
    if (theme.fog.enabled) {
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = theme.fog.density;
      this.scene.fogColor = Color3.FromHexString(theme.fog.color);
    }
    const ambient = new HemisphericLight(
      "cold-ambient",
      new Vector3(0, 1, 0),
      this.scene,
    );
    ambient.intensity = theme.lighting.ambientIntensity;
    ambient.diffuse = Color3.FromHexString(theme.lighting.moonColor);
    const sun = new DirectionalLight(
      "moon",
      new Vector3(-1, -2, -1),
      this.scene,
    );
    sun.position = new Vector3(15, 25, 15);
    sun.intensity = theme.lighting.moonIntensity;
    sun.diffuse = Color3.FromHexString(theme.lighting.moonColor);
    const shadow = new ShadowGenerator(1024, sun);
    shadow.useBlurExponentialShadowMap = true;
    shadow.blurKernel = 16;
    shadow.darkness = theme.lighting.shadowDarkness;
    this.ground = MeshBuilder.CreateGround(
      "forsaken-ground",
      {
        width: GAME_CONFIG.world.size,
        height: GAME_CONFIG.world.size,
        subdivisions: 2,
      },
      this.scene,
    );
    const gm = new StandardMaterial("dark-mud-grass", this.scene);
    gm.diffuseColor = Color3.FromHexString(theme.environment.ground);
    gm.specularColor = Color3.Black();
    this.ground.material = gm;
    this.ground.receiveShadows = true;
    this.baseRaid = new BaseRaidSystem(
      save?.world.base,
      save?.player.level ?? GAME_CONFIG.player.initialLevel,
    );
    this.coreMaterial = new StandardMaterial("beacon-fire", this.scene);
    this.coreMaterial.diffuseColor = Color3.FromHexString(
      theme.environment.warmFire,
    );
    this.coreMaterial.emissiveColor = Color3.FromHexString(
      theme.environment.warmFire,
    );
    const core = MeshBuilder.CreateSphere(
      "the-beacon",
      { diameter: 1.15, segments: 12 },
      this.scene,
    );
    core.position.set(this.baseRaid.position.x, 0.75, this.baseRaid.position.z);
    core.scaling.y = 1.35;
    core.material = this.coreMaterial;
    const coreLight = new PointLight(
      "beacon-light",
      new Vector3(this.baseRaid.position.x, 2, this.baseRaid.position.z),
      this.scene,
    );
    coreLight.diffuse = Color3.FromHexString(theme.coreLight.color);
    coreLight.intensity = theme.coreLight.intensity;
    coreLight.range = theme.coreLight.radius;
    for (const object of worldObjects) {
      const meshes = createWorldObject(this.scene, object);
      meshes.forEach((mesh) => shadow.addShadowCaster(mesh));
      if (["tree", "rock", "fence", "crate", "ruin"].includes(object.type))
        this.obstacles.push({
          x: object.position.x,
          z: object.position.z,
          radius:
            object.type === "tree" ? 1.05 : object.type === "ruin" ? 1.7 : 0.8,
        });
    }
    this.staticObstacleCount = this.obstacles.length;
    this.navigation = new MonsterNavigationSystem(
      GAME_CONFIG.world.size,
      this.obstacles,
    );
    const navigation = this.navigation,
      state = save?.player ?? createPlayerState(powerType);
    this.player = new Player(this.scene, state);
    if (
      import.meta.env.DEV &&
      MAGE_CONFIG.debug.showMageAttackRange &&
      state.powerType === "magic"
    ) {
      const points = Array.from({ length: 49 }, (_, index) => {
          const angle = (index / 48) * Math.PI * 2;
          return new Vector3(
            Math.cos(angle) * MAGE_CONFIG.combat.range,
            0.04,
            Math.sin(angle) * MAGE_CONFIG.combat.range,
          );
        }),
        range = MeshBuilder.CreateLines(
          "mage-attack-range",
          { points },
          this.scene,
        ) as LinesMesh;
      range.color = Color3.FromHexString("#65dff5");
      range.parent = this.player.root;
    }
    this.player.root
      .getChildMeshes()
      .forEach((mesh) => shadow.addShadowCaster(mesh));
    if (theme.playerLight.enabled) {
      this.playerLight = new PointLight(
        "player-lantern",
        new Vector3(0, 2, 0),
        this.scene,
      );
      this.playerLight.parent = this.player.root;
      this.playerLight.diffuse = Color3.FromHexString(theme.playerLight.color);
      this.playerLight.intensity = theme.playerLight.intensity;
      this.playerLight.range = theme.playerLight.radius;
      this.playerLight.setEnabled(this.player.state.lanternOn);
    }
    const savedStates = (save?.world.monsters ?? []).filter(
      (monster) => monster.alive,
    );
    this.monsters = savedStates.map(
      (monster) => new Monster(this.scene, monster),
    );
    this.monsters.forEach((monster) => {
      monster.setNavigation(navigation);
      monster.meshes.forEach((mesh) => shadow.addShadowCaster(mesh));
    });
    const factory = new MonsterFactory(
      this.scene,
      GAME_CONFIG.mapId,
      () => this.player.state.level,
    );
    const positions = new SpawnPositionService(
      spawnAreas,
      safeZones,
      this.obstacles,
      {
        minDistanceFromPlayer: MONSTER_SPAWN_CONFIG.minDistanceFromPlayer,
        maxAttempts: MONSTER_SPAWN_CONFIG.maxSpawnAttempts,
        obstacleClearance: MONSTER_SPAWN_CONFIG.obstacleClearance,
      },
    );
    const createMonster = (
      type: Parameters<MonsterFactory["create"]>[0],
      position: Parameters<MonsterFactory["create"]>[1],
    ) => {
      const monster = factory.create(type, position);
      monster.setNavigation(navigation);
      monster.meshes.forEach((mesh) => shadow.addShadowCaster(mesh));
      return monster;
    };
    this.population = new MonsterPopulationSystem(
      this.monsters,
      positions,
      createMonster,
      () => ({
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      }),
      save?.world.pendingRespawns ?? [],
    );
    this.population.setPlayerLevelProvider(() => this.player.state.level);
    if (!save) this.population.initialize();
    this.camera = new GameCamera(this.scene, engine);
    this.rangedAim = new RangedAimSystem(
      this.scene,
      this.ground,
      () => this.player.root.position,
      () => attackRange(this.player.state.powerType),
      () =>
        this.player.state.powerType === "magic"
          ? (getStaff(this.player.state.staffLevel).aoeRadius ||
              MAGE_CONFIG.combat.singleTargetHitRadius) *
            (this.player.state.selectedMageAbility === "frost-meteor"
              ? MAGE_CONFIG.abilities["frost-meteor"].impactRadiusMultiplier
              : 1)
          : this.player.state.powerType === "archer" &&
              this.player.state.selectedArcherAbility === "arrow-rain"
            ? ARCHER_ABILITIES["arrow-rain"].areaRadius
            : GAME_CONFIG.rangedCombat.archer.hitRadius,
    );
    this.coinPickups = new CoinPickupSystem(
      this.scene,
      this.player.state,
      () => ({
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      }),
      (amount) => this.hud.toast(`+${amount} coins`),
    );
    this.meatPickups = new MeatPickupSystem(
      this.scene,
      this.player.state,
      () => ({
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      }),
      (amount) => this.hud.toast(`🥩 +${amount} Raw Beef`),
    );
    this.skillBookPickups = new SkillBookPickupSystem(
      this.scene,
      this.player.state,
      () => ({
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      }),
      (name) =>
        this.hud.toast(
          `📘 ${name} Skill Book collected · Open backpack with M`,
        ),
    );
    const handleMonsterKilled = (monster: Monster) => {
      if (monster.state.type !== "bear")
        this.population.onMonsterKilled(monster.state.type);
      this.coinPickups.tryDrop(monster.state.type, {
        x: monster.root.position.x,
        z: monster.root.position.z,
      });
      this.meatPickups.tryDrop(monster.state.type, {
        x: monster.root.position.x,
        z: monster.root.position.z,
      });
      this.skillBookPickups.tryDrop(monster.state.type, {
        x: monster.root.position.x,
        z: monster.root.position.z,
      });
    };
    const handleLevelUp = () => {
      this.player.playLevelUpEffect();
      const strongestThreat = Math.max(
          0,
          ...this.monsters
            .filter((monster) => monster.state.alive)
            .map((monster) =>
              scaledMonsterDamage(monster.state.type, this.player.state.level),
            ),
        ),
        allocated = this.autoplayEnabled
          ? distributeAutoplayStats(this.player.state, strongestThreat)
          : [],
        summary = summarizeStatAllocation(allocated);
      this.hud.toast(
        `Level ${this.player.state.level}! HP restored${summary ? ` · Auto: ${summary}` : ""}`,
      );
    };
    this.combat = new CombatSystem(
      this.player,
      () => this.monsters,
      (text, x, z, critical) => this.damageText(text, x, z, critical),
      handleMonsterKilled,
      handleLevelUp,
      (position, targets) =>
        this.rangedAim.recordImpact(
          position,
          targets.length
            ? `${targets.length} target${targets.length === 1 ? "" : "s"}`
            : "MISS",
        ),
    );
    this.mageCombat = new MageCombatSystem(
      this.scene,
      this.player,
      () => this.monsters,
      (text, x, z, critical) => this.damageText(text, x, z, critical),
      handleMonsterKilled,
      handleLevelUp,
      (position, targets) =>
        this.rangedAim.recordImpact(
          position,
          targets.length
            ? `${targets.length} target${targets.length === 1 ? "" : "s"}`
            : "MISS",
        ),
    );
    this.defenses = new DefenseManager(
      this.scene,
      save?.world.defenses ?? [],
      (monster) => {
        const levelsGained = grantTowerKillExperience(this.player.state);
        if (levelsGained > 0) handleLevelUp();
        handleMonsterKilled(monster);
      },
      () => {
        this.hud.toast("A Mini Tower was destroyed");
        this.syncTowerObstacles();
      },
      (damage, x, z) => this.damageText(`${damage}`, x, z, false, "tower"),
    );
    this.syncTowerObstacles();
    this.defenseValidator = new DefensePlacementValidator(
      this.baseRaid.position,
      GAME_CONFIG.world.size,
      this.obstacles,
    );
    this.placement = new DefensePlacementSystem(
      this.scene,
      this.ground,
      this.defenseValidator,
      () => this.defenses.states,
      (validation) =>
        this.placementStatus(
          `${validation.reason} · Core ${validation.distanceToCore.toFixed(1)} · Nearest Defense ${validation.nearestDefenseDistance?.toFixed(1) ?? "—"}`,
          validation.valid,
        ),
    );
    this.scene.onPointerMove = () => {
      if (!this.paused && !this.placement.active)
        this.rangedAim.updateFromPointer();
    };
    this.scene.onPointerDown = (_, pick) => {
      if (this.paused || !pick?.pickedMesh) return;
      if (this.placement.active) {
        this.placement.update();
        this.placementResult(this.confirmMiniTowerBuild());
        return;
      }
      const tower = this.defenses.findByMesh(pick.pickedMesh);
      if (tower) {
        this.towerSelection(tower.state.id);
        return;
      }
      this.towerSelection(null);
      const aim = this.rangedAim.updateFromPointer();
      if (aim?.valid) this.attackPlayerPosition(aim.position);
    };
    this.debug = document.createElement("pre");
    this.debug.className = "debug";
    if (GAME_CONFIG.debug) this.ui.append(this.debug);
    if (import.meta.env.DEV && MONSTER_SPAWN_CONFIG.debug.showSpawnAreas)
      this.drawSpawnAreas();
  }
  update(dt: number) {
    this.rangedAim.setVisible(!this.paused && !this.placement.active);
    const potionRequested = this.input.consumePotionRequest(),
      lanternToggleRequested = this.input.consumeLanternToggleRequest(),
      lanternRefillRequested = this.input.consumeLanternRefillRequest(),
      steakRequested = this.input.consumeSteakRequest();
    if (!this.paused) {
      this.autoplayPurchaseCooldownMs = Math.max(
        0,
        this.autoplayPurchaseCooldownMs - dt * 1000,
      );
      if (potionRequested) this.useHealthPotion();
      if (lanternToggleRequested) this.toggleLantern();
      if (lanternRefillRequested) this.refillLantern();
      if (steakRequested) this.eatRawSteak();
      const starvationDamage = this.starvation.update(
        this.player.state.hunger,
        dt,
      );
      if (starvationDamage > 0) this.damagePlayer(starvationDamage);
      if (drainLantern(this.player.state, dt))
        this.hud.toast("Lantern ran out of gas");
      const darknessTransition = this.darkness.update(dt * 1000);
      if (darknessTransition === "started")
        this.hud.toast("🌑 Darkness! Your lantern is your only light");
      if (darknessTransition === "ended")
        this.hud.toast("The darkness has passed");
      this.applyDarknessVisual();
      this.baseRaid.syncPlayerLevel(this.player.state.level);
      this.placement.update();
      this.rangedAim.setVisible(!this.placement.active);
      const direction = this.placement.active
        ? { x: 0, z: 0 }
        : this.autoplayEnabled
          ? this.autoplayDirection(dt)
          : this.input.direction();
      this.player.update(direction, dt, (x, z) => this.blocked(x, z));
      this.combat.update(dt);
      this.mageCombat.update(dt);
      const transition = this.baseRaid.update(dt * 1000);
      if (transition === "started")
        this.hud.toast("⚠ Monsters are attacking the base!");
      if (transition === "ended") {
        this.hud.toast("Raid ended");
        this.monsters.forEach((monster) => monster.returnHome());
      }
      const bossTransition = this.bossSpawn.update(
        dt * 1000,
        this.population.aliveByType("bear") > 0,
      );
      this.bossWarning.classList.toggle("active", this.bossSpawn.warningActive);
      if (bossTransition === "warning")
        this.hud.toast("⚠ A powerful presence is approaching...");
      if (bossTransition === "spawn") {
        this.population.spawn("bear");
        this.hud.toast("🐻 THE BEAR BOSS HAS ARRIVED!");
      }
      const defenseTargets = this.defenses.targets();
      this.monsters.forEach((monster) =>
        monster.update(
          this.player,
          dt,
          (damage) => this.damagePlayer(damage),
          false,
          {
            active:
              this.baseRaid.state.raidActive &&
              this.baseRaid.state.currentHealth > 0,
            position: this.baseRaid.position,
            damageBase: (damage) => this.damageBase(damage),
          },
          defenseTargets,
          this.darkness.isDark,
        ),
      );
      this.defenses.update(dt, this.monsters, !this.darkness.isDark);
      this.population.update(dt * 1000);
      this.coinPickups.update(dt);
      this.meatPickups.update(dt);
      this.skillBookPickups.update(dt);
      this.updateArrowShots(dt);
    }
    this.monsters.forEach((monster) => monster.animateDeath(dt));
    this.camera.follow(this.player.root);
    this.hud.update(this.player.state);
    this.hud.updateBase(this.baseRaid.state, this.baseRaid.maxHealth);
    this.updateDebug(dt);
  }
  setAutoplay(enabled: boolean) {
    this.autoplayEnabled = enabled;
    if (!enabled) this.navigation.clear("autoplay-player");
    this.autoplayLastPosition = undefined;
    this.autoplayStuckMs = 0;
    this.autoplayRecoveryMs = 0;
    this.hud.toast(`Autoplay ${enabled ? "enabled" : "disabled"}`);
  }
  addCheatCoins(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.player.state.coins += amount;
    this.hud.toast(`Cheat activated: +${amount.toLocaleString()} Coins`);
  }
  private autoplayDirection(dt: number) {
    const position = {
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      },
      visibleMonsters = this.monsters.filter(
        (monster) =>
          monster.isTargetable &&
          (monster.state.type === "bear" || this.canPlayerSee(monster)),
      ),
      visiblePickups = [
        ...this.coinPickups.positions(),
        ...this.meatPickups.positions(),
        ...this.skillBookPickups.positions(),
      ].filter(
        (coin) =>
          !this.darkness.isDark ||
          (this.player.state.lanternOn &&
            Math.hypot(coin.x - position.x, coin.z - position.z) <=
              HORROR_THEME_CONFIG.playerLight.radius),
      ),
      context = this.autoplayContext(),
      decision = this.autoplay.decide(
        this.player.state,
        position,
        visibleMonsters.map((monster) => ({
          id: monster.state.id,
          type: monster.state.type,
          alive: monster.state.alive,
          health: monster.state.health,
          position: { x: monster.root.position.x, z: monster.root.position.z },
        })),
        visiblePickups,
        context,
      );
    if (decision.mode === "attack" && decision.monsterId) {
      const target = visibleMonsters.find(
        (monster) => monster.state.id === decision.monsterId,
      );
      if (target) this.attackPlayerPosition(target.root.position);
      return this.resolveAutoplayMovement({ x: 0, z: 0 }, dt);
    }
    if (decision.mode === "kite" && decision.monsterId) {
      const target = visibleMonsters.find(
        (monster) => monster.state.id === decision.monsterId,
      );
      if (target) this.attackPlayerPosition(target.root.position);
    }
    if (!decision.destination)
      return this.resolveAutoplayMovement({ x: 0, z: 0 }, dt);
    const waypoint =
        this.navigation.getNextWaypoint(
          "autoplay-player",
          position,
          decision.destination,
        ) ?? decision.destination,
      dx = waypoint.x - position.x,
      dz = waypoint.z - position.z,
      length = Math.hypot(dx, dz);
    return this.resolveAutoplayMovement(
      length > 0.08 ? { x: dx / length, z: dz / length } : { x: 0, z: 0 },
      dt,
    );
  }
  private resolveAutoplayMovement(
    direction: { x: number; z: number },
    dt: number,
  ) {
    const position = {
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      },
      moving = Math.hypot(direction.x, direction.z) > 0.05,
      displacement = this.autoplayLastPosition
        ? Math.hypot(
            position.x - this.autoplayLastPosition.x,
            position.z - this.autoplayLastPosition.z,
          )
        : Number.POSITIVE_INFINITY;
    this.autoplayLastPosition = position;
    if (!moving) {
      this.autoplayStuckMs = 0;
      this.autoplayRecoveryMs = 0;
      return direction;
    }
    if (this.autoplayRecoveryMs > 0) {
      this.autoplayRecoveryMs = Math.max(
        0,
        this.autoplayRecoveryMs - dt * 1000,
      );
      return this.autoplayRecoveryDirection;
    }
    this.autoplayStuckMs =
      displacement < 0.015 ? this.autoplayStuckMs + dt * 1000 : 0;
    if (this.autoplayStuckMs < 650) return direction;
    this.navigation.clear("autoplay-player");
    const candidates = [
      { x: -direction.z, z: direction.x },
      { x: direction.z, z: -direction.x },
      { x: -direction.x, z: -direction.z },
    ];
    this.autoplayRecoveryDirection =
      candidates.find(
        (candidate) =>
          !this.blocked(
            position.x + candidate.x * 1.1,
            position.z + candidate.z * 1.1,
          ),
      ) ?? candidates[2]!;
    this.autoplayStuckMs = 0;
    this.autoplayRecoveryMs = 850;
    this.hud.toast("Autoplay: recalculating route");
    return this.autoplayRecoveryDirection;
  }
  private canPlayerSee(monster: Monster) {
    return (
      !this.darkness.isDark ||
      (this.player.state.lanternOn &&
        Math.hypot(
          monster.root.position.x - this.player.root.position.x,
          monster.root.position.z - this.player.root.position.z,
        ) <= HORROR_THEME_CONFIG.playerLight.radius)
    );
  }
  private applyDarknessVisual() {
    if (this.autoplayEnabled) this.applyAutoplaySupport();
    const theme = HORROR_THEME_CONFIG,
      dark = this.darkness.isDark;
    this.scene.clearColor = Color4.FromColor3(
      Color3.FromHexString(dark ? theme.darkness.sky : theme.environment.sky),
      1,
    );
    this.scene.ambientColor = Color3.FromHexString(
      dark ? "#000000" : theme.fog.color,
    );
    if (theme.fog.enabled) {
      this.scene.fogDensity = dark
        ? theme.darkness.fogDensity
        : theme.fog.density;
      this.scene.fogColor = Color3.FromHexString(
        dark ? "#000000" : theme.fog.color,
      );
    }
    this.scene.lights.forEach((light) =>
      light.setEnabled(
        light.name === "player-lantern" ? this.player.state.lanternOn : !dark,
      ),
    );
    this.updateCoreLight();
  }
  private autoplayContext() {
    return {
      darknessActive: this.darkness.isDark,
      darknessRemainingMs: this.darkness.remainingMs,
      raidActive: this.baseRaid.state.raidActive,
      corePosition: this.baseRaid.position,
      coreHealth: this.baseRaid.state.currentHealth,
      coreMaxHealth: this.baseRaid.maxHealth,
    };
  }
  private applyAutoplaySupport() {
    const position = {
        x: this.player.root.position.x,
        z: this.player.root.position.z,
      },
      monsters = this.monsters
        .filter((monster) => monster.state.alive)
        .map((monster) => ({
          id: monster.state.id,
          type: monster.state.type,
          alive: true,
          health: monster.state.health,
          position: { x: monster.root.position.x, z: monster.root.position.z },
        }));
    for (const action of this.autoplay.decideActions(
      this.player.state,
      position,
      monsters,
      this.autoplayContext(),
    )) {
      const result =
        action === "use-potion"
          ? useHealthPotion(this.player.state)
          : action === "eat-steak"
            ? eatRawSteak(this.player.state)
            : action === "refill-lantern"
              ? refillLantern(this.player.state)
              : toggleLantern(this.player.state);
      if (result.success) this.hud.toast(`Autoplay: ${result.message}`);
    }
    if (this.autoplayPurchaseCooldownMs > 0) return;
    const purchase = this.autoplay.decidePurchase(
      this.player.state,
      monsters,
      this.autoplayContext(),
    );
    if (!purchase) return;
    if (purchase === "buy-potion") {
      const result = purchaseHealthPotion(this.player.state);
      if (result.success) {
        this.autoplayPurchaseCooldownMs =
          GAME_CONFIG.autoplay.shopping.purchaseCooldownMs;
        this.hud.toast(`Autoplay: ${result.message}`);
      }
      return;
    }
    if (purchase === "buy-gas") {
      const result = purchaseGasCanister(this.player.state);
      if (result.success) {
        this.autoplayPurchaseCooldownMs =
          GAME_CONFIG.autoplay.shopping.purchaseCooldownMs;
        this.hud.toast(`Autoplay: ${result.message}`);
      }
      return;
    }
    const repair = GAME_CONFIG.shop.baseHealthRepair,
      result = purchaseBaseHealth(
        this.player.state.coins,
        this.baseRaid.state.currentHealth,
        this.baseRaid.maxHealth,
        repair.cost,
        repair.healthRestore,
      );
    if (result.success) {
      this.player.state.coins = result.coins;
      this.baseRaid.state.currentHealth = result.baseHealth;
      this.autoplayPurchaseCooldownMs =
        GAME_CONFIG.autoplay.shopping.purchaseCooldownMs;
      this.updateCoreLight();
      this.hud.toast(`Autoplay: ${result.message}`);
    }
  }
  private updateCoreLight() {
    if (this.darkness.isDark) {
      this.coreMaterial.emissiveColor = Color3.Black();
      return;
    }
    const ratio = this.baseRaid.state.currentHealth / this.baseRaid.maxHealth;
    this.coreMaterial.emissiveColor = new Color3(
      0.9 * ratio,
      0.25 * ratio,
      0.05,
    );
  }
  private blocked(x: number, z: number) {
    const limit = GAME_CONFIG.world.size / 2 - 0.5;
    return (
      Math.abs(x) > limit ||
      Math.abs(z) > limit ||
      this.obstacles.some(
        (obstacle) =>
          Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius,
      )
    );
  }
  private syncTowerObstacles() {
    this.obstacles.splice(this.staticObstacleCount);
    this.obstacles.push(
      ...this.defenses.states.map((defense) => ({
        x: defense.position.x,
        z: defense.position.z,
        radius: DEFENSE_CONFIG.placement.footprintRadius,
      })),
    );
    this.navigation.invalidateAll();
  }
  private damagePlayer(damage: number) {
    if (this.gameOverTriggered || this.lifeLossTransition) return;
    this.player.state.currentHealth = Math.max(
      0,
      this.player.state.currentHealth - damage,
    );
    this.player.flashDamage();
    this.hud.toast(`-${damage} HP`);
    if (this.player.state.currentHealth === 0) {
      const lifeLoss = consumePlayerLife(this.player.state);
      this.lifeLossTransition = true;
      this.paused = true;
      this.bossWarning.classList.remove("active");
      this.lifeLossJumpscare.play(() => {
        this.lifeLossTransition = false;
        if (lifeLoss.gameOver) {
          this.gameOverTriggered = true;
          this.onPlayerGameOver();
          return;
        }
        this.player.root.position.set(0, 0, 2);
        this.navigation.clear("autoplay-player");
        this.paused = false;
        this.hud.toast(
          `You lost a life · ${lifeLoss.livesRemaining} remaining`,
        );
      });
    }
  }
  private damageBase(damage: number) {
    const applied = this.baseRaid.damage(damage);
    if (applied === 0) return;
    this.updateCoreLight();
    if (this.baseRaid.state.currentHealth === 0 && !this.gameOverTriggered) {
      this.gameOverTriggered = true;
      this.paused = true;
      this.onGameOver();
    }
  }
  private damageText(
    text: string,
    x: number,
    z: number,
    critical: boolean,
    source: "player" | "tower" = "player",
  ) {
    const position = Vector3.Project(
      new Vector3(x, 1.5, z),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.scene.activeCamera!.viewport.toGlobal(
        this.scene.getEngine().getRenderWidth(),
        this.scene.getEngine().getRenderHeight(),
      ),
    );
    const element = document.createElement("b");
    element.className = `damage ${source === "tower" ? "tower-damage" : ""} ${critical ? "critical" : ""}`;
    element.textContent = critical ? `${text} CRIT!` : text;
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    this.ui.append(element);
    setTimeout(() => element.remove(), 700);
  }
  private showArrowShot(
    targetPosition: GroundPosition,
    visualPosition: GroundPosition = targetPosition,
    resolveImpact = true,
    areaRadius = 0,
    damageMultiplier = 1,
    fromSky = false,
    ability: ArcherAbilityType = this.player.state.selectedArcherAbility,
  ) {
    if (!fromSky) {
      this.player.playArcherAttack();
      this.audio.playBowShot();
    }
    const start = fromSky
        ? new Vector3(visualPosition.x, 9 + Math.random() * 2, visualPosition.z)
        : new Vector3(
            this.player.root.position.x,
            1.4,
            this.player.root.position.z,
          ),
      end = new Vector3(visualPosition.x, 0.12, visualPosition.z),
      direction = end.subtract(start),
      distance = direction.length(),
      root = new TransformNode("flying-arrow", this.scene),
      wood = new StandardMaterial("flying-arrow-wood", this.scene),
      metal = new StandardMaterial("flying-arrow-metal", this.scene);
    wood.diffuseColor = Color3.FromHexString("#D6A45C");
    metal.diffuseColor = Color3.FromHexString("#DCE7EA");
    const shaft = MeshBuilder.CreateCylinder(
      "arrow-shaft",
      { height: 1.15, diameter: 0.045, tessellation: 6 },
      this.scene,
    );
    shaft.parent = root;
    shaft.rotation.x = Math.PI / 2;
    shaft.material = wood;
    const head = MeshBuilder.CreateCylinder(
      "arrow-head",
      { height: 0.22, diameterTop: 0, diameterBottom: 0.16, tessellation: 6 },
      this.scene,
    );
    head.parent = root;
    head.position.z = 0.68;
    head.rotation.x = Math.PI / 2;
    head.material = metal;
    root.position.copyFrom(start);
    root.rotation.y = Math.atan2(direction.x, direction.z);
    this.arrows.push({
      root,
      start,
      end,
      elapsed: 0,
      duration: Math.max(
        0.12,
        distance / GAME_CONFIG.player.attack.arrowProjectileSpeed,
      ),
      impactPosition: { x: targetPosition.x, z: targetPosition.z },
      resolveImpact,
      areaRadius,
      damageMultiplier,
      ability,
    });
  }
  private showArrowRain(targetPosition: GroundPosition) {
    this.player.playArcherAttack();
    this.audio.playBowShot();
    const config = ARCHER_ABILITIES["arrow-rain"];
    for (let index = 0; index < config.arrowCount; index++) {
      const angle = (index / config.arrowCount) * Math.PI * 2,
        radius =
          index === 0 ? 0 : config.areaRadius * (0.25 + (index % 3) * 0.25),
        visual = {
          x: targetPosition.x + Math.cos(angle) * radius,
          z: targetPosition.z + Math.sin(angle) * radius,
        };
      this.showArrowShot(
        targetPosition,
        visual,
        index === 0,
        config.areaRadius,
        config.damageMultiplier,
        true,
      );
    }
  }
  private attackPlayerPosition(targetPosition: GroundPosition) {
    if (this.player.state.powerType === "magic")
      return this.mageCombat.cast(targetPosition);
    const attacked = this.combat.attackPosition(targetPosition);
    if (attacked && this.player.state.powerType === "archer")
      this.player.state.selectedArcherAbility === "arrow-rain"
        ? this.showArrowRain(targetPosition)
        : this.showArrowShot(targetPosition);
    else if (attacked) this.combat.resolveImpact(targetPosition);
    return attacked;
  }
  castMageAtAim() {
    if (this.player.state.powerType !== "magic" || this.paused) return false;
    const targetPosition = this.rangedAim.targetPosition();
    if (!targetPosition) {
      this.hud.toast("Aim at a valid ground position");
      return false;
    }
    if (!this.attackPlayerPosition(targetPosition)) return false;
    return true;
  }
  toggleMageSpell() {
    if (this.player.state.powerType !== "magic") return;
    this.player.state.selectedSpell = toggleMageSpell(
      this.player.state.selectedSpell,
    );
    const spell = MAGE_CONFIG.spells[this.player.state.selectedSpell];
    this.hud.toast(spell.name.toUpperCase(), MAGE_CONFIG.spellFeedbackMs);
  }
  private updateArrowShots(dt: number) {
    for (let index = this.arrows.length - 1; index >= 0; index--) {
      const arrow = this.arrows[index];
      if (!arrow) continue;
      arrow.elapsed += dt;
      const progress = Math.min(1, arrow.elapsed / arrow.duration),
        arc = Math.sin(progress * Math.PI) * 0.45;
      Vector3.LerpToRef(arrow.start, arrow.end, progress, arrow.root.position);
      arrow.root.position.y += arc;
      if (progress >= 1) {
        const ricochet = arrow.ability === "ricochet-arrow",
          config = ARCHER_ABILITIES["ricochet-arrow"],
          targets = arrow.resolveImpact
            ? ricochet
              ? this.combat.resolveRicochetImpact(
                  arrow.impactPosition,
                  config.maxRicochetRange,
                  config.maxBounces,
                  config.damageMultiplier,
                )
              : this.combat.resolveImpact(
                  arrow.impactPosition,
                  arrow.areaRadius,
                  arrow.damageMultiplier,
                )
            : [];
        if (ricochet && targets.length > 1)
          this.createRicochetEffect(
            targets.map((target) => ({
              x: target.root.position.x,
              z: target.root.position.z,
            })),
            config.bounceDelayMs,
          );
        this.createArrowImpact(
          { x: arrow.end.x, z: arrow.end.z },
          !arrow.resolveImpact || targets.length > 0,
        );
        arrow.root.dispose(false, true);
        this.arrows.splice(index, 1);
      }
    }
  }
  private createRicochetEffect(positions: GroundPosition[], delayMs: number) {
    for (let index = 1; index < positions.length; index++) {
      const from = positions[index - 1],
        to = positions[index];
      if (!from || !to) continue;
      setTimeout(
        () => {
          const line = MeshBuilder.CreateLines(
            "ricochet-arrow-trail",
            {
              points: [
                new Vector3(from.x, 1.1, from.z),
                new Vector3((from.x + to.x) / 2, 1.55, (from.z + to.z) / 2),
                new Vector3(to.x, 1.1, to.z),
              ],
            },
            this.scene,
          ) as LinesMesh;
          line.color = Color3.FromHexString("#FFE28A");
          line.isPickable = false;
          this.createArrowImpact(to, true);
          setTimeout(() => line.dispose(false, true), 140);
        },
        (index - 1) * delayMs,
      );
    }
  }
  private createArrowImpact(position: GroundPosition, hit: boolean) {
    const points = Array.from({ length: 17 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return new Vector3(
          position.x + Math.cos(angle) * 0.22,
          0.05,
          position.z + Math.sin(angle) * 0.22,
        );
      }),
      ring = MeshBuilder.CreateLines(
        hit ? "arrow-hit" : "arrow-miss",
        { points },
        this.scene,
      ) as LinesMesh;
    ring.color = Color3.FromHexString(hit ? "#f4d27a" : "#a8a19a");
    ring.isPickable = false;
    setTimeout(() => ring.dispose(false, true), 260);
  }
  private updateDebug(dt: number) {
    this.updateAutoplayTowerUpgrades(dt);
    this.fpsTick += dt;
    if (this.fpsTick <= 0.2) return;
    this.fpsTick = 0;
    const player = this.player.state,
      speed = movementSpeedBonuses(
        player.level,
        player.stats.agility,
        player.bootsLevel,
      ),
      placement = this.placement.validation,
      theme = HORROR_THEME_CONFIG;
    this.debug.textContent = `FPS ${this.scene.getEngine().getFps().toFixed(0)}\nX ${this.player.root.position.x.toFixed(1)}  Z ${this.player.root.position.z.toFixed(1)}\nMonsters ${this.population.totalAlive} / ${MONSTER_SPAWN_CONFIG.maxMonsters}\nCrawler ${this.population.aliveByType("crawler")} / ${MONSTER_SPAWN_CONFIG.monsters.crawler.maxAlive}\nWailer ${this.population.aliveByType("wailer")} / ${MONSTER_SPAWN_CONFIG.monsters.wailer.maxAlive}\nGhost ${this.population.aliveByType("ghost")} / ${MONSTER_SPAWN_CONFIG.monsters.ghost.maxAlive}\nPending respawns ${this.population.pendingRespawns.length}\nFog ${theme.fog.enabled ? "ON" : "OFF"} · Density ${theme.fog.density}\nPlayer light ${theme.playerLight.enabled ? "ON" : "OFF"}\nCore light radius ${theme.coreLight.radius}\nCoins ${player.coins}\nWeapon LV${player.archerWeaponLevel}\nBoots LV${player.bootsLevel}\nCore Position ${this.baseRaid.position.x}, ${this.baseRaid.position.z}\nCore Level ${this.baseRaid.state.level ?? 1}\nDefenses ${this.defenses.count}\nNext Mini Tower Cost ${getNextDefenseCost(this.defenses.count)} Coins${placement ? `\nPlacement distanceToCore ${placement.distanceToCore.toFixed(1)}\nPlacement nearestDefenseDistance ${placement.nearestDefenseDistance?.toFixed(1) ?? "—"}\nPlacement valid ${placement.valid}` : ""}\nBase Speed ${GAME_CONFIG.player.movement.baseSpeed}\nLevel Speed Bonus ${speed.levelBonusPercent.toFixed(1)}%\nAgility Speed Bonus ${speed.agilityBonusPercent.toFixed(1)}%\nBoots Speed Bonus ${speed.bootsBonusPercent.toFixed(1)}%\nTotal Speed Bonus ${speed.totalBonusPercent.toFixed(1)}%\nFinal Speed ${movementSpeed(player.level, player.stats.agility, player.bootsLevel).toFixed(2)}\n${this.monsters
      .filter((monster) => monster.state.alive)
      .map((monster) => `${monster.state.type}: ${monster.aiState}`)
      .join("\n")}`;
    if (player.powerType === "magic") {
      const staff = getStaff(player.staffLevel);
      this.debug.textContent += `\nClass Mage\nSpell ${MAGE_CONFIG.spells[player.selectedSpell].name}\nMagic Damage ${powerDamage("magic", player.stats, player.staffLevel)}\nIntelligence ${player.stats.intelligence}\nStaff ${staff.name}\nStaff Level ${staff.level}\nStaff Damage Bonus ${staff.damageBonusPercent}%\nAoE ${staff.aoeRadius}\nRange ${MAGE_CONFIG.combat.range}`;
    }
    if (GAME_CONFIG.rangedCombat.debug.showAimPosition) {
      const aimDebug = this.rangedAim.debug(),
        aim = aimDebug.aim,
        impact = aimDebug.lastImpact;
      this.debug.textContent += `\nAim ${aim ? `X ${aim.position.x.toFixed(1)} Z ${aim.position.z.toFixed(1)}` : "NO TERRAIN"}\nDistance ${aim?.distance.toFixed(1) ?? "—"}\nCast Range ${attackRange(player.powerType)}\nValid ${aim?.valid ? "YES" : "NO"}\nLast Impact ${impact ? `X ${impact.x.toFixed(1)} Z ${impact.z.toFixed(1)}` : "—"}\nLast Hit ${aimDebug.lastHit}`;
    }
  }
  private updateAutoplayTowerUpgrades(dt: number) {
    if (!this.autoplayEnabled || this.paused) return;
    const towers = this.defenses.states;
    const underPressure =
      this.baseRaid.state.raidActive ||
      this.monsters.some(
        (monster) =>
          monster.state.alive &&
          towers.some(
            (tower) =>
              Math.hypot(
                monster.root.position.x - tower.position.x,
                monster.root.position.z - tower.position.z,
              ) <=
              DEFENSE_CONFIG.miniTower.attackRange * 1.5,
          ),
      );
    const strongestHealth = Math.max(
      0,
      ...this.monsters
        .filter((monster) => monster.state.alive)
        .map((monster) => monster.state.health),
    );
    const towerId = this.autoplayTowerUpgrades.decide(
      dt * 1000,
      this.player.state.coins,
      towers,
      underPressure,
      strongestHealth,
    );
    if (towerId) this.upgradeTower(towerId, true);
  }
  private drawSpawnAreas() {
    for (const area of spawnAreas) {
      const points = [
        new Vector3(area.minX, 0.04, area.minZ),
        new Vector3(area.maxX, 0.04, area.minZ),
        new Vector3(area.maxX, 0.04, area.maxZ),
        new Vector3(area.minX, 0.04, area.maxZ),
        new Vector3(area.minX, 0.04, area.minZ),
      ];
      const line = MeshBuilder.CreateLines(
        `spawn-area-${area.id}`,
        { points },
        this.scene,
      ) as LinesMesh;
      line.color = new Color3(0.2, 0.8, 1);
    }
  }
  getShopState() {
    const player = this.player.state,
      repair = GAME_CONFIG.shop.baseHealthRepair,
      potion = GAME_CONFIG.shop.healthPotion,
      gas = GAME_CONFIG.shop.lanternGas,
      currentWeapon = currentArcherWeapon(player),
      nextWeapon = nextArcherWeapon(player),
      currentStaff = currentMageStaff(player),
      nextStaff = nextMageStaff(player),
      currentBoots = currentArcherBoots(player),
      nextBoots = nextArcherBoots(player),
      currentBonuses = movementSpeedBonuses(
        player.level,
        player.stats.agility,
        player.bootsLevel,
      ),
      nextBonuses = nextBoots
        ? movementSpeedBonuses(
            player.level,
            player.stats.agility,
            nextBoots.level,
          )
        : null;
    return {
      powerType: player.powerType,
      coins: player.coins,
      healthPotions: player.healthPotions,
      potionCost: potion.cost,
      potionHealthRestore: potion.healthRestore,
      potionMaxInventory: potion.maxInventory,
      gasCanisters: player.gasCanisters,
      gasCost: gas.cost,
      gasMaxInventory: gas.maxInventory,
      gasTankCapacity: gas.tankCapacity,
      gasConsumptionPerSecond: gas.consumptionPerSecond,
      baseHealth: this.baseRaid.state.currentHealth,
      baseMaxHealth: this.baseRaid.maxHealth,
      cost: repair.cost,
      healthRestore: repair.healthRestore,
      currentWeapon,
      nextWeapon,
      currentDamage: powerDamage(
        player.powerType,
        player.stats,
        player.powerType === "magic"
          ? player.staffLevel
          : player.archerWeaponLevel,
      ),
      nextDamage: (player.powerType === "magic" ? nextStaff : nextWeapon)
        ? powerDamage(
            player.powerType,
            player.stats,
            (player.powerType === "magic" ? nextStaff : nextWeapon)!.level,
          )
        : null,
      currentBoots,
      nextBoots,
      currentSpeed: movementSpeed(
        player.level,
        player.stats.agility,
        player.bootsLevel,
      ),
      nextSpeed: nextBoots
        ? movementSpeed(player.level, player.stats.agility, nextBoots.level)
        : null,
      currentSpeedBonusPercent: currentBonuses.totalBonusPercent,
      nextSpeedBonusPercent: nextBonuses?.totalBonusPercent ?? null,
      currentStaff,
      nextStaff,
    };
  }
  buyHealthPotion() {
    return purchaseHealthPotion(this.player.state).message;
  }
  useHealthPotion() {
    const result = useHealthPotion(this.player.state);
    this.hud.toast(result.message);
    return result;
  }
  eatRawSteak() {
    const result = eatRawSteak(this.player.state);
    this.hud.toast(result.message);
    return result;
  }
  buyGasCanister() {
    return purchaseGasCanister(this.player.state).message;
  }
  toggleLantern() {
    const result = toggleLantern(this.player.state);
    this.applyDarknessVisual();
    this.hud.toast(result.message);
    return result;
  }
  refillLantern() {
    const result = refillLantern(this.player.state);
    this.hud.toast(result.message);
    return result;
  }
  buyBaseHealth() {
    const repair = GAME_CONFIG.shop.baseHealthRepair,
      result = purchaseBaseHealth(
        this.player.state.coins,
        this.baseRaid.state.currentHealth,
        this.baseRaid.maxHealth,
        repair.cost,
        repair.healthRestore,
      );
    if (result.success) {
      this.player.state.coins = result.coins;
      this.baseRaid.state.currentHealth = result.baseHealth;
      this.updateCoreLight();
    }
    return result.message;
  }
  buyArcherWeapon() {
    const result = purchaseArcherWeapon(this.player.state);
    if (result.success)
      this.player.updateArcherWeaponVisual(this.player.state.archerWeaponLevel);
    return result.message;
  }
  buyClassWeapon() {
    if (this.player.state.powerType !== "magic") return this.buyArcherWeapon();
    const result = purchaseMageStaff(this.player.state);
    if (result.success)
      this.player.updateMageStaffVisual(this.player.state.staffLevel);
    return result.message;
  }
  buyArcherBoots() {
    return purchaseArcherBoots(this.player.state).message;
  }
  getBuildState() {
    return {
      coins: this.player.state.coins,
      towerCount: this.defenses.count,
      nextCost: getNextDefenseCost(this.defenses.count),
    };
  }
  setTowerSelectionHandler(handler: (id: string | null) => void) {
    this.towerSelection = handler;
  }
  getTowerUpgradeState(id: string): TowerUpgradeView | null {
    const tower = this.defenses.get(id);
    if (!tower) return null;
    const maximum = tower.state.level >= DEFENSE_CONFIG.miniTower.maxLevel;
    return {
      id,
      level: tower.state.level,
      maxLevel: DEFENSE_CONFIG.miniTower.maxLevel,
      damage: tower.attackDamage,
      nextDamage: maximum ? null : getTowerDamage(tower.state.level + 1),
      nextCost: maximum ? null : getTowerUpgradeCost(tower.state.level),
      coins: this.player.state.coins,
      currentHealth: tower.state.currentHealth,
      maxHealth: tower.maxHealth,
      investedCoins: getTowerTotalInvestment(tower.state),
      removalRefund: getTowerRemovalRefund(tower.state),
    };
  }
  upgradeTower(id: string, automatic = false) {
    const tower = this.defenses.get(id);
    if (!tower) return "Mini Tower not found";
    const result = purchaseTowerUpgrade(this.player.state.coins, tower.state);
    if (result.success) {
      this.player.state.coins = result.coins;
      tower.applyLevelVisual();
      this.hud.toast(
        `${automatic ? "Autoplay: " : ""}${result.message} · ${result.damage.toLocaleString()} damage`,
      );
    }
    return result.message;
  }
  removeTower(id: string) {
    const tower = this.defenses.get(id);
    if (!tower) return "Mini Tower not found";
    const refund = getTowerRemovalRefund(tower.state),
      removed = this.defenses.remove(id);
    if (!removed) return "Mini Tower not found";
    this.player.state.coins += refund;
    this.towerSelection(null);
    this.syncTowerObstacles();
    const message = `Mini Tower removed · +${refund.toLocaleString()} Coins`;
    this.hud.toast(message);
    return message;
  }
  setPlacementStatusHandler(handler: (text: string, valid: boolean) => void) {
    this.placementStatus = handler;
  }
  setPlacementResultHandler(
    handler: (result: { success: boolean; message: string }) => void,
  ) {
    this.placementResult = handler;
  }
  startMiniTowerBuild() {
    const cost = getNextDefenseCost(this.defenses.count);
    if (this.player.state.coins < cost)
      return { success: false, message: "Not enough Coins" };
    this.placement.start();
    return { success: true, message: "Build mode started" };
  }
  confirmMiniTowerBuild() {
    if (!this.placement.active)
      return { success: false, message: "Build mode is not active" };
    const result = purchaseMiniTower(
      this.player.state.coins,
      this.placement.candidate,
      this.defenses.states,
      this.defenseValidator,
      `mini-tower-${crypto.randomUUID()}`,
    );
    if (!result.success || !result.defense)
      return { success: false, message: result.message };
    this.player.state.coins = result.coins;
    this.defenses.add(result.defense);
    this.syncTowerObstacles();
    this.placement.cancel();
    return { success: true, message: result.message };
  }
  cancelMiniTowerBuild() {
    this.placement.cancel();
  }
  snapshot(): SaveData {
    return {
      version: 1,
      player: structuredClone(this.player.state),
      world: {
        mapId: GAME_CONFIG.mapId,
        monsters: this.monsters
          .filter((monster) => monster.state.alive)
          .map((monster) => structuredClone(monster.state)),
        pendingRespawns: this.population.snapshot(),
        base: this.baseRaid.snapshot(),
        defenses: this.defenses.states,
        npcs: [],
        objects: [],
      },
    };
  }
}
