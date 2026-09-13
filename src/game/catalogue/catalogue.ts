import type { Catalogue, OrchestraId, Track } from '../types';
import { ORCHESTRA_IDS } from '../types';

export function validateCatalogue(value: unknown): Catalogue {
  if (!value || typeof value !== 'object') throw new Error('Catalogue is not an object');
  const data = value as Partial<Catalogue>;
  if (!Array.isArray(data.orchestras) || data.orchestras.length !== 5) throw new Error('Catalogue must contain five orchestras');
  const ids = data.orchestras.map((orchestra) => orchestra.id);
  if (new Set(ids).size !== 5 || ORCHESTRA_IDS.some((id) => !ids.includes(id))) throw new Error('Catalogue contains invalid orchestras');
  if (!Array.isArray(data.tracks) || data.tracks.length === 0) throw new Error('Catalogue has no tracks');
  const trackIds = new Set<string>();
  for (const track of data.tracks) {
    if (!track || typeof track.id !== 'string' || trackIds.has(track.id)) throw new Error('Catalogue contains duplicate or invalid track IDs');
    if (!ORCHESTRA_IDS.includes(track.orchestraId as OrchestraId)) throw new Error('Track references an unknown orchestra');
    const isLocalTestPreview = data.version?.startsWith('test-catalogue-') && track.previewUrl?.startsWith('/audio/');
    if (typeof track.previewUrl !== 'string' || (!track.previewUrl.startsWith('https://') && !isLocalTestPreview)) throw new Error('Track preview URL must use HTTPS');
    trackIds.add(track.id);
  }
  return data as Catalogue;
}

export async function loadCatalogue(fetcher: typeof fetch = fetch): Promise<Catalogue> {
  // Use Vite's BASE_URL (always ends with '/') so this resolves correctly whether the app
  // is served from the root (local dev/preview) or a subpath (e.g. GitHub Pages project sites).
  const response = await fetcher(`${import.meta.env.BASE_URL}catalogue/starter-catalogue.json`);
  if (!response.ok) throw new Error(`Catalogue request failed with ${response.status}`);
  return validateCatalogue(await response.json());
}

export function tracksForOrchestra(catalogue: Catalogue, orchestraId: OrchestraId): Track[] {
  return catalogue.tracks.filter((track) => track.orchestraId === orchestraId);
}
