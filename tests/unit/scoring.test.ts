import { describe, expect, it } from 'vitest';
import { scoreCorrect } from '../../src/game/engine/scoring';

describe('scoring', () => {
  it.each([
    [1, 0, 300], [1, 1000, 300], [1, 15500, 200], [1, 30000, 100],
    [2, 500, 200], [2, 30000, 75], [3, 0, 100], [3, 30000, 50]
  ] as const)('scores track %s at %s ms as %s', (track, elapsed, expected) => {
    expect(scoreCorrect(track, elapsed)).toBe(expected);
  });
});
