import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerChoices } from '../../src/ui/components/AnswerChoices';
import { PrivacyNotice } from '../../src/ui/screens/PrivacyNotice';
import { StartScreen } from '../../src/ui/screens/StartScreen';
import { CountdownScreen } from '../../src/ui/screens/CountdownScreen';

describe('game screens', () => {
  it('renders start controls and privacy link', () => {
    render(<StartScreen onStart={vi.fn()} onPrivacy={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacy notice' })).toBeInTheDocument();
  });
  it('renders answer choices', () => {
    render(<AnswerChoices choices={[
      { id: 'di-sarli', displayName: 'Carlos Di Sarli' },
      { id: 'troilo', displayName: 'Anibal Troilo' },
      { id: 'pugliese', displayName: 'Osvaldo Pugliese' }
    ]} onSelect={vi.fn()} />);
    expect(screen.getByRole('group').getElementsByTagName('button')).toHaveLength(3);
  });
  it('renders privacy content', () => {
    render(<PrivacyNotice onBack={vi.fn()} />);
    expect(screen.getByText(/anonymous, cookieless analytics/i)).toBeInTheDocument();
  });
  it('renders an accessible round countdown without controls', () => {
    render(<CountdownScreen roundNumber={2} value={5} />);
    expect(screen.getByText('Round 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('5');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
