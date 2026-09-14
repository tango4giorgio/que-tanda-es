import { describe, expect, it } from 'vitest';
import { validateCatalogue } from '../../src/game/catalogue/catalogue';
import { createSession, reduceSession } from '../../src/game/engine/session';
import type { Catalogue } from '../../src/game/types';
import { TEST_CATALOGUE } from '../fixtures/catalogue';

const catalogue = validateCatalogue(TEST_CATALOGUE);

const multiTrackCatalogue: Catalogue = {
  version: 'test-catalogue-multitrack',
  generatedAt: new Date().toISOString(),
  orchestras: catalogue.orchestras,
  tracks: catalogue.orchestras.flatMap((orchestra) => [1, 2, 3].map((n) => ({
    id: `${orchestra.id}-${n}`,
    orchestraId: orchestra.id,
    title: `${orchestra.displayName} clip ${n}`,
    previewUrl: '/audio/test.wav',
    durationMs: 30000
  })))
};

describe('session reducer', () => {
  it('creates three rounds and awards a correct score', () => {
    const session = createSession(catalogue, () => 0.1);
    expect(session.rounds).toHaveLength(3);
    const round = session.rounds[0];
    const next = reduceSession(session, { type: 'GUESS_CORRECT', orchestraId: round.correctOrchestraId, elapsedMs: 0 });
    expect(next.rounds[0].status).toBe('won');
    expect(next.totalScore).toBe(300);
  });
  it('applies wrong guesses then allows skip', () => {
    let session = createSession(catalogue, () => 0.1);
    const round = session.rounds[0];
    for (const choice of round.attempts) {
      session = reduceSession(session, { type: 'GUESS_WRONG', orchestraId: round.choiceOrchestraIds.find((id) => id !== round.correctOrchestraId)! });
    }
    session = reduceSession(session, { type: 'SKIP' });
    expect(session.rounds[0].status).toBe('exhausted');
    expect(session.rounds[0].roundScore).toBe(-150);
  });
  it('records full playback time when a track ends', () => {
    const session = createSession(catalogue, () => 0.1);
    expect(reduceSession(session, { type: 'TRACK_ENDED' }).rounds[0].attempts[0].elapsedMs).toBe(30000);
  });
  it('skips a single track for zero points and advances to the next one without ending the round', () => {
    const session = createSession(multiTrackCatalogue, () => 0.1);
    const afterTrackEnded = reduceSession(session, { type: 'TRACK_ENDED' });
    const afterSkip = reduceSession(afterTrackEnded, { type: 'SKIP' });
    expect(afterSkip.rounds[0].attempts[0].outcome).toBe('skipped');
    expect(afterSkip.rounds[0].attempts[0].points).toBe(0);
    expect(afterSkip.rounds[0].attempts[1].outcome).toBe('pending');
    expect(afterSkip.rounds[0].status).toBe('active');
  });
  it('ends the round once the final track is skipped', () => {
    let session = createSession(multiTrackCatalogue, () => 0.1);
    session = reduceSession(session, { type: 'TRACK_ENDED' });
    session = reduceSession(session, { type: 'SKIP' });
    session = reduceSession(session, { type: 'TRACK_ENDED' });
    session = reduceSession(session, { type: 'SKIP' });
    session = reduceSession(session, { type: 'TRACK_ENDED' });
    session = reduceSession(session, { type: 'SKIP' });
    expect(session.rounds[0].status).toBe('exhausted');
    expect(session.rounds[0].roundScore).toBe(0);
  });
});
