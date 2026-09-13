export function RetryPanel({ message, onRetry, onSkip }: { message: string; onRetry: () => void; onSkip: () => void }) {
  return <section role="alert"><p>{message}</p><button type="button" onClick={onRetry}>Retry</button><button type="button" onClick={onSkip}>Skip</button></section>;
}
