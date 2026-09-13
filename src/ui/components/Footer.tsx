export function Footer({ onPrivacy }: { onPrivacy: () => void }) {
  return <footer><button type="button" onClick={onPrivacy}>Privacy notice</button></footer>;
}
