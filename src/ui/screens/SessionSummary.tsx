import type { Session } from '../../game/types';

export function SessionSummary({ session, onReplay }: { session: Session; onReplay: () => void }) {
  return <main><h1>Session complete</h1><p>Final score: {session.totalScore}</p><ol>{session.rounds.map((round) => <li key={round.index}>Round {round.index + 1}: {round.roundScore}</li>)}</ol><button type="button" onClick={onReplay}>Play again</button></main>;
}
