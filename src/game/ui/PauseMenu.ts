import type { PlayerState, Stats } from '../core/types';
import { criticalChance,maxHealth,movementSpeed,powerDamage,resetStats,spendStat } from '../systems/StatsSystem';

export class PauseMenu {
  el:HTMLElement;private tab:'main'|'character'|'inventory'='main';
  constructor(root:HTMLElement,private player:PlayerState,private close:()=>void,private save:()=>void){this.el=document.createElement('div');this.el.className='overlay hidden';root.append(this.el);this.render();}
  toggle(open?:boolean){const shouldOpen=open??!this.isOpen();this.el.classList.toggle('hidden',!shouldOpen);this.render();}
  isOpen(){return !this.el.classList.contains('hidden');}
  private render(){
    if(this.tab==='main')this.el.innerHTML=`<div class="panel"><h1>Green Fields</h1><button data-a="resume">Resume</button><button data-a="character">Character</button><button data-a="inventory">Inventory</button><button data-a="save">Save Game</button><p class="hint">WASD / arrows to move · Space to attack</p></div>`;
    if(this.tab==='character'){const player=this.player,stats=player.stats;this.el.innerHTML=`<div class="panel"><h1>Character</h1><div class="stats"><span>Power</span><b>${player.powerType}</b><span>Power damage</span><b>${powerDamage(player.powerType,stats)}</b><span>Level</span><b>${player.level}</b><span>XP</span><b>${player.xp}</b>${(['strength','agility','intelligence','vitality'] as (keyof Stats)[]).map(stat=>`<span>${stat[0].toUpperCase()+stat.slice(1)}</span><b>${stats[stat]} <button class="plus" data-stat="${stat}" ${player.availableStatPoints<1?'disabled':''}>+</button></b>`).join('')}<span>Critical</span><b>${criticalChance(stats.agility).toFixed(1)}%</b><span>Move speed</span><b>${movementSpeed(player.level,stats.agility).toFixed(2)}</b><span>HP</span><b>${Math.ceil(player.currentHealth)} / ${maxHealth(stats.vitality,player.level)}</b><span>Available points</span><b>${player.availableStatPoints}</b></div><button data-a="reset-stats">Reset Stats</button><button data-a="back">Back</button></div>`;}
    if(this.tab==='inventory'){const equipment=this.player.equipment;this.el.innerHTML=`<div class="panel"><h1>Inventory</h1><p class="empty">Your backpack is empty.</p><h2>Equipment</h2><div class="equipment">${Object.entries(equipment).map(([slot,item])=>`<span>${slot}</span><b>${item??'Empty'}</b>`).join('')}</div><button data-a="back">Back</button></div>`;}
    this.el.querySelectorAll<HTMLElement>('[data-a]').forEach(button=>button.onclick=()=>{const action=button.dataset.a;if(action==='resume')this.close();if(action==='character'||action==='inventory'){this.tab=action;this.render();}if(action==='back'){this.tab='main';this.render();}if(action==='save')this.save();if(action==='reset-stats'){resetStats(this.player);this.render();}});
    this.el.querySelectorAll<HTMLElement>('[data-stat]').forEach(button=>button.onclick=()=>{spendStat(this.player,button.dataset.stat as keyof Stats);this.render();});
  }
}
