export function ScoreBadge({ score }: { score: number }) {
  return <p className="score" aria-label="Current score">Score: {score}</p>;
}
