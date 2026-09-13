import type { Catalogue, OrchestraId, Session } from '../types';
import { buildRound, pickSessionOrchestras } from './selection';
import { scoreCorrect, SKIP_POINTS, WRONG_GUESS_POINTS } from './scoring';

export type SessionEvent =
  | { type: 'GUESS_CORRECT'; elapsedMs: number; orchestraId: OrchestraId }
  | { type: 'GUESS_WRONG'; orchestraId: OrchestraId }
  | { type: 'SKIP' }
  | { type: 'TRACK_ENDED' }
  | { type: 'NEXT_ROUND' };

export function createSession(catalogue: Catalogue, rng = Math.random): Session {
  const orchestras = pickSessionOrchestras(rng);
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`,
    rounds: orchestras.map((orchestraId, index) => buildRound(index as 0 | 1 | 2, orchestraId, catalogue, rng)),
    currentRoundIndex: 0,
    totalScore: 0,
    status: 'in-progress'
  };
}

function currentAttempt(session: Session) {
  const round = session.rounds[session.currentRoundIndex];
  return { round, attempt: round.attempts.find((item) => item.outcome === 'pending') };
}

export function reduceSession(session: Session, event: SessionEvent): Session {
  if (session.status === 'complete') return session;
  const next: Session = structuredClone(session);
  const round = next.rounds[next.currentRoundIndex];
  if (event.type === 'SKIP' && round.status === 'active') {
    const pendingAttempt = round.attempts.find((item) => item.outcome === 'pending');
    if (pendingAttempt) {
      pendingAttempt.outcome = 'skipped';
      pendingAttempt.points = SKIP_POINTS;
      round.roundScore += SKIP_POINTS;
    }
    if (round.attempts.every((item) => item.outcome !== 'pending')) {
      round.status = 'exhausted';
      next.totalScore = next.rounds.reduce((sum, item) => sum + item.roundScore, 0);
      if (next.currentRoundIndex === 2) next.status = 'complete';
    }
    return next;
  }
  const { attempt } = currentAttempt(next);
  if (!attempt) return next;

  if (event.type === 'GUESS_CORRECT') {
    attempt.elapsedMs = Math.max(0, event.elapsedMs);
    attempt.guessOrchestraId = event.orchestraId;
    attempt.outcome = 'correct';
    attempt.points = scoreCorrect(attempt.trackNumber, attempt.elapsedMs);
    round.roundScore += attempt.points;
    round.status = 'won';
  } else if (event.type === 'GUESS_WRONG') {
    attempt.guessOrchestraId = event.orchestraId;
    attempt.outcome = 'wrong';
    attempt.points = WRONG_GUESS_POINTS;
    round.roundScore += WRONG_GUESS_POINTS;
  } else if (event.type === 'TRACK_ENDED') {
    attempt.elapsedMs = 30000;
  }

  if (round.status !== 'active') {
    next.totalScore = next.rounds.reduce((sum, item) => sum + item.roundScore, 0);
    if (next.currentRoundIndex === 2) next.status = 'complete';
  }
  return next;
}
