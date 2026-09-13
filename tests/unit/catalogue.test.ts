import { describe, expect, it } from 'vitest';
import { validateCatalogue } from '../../src/game/catalogue/catalogue';
import valid from '../../public/catalogue/starter-catalogue.json';

describe('catalogue', () => {
  it('validates the starter catalogue', () => {
    expect(validateCatalogue(valid).tracks).toHaveLength(15);
  });
  it('rejects invalid URLs', () => {
    expect(() => validateCatalogue({ ...valid, tracks: [{ ...valid.tracks[0], previewUrl: 'http://bad' }] })).toThrow();
  });
});
