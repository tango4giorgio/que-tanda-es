import { describe, expect, it, vi } from 'vitest';
import { loadCatalogue, tracksForOrchestra, validateCatalogue } from '../../src/game/catalogue/catalogue';
import { TEST_CATALOGUE } from '../fixtures/catalogue';

describe('catalogue utilities', () => {
  it('loads and filters catalogue tracks', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(TEST_CATALOGUE) });
    expect((await loadCatalogue(fetcher)).tracks).toHaveLength(15);
    expect(tracksForOrchestra(validateCatalogue(TEST_CATALOGUE), 'troilo')).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledWith('/catalogue/starter-catalogue.json');
  });
  it('rejects failed requests and malformed catalogues', async () => {
    await expect(loadCatalogue(vi.fn().mockResolvedValue({ ok: false, status: 503 }))).rejects.toThrow('503');
    expect(() => validateCatalogue({ ...TEST_CATALOGUE, orchestras: [] })).toThrow();
    expect(() => validateCatalogue({
      ...TEST_CATALOGUE,
      tracks: [
        TEST_CATALOGUE.tracks[0],
        { ...TEST_CATALOGUE.tracks[1], id: TEST_CATALOGUE.tracks[0].id }
      ]
    })).toThrow();
  });
});
