export type HorrorAudioCue='ambient-wind'|'branches'|'crawler'|'wailer'|'player'|'core-hum';
export class HorrorAudioHooks{private listeners=new Set<(cue:HorrorAudioCue)=>void>();onCue(listener:(cue:HorrorAudioCue)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}emit(cue:HorrorAudioCue){this.listeners.forEach(listener=>listener(cue));}}
