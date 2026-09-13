import { describe, expect, it } from 'vitest';
import { buildRoundChoices, pickSessionOrchestras } from '../../src/game/engine/selection';

describe('selection', () => {
  it('creates three distinct choices including the correct orchestra', () => {
    const choices = buildRoundChoices('di-sarli', () => 0.1);
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    expect(choices).toContain('di-sarli');
  });
  it('creates three non-repeating session orchestras', () => {
    expect(new Set(pickSessionOrchestras(() => 0.1)).size).toBe(3);
  });
});
