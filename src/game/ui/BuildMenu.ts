import { DEFENSE_CONFIG } from '../config/defenseConfig';
export type BuildView={coins:number;towerCount:number;nextCost:number};export type BuildAction={success:boolean;message:string};
export class BuildMenu{
  el:HTMLElement;private placing=false;private status='Point at the ground to choose a position.';
  constructor(root:HTMLElement,private view:()=>BuildView,private begin:()=>BuildAction,private cancelBuild:()=>void,private close:()=>void){this.el=document.createElement('div');this.el.className='overlay hidden';root.append(this.el);this.render();addEventListener('keydown',event=>{if(event.key==='Escape'&&this.placing)this.cancelPlacement();});}
  toggle(open?:boolean){if(this.placing)return;this.el.classList.toggle('hidden',!(open??this.el.classList.contains('hidden')));this.render();}
  isOpen(){return!this.el.classList.contains('hidden');}
  updatePlacementStatus(value:string,valid:boolean){if(!this.placing)return;this.status=value;const label=this.el.querySelector('.placement-status');if(label){label.textContent=value;label.classList.toggle('valid',valid);}}
  handlePlacementResult(result:BuildAction){if(result.success)this.finishPlacement(result.message);else this.updatePlacementStatus(result.message,false);}
  private finishPlacement(message:string){this.placing=false;this.el.className='overlay hidden';this.render(message);}
  private render(message=''){
    const state=this.view();
    if(this.placing){this.el.className='build-placement';this.el.innerHTML=`<div class="placement-controls"><b class="placement-status">${this.status}</b><small>Click or tap the ground to build.</small><button class="cancel-build" data-cancel>Cancel</button></div>`;this.el.querySelector('[data-cancel]')?.addEventListener('click',()=>this.cancelPlacement());return;}
    this.el.className=this.el.classList.contains('hidden')?'overlay hidden':'overlay';this.el.innerHTML=`<div class="panel modal-panel build-panel"><button class="modal-close" data-close>×</button><h1>Defenses</h1><div class="defense-card"><div class="tower-icon">🏰</div><div><h2>Mini Tower</h2><p>Damage <b>${DEFENSE_CONFIG.miniTower.damage}</b></p><p>Range <b>${DEFENSE_CONFIG.miniTower.attackRange}</b></p><p>Built <b>${state.towerCount}</b></p><p>Cost <b>${state.nextCost.toLocaleString()} Coins</b></p></div><button data-build ${state.coins<state.nextCost?'disabled':''}>BUILD · ● ${state.nextCost.toLocaleString()}</button></div>${state.coins<state.nextCost?'<p class="not-enough">Not enough Coins</p>':''}<p class="shop-message">${message}</p><button data-close>Return to Game</button></div>`;this.el.querySelector('[data-build]')?.addEventListener('click',()=>{const result=this.begin();if(result.success){this.placing=true;this.status='Point at the ground to choose a position.';this.render();}else this.render(result.message);});this.el.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',this.close));
  }
  private cancelPlacement(){this.cancelBuild();this.placing=false;this.el.className='overlay hidden';this.render('Build cancelled. No Coins spent.');}
}
