import { Footer } from '../components/Footer';

export function StartScreen({ onStart, onPrivacy }: { onStart: () => void; onPrivacy: () => void }) {
  return <main><h1>Tango Track Guessing Game</h1><p>Listen to a tango clip and identify the orchestra.</p><button type="button" onClick={onStart}>Start game</button><Footer onPrivacy={onPrivacy} /></main>;
}
