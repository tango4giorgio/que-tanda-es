const BOUNDS = {
  1: { max: 300, min: 100 },
  2: { max: 200, min: 75 },
  3: { max: 100, min: 50 }
} as const;

export function scoreCorrect(trackNumber: 1 | 2 | 3, elapsedMs: number): number {
  const { max, min } = BOUNDS[trackNumber];
  if (elapsedMs <= 1000) return max;
  if (elapsedMs >= 30000) return min;
  const ratio = (elapsedMs - 1000) / 29000;
  return Math.round(max - (max - min) * ratio);
}

export const WRONG_GUESS_POINTS = -50;
export const SKIP_POINTS = 0;
