import { describe, expect, it } from 'vitest';
import { restoreHealth, shouldDropHeart } from './HealthPickupSystem';

describe('heart pickup rules',()=>{
  it('drops below the configured 30% threshold',()=>{expect(shouldDropHeart(.29)).toBe(true);expect(shouldDropHeart(.3)).toBe(false);});
  it('restores 30 health',()=>expect(restoreHealth(40,100)).toBe(70));
  it('never exceeds maximum health',()=>expect(restoreHealth(90,100)).toBe(100));
});
