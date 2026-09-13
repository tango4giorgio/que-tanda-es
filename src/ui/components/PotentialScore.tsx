import { scoreCorrect } from '../../game/engine/scoring';

export function PotentialScore({ elapsedMs, trackNumber }: { elapsedMs: number; trackNumber: 1 | 2 | 3 }) {
  const points = scoreCorrect(trackNumber, elapsedMs);
  return <p aria-label="Potential score">{points} pts if correct now</p>;
}
