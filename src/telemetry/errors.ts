export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const reporter = (globalThis as { Sentry?: { captureException: (error: Error, context?: unknown) => void } }).Sentry;
  reporter?.captureException(new Error(message), { extra: context });
}

export function initialiseErrorReporting(): void {
  globalThis.addEventListener('error', (event) => reportError(event.error ?? event.message));
  globalThis.addEventListener('unhandledrejection', (event) => reportError(event.reason));
}
