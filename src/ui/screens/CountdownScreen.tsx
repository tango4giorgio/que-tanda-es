export interface CountdownScreenProps {
  roundNumber: 1 | 2 | 3;
  value: 5 | 4 | 3 | 2 | 1;
}

export function CountdownScreen({ roundNumber, value }: CountdownScreenProps) {
  return <main className="countdown">
    <p>Round {roundNumber} of 3</p>
    <h1>Get ready</h1>
    <p className="countdown-value" role="status" aria-live="assertive">{value}</p>
  </main>;
}
