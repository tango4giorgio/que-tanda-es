import type { Catalogue, OrchestraId, Round, Track } from '../types';
import { ORCHESTRA_IDS } from '../types';
import { tracksForOrchestra } from '../catalogue/catalogue';

export type RandomSource = () => number;

function shuffled<T>(items: T[], rng: RandomSource = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function buildRoundChoices(correctId: OrchestraId, rng: RandomSource = Math.random): OrchestraId[] {
  const distractors = shuffled(ORCHESTRA_IDS.filter((id) => id !== correctId), rng).slice(0, 2);
  return shuffled([correctId, ...distractors], rng);
}

export function pickSessionOrchestras(rng: RandomSource = Math.random): OrchestraId[] {
  return shuffled([...ORCHESTRA_IDS], rng).slice(0, 3);
}

export function pickRoundTracks(orchestraId: OrchestraId, catalogue: Catalogue, rng: RandomSource = Math.random): Track[] {
  return shuffled(tracksForOrchestra(catalogue, orchestraId), rng).slice(0, 3);
}

export function buildRound(index: 0 | 1 | 2, orchestraId: OrchestraId, catalogue: Catalogue, rng: RandomSource = Math.random): Round {
  const tracks = pickRoundTracks(orchestraId, catalogue, rng);
  return {
    index,
    correctOrchestraId: orchestraId,
    choiceOrchestraIds: buildRoundChoices(orchestraId, rng),
    trackIds: tracks.map((track) => track.id),
    attempts: tracks.map((track, position) => ({
      trackNumber: (position + 1) as 1 | 2 | 3,
      trackId: track.id,
      elapsedMs: 0,
      guessOrchestraId: null,
      outcome: 'pending',
      points: 0
    })),
    status: 'active',
    roundScore: 0
  };
}
