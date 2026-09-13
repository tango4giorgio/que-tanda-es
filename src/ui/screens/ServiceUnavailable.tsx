export function ServiceUnavailable({ onRetry }: { onRetry: () => void }) {
  return <main><h1>Music service unavailable</h1><p>We could not load a playable preview. Please try again.</p><button type="button" onClick={onRetry}>Retry</button></main>;
}
