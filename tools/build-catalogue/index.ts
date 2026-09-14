import { writeFile } from 'node:fs/promises';
import { discoverArchiveOrgTracks } from './archive-org-tracks';
import { ORCHESTRAS } from '../../src/game/catalogue/orchestras';
import type { Catalogue, Track } from '../../src/game/types';

const outputPath = 'public/catalogue/starter-catalogue.json';

function archiveOrgDownloadUrl(identifier: string, filename: string): string {
  return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
}

const archiveOrgTracks = await discoverArchiveOrgTracks();
const tracks: Track[] = archiveOrgTracks.map((track, index) => ({
  id: `${track.identifier}-${index}`,
  orchestraId: track.orchestraId,
  title: track.title,
  previewUrl: archiveOrgDownloadUrl(track.identifier, track.filename),
  durationMs: track.lengthSeconds * 1000
}));

const catalogue: Catalogue = {
  version: `archive-org-catalogue-${new Date().toISOString().slice(0, 10)}`,
  generatedAt: new Date().toISOString(),
  orchestras: ORCHESTRAS,
  tracks
};

await writeFile(outputPath, `${JSON.stringify(catalogue, null, 2)}\n`);
console.log(`Wrote ${tracks.length} archive.org tracks to ${outputPath}`);
