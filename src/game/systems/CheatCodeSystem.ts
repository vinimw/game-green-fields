import { GAME_CONFIG } from '../config/gameConfig';
export type CheatAction={type:'money';amount:number};
export class CheatCodeSystem{private buffer='';private lastInputAt=0;private listener=(event:KeyboardEvent)=>this.onKey(event);
  constructor(private onAction:(action:CheatAction)=>void,private now:()=>number=()=>performance.now(),private attachKeyboardListener=true){if(this.attachKeyboardListener)addEventListener('keydown',this.listener);}
  input(key:string){if(!GAME_CONFIG.cheats.enabled)return null;const current=this.now();if(current-this.lastInputAt>GAME_CONFIG.cheats.inputTimeoutMs)this.buffer='';this.lastInputAt=current;if(key.length!==1||!/^[a-z]$/i.test(key))return null;this.buffer=(this.buffer+key.toLowerCase()).slice(-GAME_CONFIG.cheats.moneyCode.length);if(this.buffer!==GAME_CONFIG.cheats.moneyCode.toLowerCase())return null;this.buffer='';const action:CheatAction={type:'money',amount:GAME_CONFIG.cheats.moneyRewardCoins};this.onAction(action);return action;}
  dispose(){if(this.attachKeyboardListener)removeEventListener('keydown',this.listener);}
  private onKey(event:KeyboardEvent){const target=event.target as HTMLElement|null;if(target&&(target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable))return;this.input(event.key);}
}
