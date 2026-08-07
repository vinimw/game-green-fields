export class InputSystem {
  private keys = new Set<string>(); joystick = {x:0,z:0}; attackRequested=false;
  constructor(){ addEventListener('keydown',e=>{this.keys.add(e.code);if(e.code==='Space'){e.preventDefault();this.attackRequested=true;}}); addEventListener('keyup',e=>this.keys.delete(e.code)); }
  direction(){ const x=(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)-(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-this.joystick.x; const z=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)+this.joystick.z; const l=Math.hypot(x,z); return l>1?{x:x/l,z:z/l}:{x,z}; }
}
