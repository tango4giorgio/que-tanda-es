import type { Orchestra, Round, Track } from '../../game/types';
import { AnswerChoices } from '../components/AnswerChoices';
import { ScoreBadge } from '../components/ScoreBadge';
import { PotentialScore } from '../components/PotentialScore';

export function RoundScreen({ round, tracks, orchestras, elapsedMs, awaitingContinue, onGuess, onSkip, onContinue }: {
  round: Round;
  tracks: Track[];
  orchestras: Orchestra[];
  elapsedMs: number;
  awaitingContinue: boolean;
  onGuess: (id: Orchestra['id']) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const choices = round.choiceOrchestraIds.map((id) => orchestras.find((orchestra) => orchestra.id === id)).filter(Boolean) as Orchestra[];
  const current = round.attempts.find((attempt) => attempt.outcome === 'pending');
  const exhausted = round.attempts.every((attempt) => attempt.outcome !== 'pending');
  const trackEnded = current !== undefined && current.elapsedMs >= 30000;
  const showSkipControl = round.status === 'active' && (exhausted || trackEnded || awaitingContinue);
  // When awaiting a manual continue after a wrong guess, `current` already points at the
  // *upcoming* pending track (the wrong attempt itself is no longer pending), so its track
  // number does not tell us whether the just-answered track was the last one. `exhausted`
  // (no pending attempts remain) is the correct signal for that case instead.
  const isLastTrack = awaitingContinue ? exhausted : (current === undefined || current.trackNumber === 3);
  return <main>
    <p>Round {round.index + 1} of 3</p>
    <h1>Guess the orchestra</h1>
    <p>Track {current?.trackNumber ?? 3} of up to 3</p>
    {awaitingContinue && <p role="alert" className="feedback feedback-wrong">Wrong answer. Have another go on the next track.</p>}
    <PotentialScore elapsedMs={elapsedMs} trackNumber={current?.trackNumber ?? 3} />
    <ScoreBadge score={round.roundScore} />
    <AnswerChoices choices={choices} disabled={round.status !== 'active' || awaitingContinue} onSelect={onGuess} />
    {showSkipControl && (
      <button type="button" onClick={awaitingContinue ? onContinue : onSkip}>
        {isLastTrack ? 'Next round' : 'Next track'}
      </button>
    )}
  </main>;
}
