import { describe, expect, it } from 'vitest';
import { validateCatalogue } from '../../src/game/catalogue/catalogue';
import { TEST_CATALOGUE } from '../fixtures/catalogue';

describe('catalogue', () => {
  it('validates a complete catalogue', () => {
    expect(validateCatalogue(TEST_CATALOGUE).tracks).toHaveLength(15);
  });
  it('rejects invalid URLs', () => {
    expect(() => validateCatalogue({
      ...TEST_CATALOGUE,
      tracks: [{ ...TEST_CATALOGUE.tracks[0], previewUrl: 'http://bad' }]
    })).toThrow();
  });
});
