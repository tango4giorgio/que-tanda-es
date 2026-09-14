import type { Catalogue } from '../../src/game/types';

const orchestras = [
  { id: 'di-sarli', displayName: 'Carlos Di Sarli' },
  { id: 'darienzo', displayName: "Juan D'Arienzo" },
  { id: 'troilo', displayName: 'Anibal Troilo' },
  { id: 'pugliese', displayName: 'Osvaldo Pugliese' },
  { id: 'piazzolla', displayName: 'Astor Piazzolla' }
] as const;

export const TEST_CATALOGUE = {
  version: 'test-catalogue-unit-fixture',
  generatedAt: '2026-01-01T00:00:00.000Z',
  orchestras: [...orchestras],
  tracks: orchestras.flatMap((orchestra) =>
    ([1, 2, 3] as const).map((trackNumber) => ({
      id: `${orchestra.id}-${trackNumber}`,
      orchestraId: orchestra.id,
      title: `${orchestra.displayName} test track ${trackNumber}`,
      previewUrl: `/audio/${orchestra.id}-${trackNumber}.wav`,
      durationMs: 30000
    }))
  )
} satisfies Catalogue;
