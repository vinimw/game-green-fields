import {NullEngine,Scene} from "@babylonjs/core";
import {describe,expect,it} from "vitest";
import {MONSTERS_CONFIG,MONSTER_SPAWN_CONFIG} from "../config/monstersConfig";
import {createPlayerState} from "../core/GameState";
import {Monster} from "../entities/Monster";
import {Player} from "../entities/Player";

describe("Evil Pumpkin",()=>{
  it("has the requested combat, reward and spawn configuration",()=>{
    expect(MONSTERS_CONFIG["evil-pumpkin"]).toMatchObject({level:3,unlockPlayerLevel:20,health:150,damage:70,experienceReward:50,coinDrop:{chance:.3,amount:25},meatDrop:{chance:0,amount:0},attackRadius:6});
    expect(MONSTER_SPAWN_CONFIG.monsters["evil-pumpkin"]).toMatchObject({spawnGroupSize:2,spawnWeight:100,unlockPlayerLevel:20});
    expect(MONSTER_SPAWN_CONFIG.monsters.crawler.maxPlayerLevel).toBe(19);
  });
  it("jumps while pursuing and launches a delayed poison projectile",()=>{
    const engine=new NullEngine(),scene=new Scene(engine),player=new Player(scene,createPlayerState()),pumpkin=new Monster(scene,{id:"pumpkin-test",type:"evil-pumpkin",alive:true,health:150,position:{x:5,z:0},spawnPosition:{x:5,z:0}});let damage=0;
    pumpkin.update(player,.01,value=>damage+=value,false,undefined,[],false);
    pumpkin.update(player,.01,value=>damage+=value,false,undefined,[],false);
    expect(scene.getMeshByName("pumpkin-poison-projectile")).not.toBeNull();expect(damage).toBe(0);
    pumpkin.update(player,1,value=>damage+=value,false,undefined,[],false);
    expect(damage).toBe(70);expect(scene.getMeshByName("evil-pumpkin-body")).not.toBeNull();
    pumpkin.dispose();player.root.dispose(false,true);scene.dispose();engine.dispose();
  });
});
