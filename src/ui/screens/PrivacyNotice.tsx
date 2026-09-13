export function PrivacyNotice({ onBack }: { onBack: () => void }) {
  return <main><h1>Privacy notice</h1><p>This game uses anonymous, cookieless analytics and error reporting to improve reliability. It has no accounts and does not set non-essential cookies.</p><button type="button" onClick={onBack}>Back to game</button></main>;
}
