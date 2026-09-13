export const ORCHESTRA_IDS = ['di-sarli', 'darienzo', 'troilo', 'pugliese', 'piazzolla'] as const;
export type OrchestraId = typeof ORCHESTRA_IDS[number];

export interface Orchestra {
  id: OrchestraId;
  displayName: string;
}

export interface Track {
  id: string;
  orchestraId: OrchestraId;
  title: string;
  previewUrl: string;
  durationMs: number;
}

export interface Catalogue {
  version: string;
  generatedAt: string;
  orchestras: Orchestra[];
  tracks: Track[];
}

export type AttemptOutcome = 'correct' | 'wrong' | 'pending' | 'skipped';
export interface TrackAttempt {
  trackNumber: 1 | 2 | 3;
  trackId: string;
  elapsedMs: number;
  guessOrchestraId: OrchestraId | null;
  outcome: AttemptOutcome;
  points: number;
}

export interface Round {
  index: 0 | 1 | 2;
  correctOrchestraId: OrchestraId;
  choiceOrchestraIds: OrchestraId[];
  trackIds: string[];
  attempts: TrackAttempt[];
  status: 'active' | 'won' | 'exhausted';
  roundScore: number;
}

export interface Session {
  id: string;
  rounds: Round[];
  currentRoundIndex: 0 | 1 | 2;
  totalScore: number;
  status: 'in-progress' | 'complete';
}

export interface Player {
  type: 'guest';
}
