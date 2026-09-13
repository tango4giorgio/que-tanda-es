import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('App', () => {
  it('loads the catalogue and starts a guest session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App />);
    await waitFor(() => expect(screen.getByText('Loading music…')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
  });

  it('opens and closes the privacy notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Privacy notice' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Privacy notice' }));
    expect(screen.getByRole('heading', { name: 'Privacy notice' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to game' }));
    expect(screen.getByRole('heading', { name: 'Tango Track Guessing Game' })).toBeInTheDocument();
  });

  it('starts playback for the next round after continuing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByRole('button', { name: "Juan D'Arienzo" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: "Juan D'Arienzo" }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next round' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
  });

  it('resumes playback automatically after "Play again" is clicked on the session summary', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    // With Math.random fixed at 0, round order/correct answers are deterministic:
    // round 1 = Juan D'Arienzo, round 2 = Anibal Troilo, round 3 = Osvaldo Pugliese.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    for (const correctAnswer of ["Juan D'Arienzo", 'Anibal Troilo', 'Osvaldo Pugliese']) {
      await waitFor(() => expect(screen.getByRole('button', { name: correctAnswer })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: correctAnswer }));
      const continueButton = screen.queryByRole('button', { name: 'Next round' }) ?? screen.queryByRole('button', { name: 'See final score' });
      if (continueButton) fireEvent.click(continueButton);
    }

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument());
    const playsBeforeReplay = play.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    expect(play.mock.calls.length).toBe(playsBeforeReplay + 1);
  });

  it('advances the potential score preview while a round is playing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    let seconds = 0;
    vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'get').mockImplementation(() => (seconds += 1));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByLabelText('Potential score')).toHaveTextContent('300 pts if correct now'));
    await waitFor(() => expect(screen.getByLabelText('Potential score')).not.toHaveTextContent('300 pts if correct now'), { timeout: 2000 });
  });

  it('pauses on a wrong guess, shows an indication, and waits for a manual continue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    const playsAfterStart = play.mock.calls.length;
    const wrongChoice = screen.getAllByRole('button').find((button) => button.textContent !== "Juan D'Arienzo" && ['Carlos Di Sarli', "Juan D'Arienzo", 'Osvaldo Pugliese', 'Aníbal Troilo', 'Astor Piazzolla'].includes(button.textContent ?? ''))!;
    fireEvent.click(wrongChoice);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Wrong answer'));
    expect(screen.getByText(/Track 2 of up to 3/)).toBeInTheDocument();
    // Audio must not auto-advance to the next track until the player continues.
    expect(play.mock.calls.length).toBe(playsAfterStart);
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }));
    await waitFor(() => expect(play.mock.calls.length).toBe(playsAfterStart + 1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
