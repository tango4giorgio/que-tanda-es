import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

const feedbackAudio = vi.hoisted(() => ({
  playCorrect: vi.fn().mockResolvedValue(undefined),
  playIncorrect: vi.fn().mockResolvedValue(undefined)
}));
const countdownAudio = vi.hoisted(() => ({
  playPip: vi.fn().mockResolvedValue(undefined),
  playFinalPip: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../src/game/audio/feedback-sound-player', () => ({
  createFeedbackSoundPlayer: () => feedbackAudio
}));
vi.mock('../../src/game/audio/countdown-sound-player', () => ({
  createCountdownSoundPlayer: () => countdownAudio
}));

describe('App', () => {
  beforeEach(() => {
    feedbackAudio.playCorrect.mockReset().mockResolvedValue(undefined);
    feedbackAudio.playIncorrect.mockReset().mockResolvedValue(undefined);
    countdownAudio.playPip.mockReset().mockResolvedValue(undefined);
    countdownAudio.playFinalPip.mockReset().mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('canplay'));
    });
  });

  it('loads the catalogue and starts a guest session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
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
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
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
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
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
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    const correctAnswers = ["Juan D'Arienzo", 'Anibal Troilo', 'Osvaldo Pugliese'];
    for (const [index, correctAnswer] of correctAnswers.entries()) {
      await waitFor(() => expect(screen.getByRole('button', { name: correctAnswer })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: correctAnswer }));
      const continueButtonName = index === correctAnswers.length - 1 ? 'See final score' : 'Next round';
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Round complete' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: continueButtonName }));
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
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
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
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    await waitFor(() => expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(2));
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

  it('keeps answer choices disabled until the prepared next track starts playing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    let resolveNextPlayback!: () => void;
    let playCount = 0;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      playCount += 1;
      if (playCount === 2) {
        return new Promise<void>((resolve) => {
          resolveNextPlayback = resolve;
        });
      }
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());

    const orchestraNames = ['Carlos Di Sarli', "Juan D'Arienzo", 'Osvaldo Pugliese', 'Aníbal Troilo', 'Astor Piazzolla'];
    const wrongChoice = screen.getAllByRole('button').find((button) =>
      button.textContent !== "Juan D'Arienzo" && orchestraNames.includes(button.textContent ?? '')
    )!;
    fireEvent.click(wrongChoice);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next track' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Next track' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Loading next track'));
    const loadingChoices = screen.getByRole('group', { name: 'Orchestra choices' }).querySelectorAll('button');
    for (const choice of loadingChoices) {
      expect(choice).toBeDisabled();
    }

    resolveNextPlayback();

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    const playingChoices = screen.getByRole('group', { name: 'Orchestra choices' }).querySelectorAll('button');
    for (const choice of playingChoices) {
      expect(choice).toBeEnabled();
    }
  });

  it('plays the correct feedback sound once for a correct answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByRole('button', { name: "Juan D'Arienzo" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: "Juan D'Arienzo" }));

    await waitFor(() => expect(feedbackAudio.playCorrect).toHaveBeenCalledTimes(1));
    expect(feedbackAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it('plays the incorrect feedback sound once for a wrong answer and stays silent on skip', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByRole('button', { name: "Juan D'Arienzo" })).toBeInTheDocument());
    const wrongChoice = screen.getAllByRole('button').find((button) =>
      ["Carlos Di Sarli", 'Anibal Troilo', 'Osvaldo Pugliese', 'Astor Piazzolla'].includes(button.textContent ?? '')
    )!;

    fireEvent.click(wrongChoice);

    await waitFor(() => expect(feedbackAudio.playIncorrect).toHaveBeenCalledTimes(1));
    expect(feedbackAudio.playCorrect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Next track' }));
    expect(feedbackAudio.playCorrect).not.toHaveBeenCalled();
    expect(feedbackAudio.playIncorrect).toHaveBeenCalledTimes(1);
  });

  it('continues gameplay if feedback sound playback rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    feedbackAudio.playIncorrect.mockRejectedValueOnce(new Error('blocked'));
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByRole('button', { name: "Juan D'Arienzo" })).toBeInTheDocument());
    const wrongChoice = screen.getAllByRole('button').find((button) =>
      ["Carlos Di Sarli", 'Anibal Troilo', 'Osvaldo Pugliese', 'Astor Piazzolla'].includes(button.textContent ?? '')
    )!;

    fireEvent.click(wrongChoice);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Wrong answer'));
    expect(screen.queryByText('Music service unavailable')).not.toBeInTheDocument();
  });

  it('completes a correct round if its feedback sound playback rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    feedbackAudio.playCorrect.mockRejectedValueOnce(new Error('blocked'));
    render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByRole('button', { name: "Juan D'Arienzo" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: "Juan D'Arienzo" }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Round complete' })).toBeInTheDocument());
    expect(screen.getByText(/Round score: [1-9]\d*/)).toBeInTheDocument();
    expect(screen.queryByText('Music service unavailable')).not.toBeInTheDocument();
  });

  it('shows a complete countdown and plays five pips plus the final pip', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    render(<App countdownStepMs={20} countdownEndPauseMs={30} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(screen.getByRole('status')).toHaveTextContent('5');
    for (const value of ['4', '3', '2', '1']) {
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(value), { interval: 2 });
    }
    await waitFor(() => expect(countdownAudio.playFinalPip).toHaveBeenCalledTimes(1), { interval: 2 });
    expect(screen.getByRole('status')).toHaveTextContent('1');
    expect(screen.queryByText(/Track 1 of up to 3/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    expect(countdownAudio.playPip).toHaveBeenCalledTimes(5);
    expect(countdownAudio.playFinalPip).toHaveBeenCalledTimes(1);
  });

  it('prepares during the countdown and starts playback only after it completes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('canplay'));
    });
    render(<App countdownStepMs={5} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(screen.getByRole('status')).toHaveTextContent('5');
    expect(load).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    await waitFor(() => expect(play).toHaveBeenCalledOnce());
  });

  it('reveals the round on time and starts playback when slow preparation finishes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    const audioElement = document.createElement('audio');
    audioElement.load = vi.fn();
    audioElement.play = vi.fn().mockResolvedValue(undefined);
    audioElement.pause = vi.fn();
    vi.stubGlobal('Audio', vi.fn(() => audioElement));
    render(<App countdownStepMs={5} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    expect(audioElement.play).not.toHaveBeenCalled();
    audioElement.dispatchEvent(new Event('canplay'));
    await waitFor(() => expect(audioElement.play).toHaveBeenCalledOnce());
  });

  it('shows service unavailable if current track preparation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    const audioElement = document.createElement('audio');
    audioElement.load = vi.fn();
    audioElement.play = vi.fn().mockResolvedValue(undefined);
    audioElement.pause = vi.fn();
    vi.stubGlobal('Audio', vi.fn(() => audioElement));
    render(<App countdownStepMs={5} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    audioElement.dispatchEvent(new Event('error'));

    await waitFor(() => expect(screen.getByText('Music service unavailable')).toBeInTheDocument());
  });

  it('does not start prepared playback after the app unmounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => import('../../public/catalogue/starter-catalogue.json').then((module) => module.default)
    }));
    const audioElement = document.createElement('audio');
    audioElement.load = vi.fn();
    audioElement.play = vi.fn().mockResolvedValue(undefined);
    audioElement.pause = vi.fn();
    vi.stubGlobal('Audio', vi.fn(() => audioElement));
    const { unmount } = render(<App countdownStepMs={1} countdownEndPauseMs={1} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(screen.getByText(/Track 1 of up to 3/)).toBeInTheDocument());
    unmount();
    audioElement.dispatchEvent(new Event('canplay'));
    await Promise.resolve();
    await Promise.resolve();

    expect(audioElement.play).not.toHaveBeenCalled();
  });
});
