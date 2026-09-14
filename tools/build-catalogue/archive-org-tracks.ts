import type { OrchestraId } from '../../src/game/types';

export interface ArchiveOrgTrack {
  identifier: string;
  filename: string;
  orchestraId: OrchestraId;
  title: string;
  lengthSeconds: number;
}

interface ArchiveSearchResponse {
  response?: {
    docs?: Array<{ identifier?: string }>;
  };
}

interface ArchiveMetadataFile {
  name?: string;
  format?: string;
  length?: string | number;
  title?: string;
  creator?: string;
  artist?: string;
  source?: string;
}

interface ArchiveMetadataResponse {
  metadata?: {
    creator?: string | string[];
    title?: string;
  };
  files?: ArchiveMetadataFile[];
}

const MIN_TRACK_SECONDS = 60;
const MAX_TRACK_SECONDS = 900;
const SEARCH_ROWS = 500;
const METADATA_CONCURRENCY = 6;

const SEARCH_QUERIES: Record<OrchestraId, string> = {
  'di-sarli': '(title:"Carlos Di Sarli" OR creator:"Carlos Di Sarli" OR identifier:disarli*)',
  darienzo: '(title:"Juan D\'Arienzo" OR creator:"Juan D\'Arienzo" OR identifier:JuanDArienzo* OR identifier:darienzo*)',
  troilo: '(title:"Anibal Troilo" OR title:"Aníbal Troilo" OR creator:"Anibal Troilo" OR creator:"Aníbal Troilo" OR identifier:troilo*)',
  pugliese: '(title:"Osvaldo Pugliese" OR creator:"Osvaldo Pugliese" OR identifier:pugliese*)',
  piazzolla: '(title:"Astor Piazzolla" OR creator:"Astor Piazzolla" OR identifier:piazzolla* OR identifier:astorpiazzolla*)'
};

const ARTIST_SIGNATURES: Record<OrchestraId, string> = {
  'di-sarli': 'carlosdisarli',
  darienzo: 'juandarienzo',
  troilo: 'anibaltroilo',
  pugliese: 'osvaldopugliese',
  piazzolla: 'astorpiazzolla'
};

function parseLength(value: string | number | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (!value) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);

  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function isMp3(file: ArchiveMetadataFile): boolean {
  return file.name?.toLowerCase().endsWith('.mp3') === true
    || file.format?.toLowerCase().includes('mp3') === true;
}

function preferredMp3Files(files: ArchiveMetadataFile[]): ArchiveMetadataFile[] {
  const playable = files.filter((file) => {
    const length = parseLength(file.length);
    return isMp3(file)
      && file.name
      && length !== undefined
      && length >= MIN_TRACK_SECONDS
      && length <= MAX_TRACK_SECONDS;
  });

  const nonLowBitrateStems = new Set(
    playable
      .filter((file) => !file.name!.toLowerCase().endsWith('_64kb.mp3'))
      .map((file) => file.name!.replace(/\.mp3$/i, '').toLowerCase())
  );

  return playable.filter((file) => {
    const lowerName = file.name!.toLowerCase();
    if (!lowerName.endsWith('_64kb.mp3')) return true;
    const stem = lowerName.replace(/_64kb\.mp3$/, '');
    return !nonLowBitrateStems.has(stem);
  });
}

function titleFromFile(file: ArchiveMetadataFile): string {
  if (file.title?.trim()) return file.title.trim();
  return file.name!
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[\s._-]+/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalise(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value.join(' ') : value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function filesAttributedToOrchestra(
  metadata: ArchiveMetadataResponse,
  orchestraId: OrchestraId
): ArchiveMetadataFile[] {
  const files = preferredMp3Files(metadata.files ?? []);
  const signature = ARTIST_SIGNATURES[orchestraId];
  const itemCreator = normalise(metadata.metadata?.creator);
  const itemTitle = normalise(metadata.metadata?.title);

  if (itemCreator.includes(signature) || itemTitle.startsWith(signature)) return files;
  return files.filter((file) =>
    normalise([file.creator ?? '', file.artist ?? '', file.title ?? '', file.name ?? ''])
      .includes(signature)
  );
}

async function searchIdentifiers(
  orchestraId: OrchestraId,
  fetcher: typeof fetch
): Promise<string[]> {
  const params = new URLSearchParams({
    q: `mediatype:audio AND ${SEARCH_QUERIES[orchestraId]}`,
    rows: String(SEARCH_ROWS),
    page: '1',
    output: 'json',
    sort: 'identifier asc'
  });
  params.append('fl[]', 'identifier');

  const response = await fetcher(`https://archive.org/advancedsearch.php?${params}`);
  if (!response.ok) {
    throw new Error(`Archive.org search failed for ${orchestraId}: ${response.status}`);
  }
  const data = await response.json() as ArchiveSearchResponse;
  return [...new Set(
    (data.response?.docs ?? [])
      .map((doc) => doc.identifier)
      .filter((identifier): identifier is string => Boolean(identifier))
  )];
}

async function fetchItemTracks(
  identifier: string,
  orchestraId: OrchestraId,
  fetcher: typeof fetch
): Promise<ArchiveOrgTrack[]> {
  const response = await fetcher(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  if (!response.ok) {
    console.warn(`Skipping Archive.org item ${identifier}: metadata returned ${response.status}`);
    return [];
  }
  const metadata = await response.json() as ArchiveMetadataResponse;
  return filesAttributedToOrchestra(metadata, orchestraId).map((file) => ({
    identifier,
    filename: file.name!,
    orchestraId,
    title: titleFromFile(file),
    lengthSeconds: parseLength(file.length)!
  }));
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );
  return results;
}

export async function discoverArchiveOrgTracks(
  fetcher: typeof fetch = fetch
): Promise<ArchiveOrgTrack[]> {
  const orchestraIds = Object.keys(SEARCH_QUERIES) as OrchestraId[];
  const tracksByOrchestra = await Promise.all(orchestraIds.map(async (orchestraId) => {
    const identifiers = await searchIdentifiers(orchestraId, fetcher);
    const itemTracks = await mapWithConcurrency(
      identifiers,
      METADATA_CONCURRENCY,
      (identifier) => fetchItemTracks(identifier, orchestraId, fetcher)
    );
    const tracks = itemTracks.flat();
    if (tracks.length < 3) {
      throw new Error(`Archive.org returned fewer than three usable tracks for ${orchestraId}`);
    }
    return tracks;
  }));

  return tracksByOrchestra
    .flat()
    .sort((left, right) =>
      left.orchestraId.localeCompare(right.orchestraId)
      || left.identifier.localeCompare(right.identifier)
      || left.filename.localeCompare(right.filename)
    );
}
