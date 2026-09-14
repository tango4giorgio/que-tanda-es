import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCountdownSoundPlayer } from '../../src/game/audio/countdown-sound-player';

const start = vi.fn();
const connect = vi.fn();
const decodeAudioData = vi.fn();
const resume = vi.fn();
let contextState: AudioContextState;

class MockAudioContext {
  state = contextState;
  destination = {} as AudioDestinationNode;
  createBufferSource = vi.fn(() => ({ buffer: null, connect, start }));
  decodeAudioData = decodeAudioData;
  resume = resume;
}

describe('countdown sound player', () => {
  beforeEach(() => {
    contextState = 'running';
    start.mockReset();
    connect.mockReset();
    decodeAudioData.mockReset().mockResolvedValue({} as AudioBuffer);
    resume.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('Audio', vi.fn(() => {
      throw new Error('Countdown sounds must not use HTMLAudioElement');
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
    }));
  });

  it('loads and plays distinct pip and final-pip assets', async () => {
    const player = createCountdownSoundPlayer();

    await player.playPip();
    await player.playFinalPip();

    expect(fetch).toHaveBeenNthCalledWith(1, '/sounds/countdown-pip.wav');
    expect(fetch).toHaveBeenNthCalledWith(2, '/sounds/countdown-final.wav');
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('decodes each asset only once', async () => {
    const player = createCountdownSoundPlayer();

    await player.playPip();
    await player.playPip();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['resume', () => {
      contextState = 'suspended';
      resume.mockRejectedValueOnce(new Error('blocked'));
    }],
    ['fetch', () => vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'))],
    ['response', () => vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)],
    ['decode', () => decodeAudioData.mockRejectedValueOnce(new Error('invalid'))],
    ['playback', () => start.mockImplementationOnce(() => {
      throw new Error('failed');
    })]
  ])('does not reject when %s fails', async (_name, arrange) => {
    arrange();
    await expect(createCountdownSoundPlayer().playPip()).resolves.toBeUndefined();
  });
});
