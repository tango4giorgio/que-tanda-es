import type { Orchestra, Round } from '../../game/types';

export function RoundSummary({ round, orchestra, isLastRound, onContinue }: { round: Round; orchestra: Orchestra; isLastRound: boolean; onContinue: () => void }) {
  return <main><h1>Round complete</h1><p>The orchestra was {orchestra.displayName}.</p><p>Round score: {round.roundScore}</p><button type="button" onClick={onContinue}>{isLastRound ? 'See final score' : 'Next round'}</button></main>;
}
