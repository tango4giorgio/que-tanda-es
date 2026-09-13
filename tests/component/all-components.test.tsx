import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from '../../src/ui/components/Footer';
import { RetryPanel } from '../../src/ui/components/RetryPanel';
import { ScoreBadge } from '../../src/ui/components/ScoreBadge';
import { PotentialScore } from '../../src/ui/components/PotentialScore';
import { RoundScreen } from '../../src/ui/screens/RoundScreen';
import { RoundSummary } from '../../src/ui/screens/RoundSummary';
import { ServiceUnavailable } from '../../src/ui/screens/ServiceUnavailable';
import { SessionSummary } from '../../src/ui/screens/SessionSummary';
import { ORCHESTRAS } from '../../src/game/catalogue/orchestras';
import type { Round, Session } from '../../src/game/types';

const round: Round = {
  index: 0,
  correctOrchestraId: 'di-sarli',
  choiceOrchestraIds: ['di-sarli', 'troilo', 'pugliese'],
  trackIds: ['track-1'],
  attempts: [{ trackNumber: 1, trackId: 'track-1', elapsedMs: 0, guessOrchestraId: null, outcome: 'pending', points: 0 }],
  status: 'active',
  roundScore: 0
};
const session: Session = { id: 'session', rounds: [round, { ...round, index: 1 }, { ...round, index: 2 }], currentRoundIndex: 2, totalScore: 0, status: 'complete' };

describe('remaining components', () => {
  it('renders small shared components', () => {
    render(<><Footer onPrivacy={vi.fn()} /><RetryPanel message="Retry" onRetry={vi.fn()} onSkip={vi.fn()} /><ScoreBadge score={10} /><PotentialScore elapsedMs={1200} trackNumber={1} /></>);
    expect(screen.getAllByText('Retry')).toHaveLength(2);
    expect(screen.getByLabelText('Current score')).toHaveTextContent('10');
    expect(screen.getByLabelText('Potential score')).toHaveTextContent('pts if correct now');
  });
  it('renders unavailable, summary, and session states', () => {
    render(<><ServiceUnavailable onRetry={vi.fn()} /><RoundSummary round={round} orchestra={ORCHESTRAS[0]} isLastRound={false} onContinue={vi.fn()} /><SessionSummary session={session} onReplay={vi.fn()} /></>);
    expect(screen.getByText('Music service unavailable')).toBeInTheDocument();
    expect(screen.getByText('The orchestra was Carlos Di Sarli.')).toBeInTheDocument();
    expect(screen.getByText('Final score: 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument();
  });
  it('labels the round summary continue button "See final score" on the last round', () => {
    render(<RoundSummary round={round} orchestra={ORCHESTRAS[0]} isLastRound={true} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'See final score' })).toBeInTheDocument();
  });
  it('renders an active round and skip control when exhausted', () => {
    const exhausted = { ...round, attempts: [{ ...round.attempts[0], outcome: 'wrong' as const }], trackIds: ['track-1'] };
    render(<RoundScreen round={exhausted} tracks={[{ id: 'track-1', orchestraId: 'di-sarli', title: 'Clip', previewUrl: 'https://example.test/a.mp3', durationMs: 30000 }]} orchestras={ORCHESTRAS} elapsedMs={5000} awaitingContinue={false} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Guess the orchestra' })).toBeInTheDocument();
    expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument();
  });
  it('offers "Next track" once a non-final track finishes playing without a guess', () => {
    const ended = { ...round, attempts: [{ ...round.attempts[0], elapsedMs: 30000 }] };
    render(<RoundScreen round={ended} tracks={[{ id: 'track-1', orchestraId: 'di-sarli', title: 'Clip', previewUrl: 'https://example.test/a.mp3', durationMs: 30000 }]} orchestras={ORCHESTRAS} elapsedMs={30000} awaitingContinue={false} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next track' })).toBeInTheDocument();
  });
  it('offers "Next round" once the final track finishes playing without a guess', () => {
    const ended = { ...round, attempts: [{ ...round.attempts[0], trackNumber: 3 as const, elapsedMs: 30000 }] };
    render(<RoundScreen round={ended} tracks={[{ id: 'track-1', orchestraId: 'di-sarli', title: 'Clip', previewUrl: 'https://example.test/a.mp3', durationMs: 30000 }]} orchestras={ORCHESTRAS} elapsedMs={30000} awaitingContinue={false} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument();
  });
  it('shows a wrong-answer indication and gates the next track behind a manual continue', () => {
    const onContinue = vi.fn();
    render(<RoundScreen round={round} tracks={[{ id: 'track-1', orchestraId: 'di-sarli', title: 'Clip', previewUrl: 'https://example.test/a.mp3', durationMs: 30000 }]} orchestras={ORCHESTRAS} elapsedMs={0} awaitingContinue={true} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={onContinue} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Wrong answer');
    const choiceButtons = screen.getAllByRole('button', { name: /Di Sarli|Troilo|Pugliese/ });
    choiceButtons.forEach((button) => expect(button).toBeDisabled());
    const nextButton = screen.getByRole('button', { name: 'Next track' });
    nextButton.click();
    expect(onContinue).toHaveBeenCalledOnce();
  });
  it('labels the continue button "Next track" after a wrong guess when another track remains', () => {
    const midRound: Round = {
      ...round,
      trackIds: ['track-1', 'track-2', 'track-3'],
      attempts: [
        { trackNumber: 1, trackId: 'track-1', elapsedMs: 500, guessOrchestraId: 'troilo', outcome: 'wrong', points: -50 },
        { trackNumber: 2, trackId: 'track-2', elapsedMs: 0, guessOrchestraId: null, outcome: 'pending', points: 0 },
        { trackNumber: 3, trackId: 'track-3', elapsedMs: 0, guessOrchestraId: null, outcome: 'pending', points: 0 }
      ]
    };
    render(<RoundScreen round={midRound} tracks={[]} orchestras={ORCHESTRAS} elapsedMs={0} awaitingContinue={true} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next track' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next round' })).not.toBeInTheDocument();
  });
  it('labels the continue button "Next round" after a wrong guess on the final track', () => {
    const lastRound: Round = {
      ...round,
      trackIds: ['track-1', 'track-2', 'track-3'],
      attempts: [
        { trackNumber: 1, trackId: 'track-1', elapsedMs: 500, guessOrchestraId: 'troilo', outcome: 'wrong', points: -50 },
        { trackNumber: 2, trackId: 'track-2', elapsedMs: 500, guessOrchestraId: 'pugliese', outcome: 'wrong', points: -50 },
        { trackNumber: 3, trackId: 'track-3', elapsedMs: 500, guessOrchestraId: 'troilo', outcome: 'wrong', points: -50 }
      ]
    };
    render(<RoundScreen round={lastRound} tracks={[]} orchestras={ORCHESTRAS} elapsedMs={0} awaitingContinue={true} onGuess={vi.fn()} onSkip={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next track' })).not.toBeInTheDocument();
  });
});
