export type GroundPosition={x:number;z:number};
export type PositionedTarget<T>={target:T;position:GroundPosition};

export const distanceXZ=(a:GroundPosition,b:GroundPosition)=>Math.hypot(a.x-b.x,a.z-b.z);

export const targetsWithinRadius=<T>(impactPosition:GroundPosition,targets:PositionedTarget<T>[],radius:number)=>
  targets.filter(candidate=>distanceXZ(impactPosition,candidate.position)<=radius);

export const nearestTargetWithinRadius=<T>(impactPosition:GroundPosition,targets:PositionedTarget<T>[],radius:number)=>
  targetsWithinRadius(impactPosition,targets,radius)
    .sort((a,b)=>distanceXZ(impactPosition,a.position)-distanceXZ(impactPosition,b.position))[0]?.target;

export const resolveRangedHits=<T>(impactPosition:GroundPosition,targets:PositionedTarget<T>[],hitRadius:number,aoeRadius=0):T[]=>{
  if(aoeRadius>0)return targetsWithinRadius(impactPosition,targets,aoeRadius).map(candidate=>candidate.target);
  const nearest=nearestTargetWithinRadius(impactPosition,targets,hitRadius);
  return nearest===undefined?[]:[nearest];
};
