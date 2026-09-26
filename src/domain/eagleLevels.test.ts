import { describe, expect, it } from 'vitest';
import { eagleLevels, getEagleProgress, rankAthletes } from './eagleLevels';
import { seedDatabase } from '../services/seed';

describe('eagle level calculations', () => {
  it('calculates the agreed level for 12 480 meters', () => {
    expect(getEagleProgress(12_480, eagleLevels)).toMatchObject({ progress: 83, remaining: 1_520 });
    expect(getEagleProgress(12_480, eagleLevels).level.id).toBe('IV');
  });

  it('keeps the highest level at 100 percent', () => {
    expect(getEagleProgress(160_000, eagleLevels)).toMatchObject({ progress: 100, remaining: 0, next: null });
  });

  it('sorts athletes by meters without mutating the source', () => {
    const source = seedDatabase.athletes.slice(0, 3).reverse();
    const ranked = rankAthletes(source);
    expect(ranked[0].meters).toBeGreaterThanOrEqual(ranked[1].meters);
    expect(source).not.toEqual(ranked);
  });
});

