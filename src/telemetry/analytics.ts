export type AnalyticsEvent =
  | { name: 'app_loaded'; properties: { msToInteractive: number } }
  | { name: 'session_start'; properties: { sessionId: string } }
  | { name: 'round_complete'; properties: { sessionId: string; roundIndex: number; outcome: 'won' | 'exhausted'; roundScore: number } }
  | { name: 'session_complete'; properties: { sessionId: string; totalScore: number } };

export function track(event: AnalyticsEvent): void {
  const plausible = (globalThis as { plausible?: (name: string, options: unknown) => void }).plausible;
  plausible?.(event.name, { props: event.properties });
}
