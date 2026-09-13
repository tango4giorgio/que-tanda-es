import { describe, expect, it, vi } from 'vitest';
import { loadCatalogue, tracksForOrchestra, validateCatalogue } from '../../src/game/catalogue/catalogue';
import valid from '../../public/catalogue/starter-catalogue.json';

describe('catalogue utilities', () => {
  it('loads and filters catalogue tracks', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(valid) });
    expect((await loadCatalogue(fetcher)).tracks).toHaveLength(15);
    expect(tracksForOrchestra(validateCatalogue(valid), 'troilo')).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledWith('/catalogue/starter-catalogue.json');
  });
  it('rejects failed requests and malformed catalogues', async () => {
    await expect(loadCatalogue(vi.fn().mockResolvedValue({ ok: false, status: 503 }))).rejects.toThrow('503');
    expect(() => validateCatalogue({ ...valid, orchestras: [] })).toThrow();
    expect(() => validateCatalogue({ ...valid, tracks: [valid.tracks[0], { ...valid.tracks[1], id: valid.tracks[0].id }] })).toThrow();
  });
});
