// Curated list of archive.org (archive.org/details/<identifier>) recordings used to build
// the real starter catalogue. Each entry was located via the archive.org advanced search
// API (https://archive.org/advancedsearch.php) and confirmed via https://archive.org/metadata/<identifier>
// to be a single, individually addressable MP3 file (not a multi-track ZIP), tagged
// `mediatype: audio` and belonging to the openly licensed `opensource_audio`/`community`
// collections. The direct, streamable download URL for any archive.org file follows the
// stable pattern `https://archive.org/download/<identifier>/<url-encoded filename>`.
//
// Re-run `npm run build:catalogue` after editing this file to regenerate
// `public/catalogue/starter-catalogue.json`.
import type { OrchestraId } from '../../src/game/types';

export interface ArchiveOrgTrack {
  /** archive.org item identifier, e.g. the `X` in archive.org/details/X */
  identifier: string;
  /** exact on-item filename (spaces/case must match, will be URL-encoded automatically) */
  filename: string;
  orchestraId: OrchestraId;
  title: string;
  /** reported track length in seconds from the item's metadata, used to derive durationMs */
  lengthSeconds: number;
}

export const ARCHIVE_ORG_TRACKS: ArchiveOrgTrack[] = [
  // Carlos Di Sarli
  {
    identifier: 'disarli.florio.porqueregresastu',
    filename: 'disarli.florio.porqueregresastu.mp3',
    orchestraId: 'di-sarli',
    title: 'Por Que Regresas Tu',
    lengthSeconds: 187
  },
  {
    identifier: 'disarli.florio.destinodeflor',
    filename: 'disarli.florio.destinodeflor.mp3',
    orchestraId: 'di-sarli',
    title: 'Destino De Flor',
    lengthSeconds: 175
  },
  {
    identifier: 'disarlicarasucia',
    filename: 'disarlicarasucia.mp3',
    orchestraId: 'di-sarli',
    title: 'Cara Sucia',
    lengthSeconds: 167
  },
  // Juan D'Arienzo — three tracks from a single 1944-vol.12 78rpm digitisation item
  {
    identifier: 'JuanDArienzoNoNosVeremosNunca',
    filename: 'Juan d Arienzo    ana maria.mp3',
    orchestraId: 'darienzo',
    title: 'Ana Maria',
    lengthSeconds: 133
  },
  {
    identifier: 'JuanDArienzoNoNosVeremosNunca',
    filename: 'Juan d Arienzo    a suerte y verdad.mp3',
    orchestraId: 'darienzo',
    title: 'A Suerte Y Verdad',
    lengthSeconds: 152
  },
  {
    identifier: 'JuanDArienzoNoNosVeremosNunca',
    filename: 'Juan d Arienzo    clavel.mp3',
    orchestraId: 'darienzo',
    title: 'Clavel',
    lengthSeconds: 142
  },
  // Anibal Troilo
  {
    identifier: 'troilomilongueandoenelcuarenta',
    filename: 'troilomilongueandoenelcuarenta.mp3',
    orchestraId: 'troilo',
    title: 'Milongueando En El 40',
    lengthSeconds: 153
  },
  {
    identifier: 'troilo.uno',
    filename: 'Troilo.Uno.mp3',
    orchestraId: 'troilo',
    title: 'Uno',
    lengthSeconds: 211
  },
  {
    identifier: 'troilo.sur',
    filename: 'Troilo.Sur.mp3',
    orchestraId: 'troilo',
    title: 'Sur',
    lengthSeconds: 239
  },
  // Osvaldo Pugliese
  {
    identifier: 'pugliesegallociego',
    filename: 'pugliesegallociego.mp3',
    orchestraId: 'pugliese',
    title: 'Gallo Ciego',
    lengthSeconds: 215
  },
  {
    identifier: 'Pugliese.brujo',
    filename: 'Pugliese.brujo.mp3',
    orchestraId: 'pugliese',
    title: 'Si Sos Brujo',
    lengthSeconds: 200
  },
  {
    identifier: 'pugliese.morena',
    filename: 'Pugliese.Morena.mp3',
    orchestraId: 'pugliese',
    title: 'Morena',
    lengthSeconds: 160
  },
  // Astor Piazzolla
  {
    identifier: 'HARAGANASTORPIAZZOLLAALDOCAMPOAMOR',
    filename: 'HARAGAN -  ASTOR PIAZZOLLA   ALDO CAMPOAMOR.mp3',
    orchestraId: 'piazzolla',
    title: 'Haragan',
    lengthSeconds: 156
  },
  {
    identifier: 'AstorPiazzollaBragatissimo',
    filename: 'Astor Piazzolla - Bragatissimo.mp3',
    orchestraId: 'piazzolla',
    title: 'Bragatissimo',
    lengthSeconds: 222
  },
  {
    identifier: 'escualo-3-astor-piazzolla-y-su-quinteto-tango-nuevo-live-in-utrecht-1984-3',
    filename: 'Escualo -3- ASTOR PIAZZOLLA  y su Quinteto Tango Nuevo -live in Utrecht (1984) -3-.mp3',
    orchestraId: 'piazzolla',
    title: 'Escualo (Live In Utrecht, 1984)',
    lengthSeconds: 204
  }
];
