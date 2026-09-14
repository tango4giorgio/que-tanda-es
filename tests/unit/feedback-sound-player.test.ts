import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFeedbackSoundPlayer } from '../../src/game/audio/feedback-sound-player';

const start = vi.fn();
const connect = vi.fn();
const createBufferSource = vi.fn(() => ({
  buffer: null,
  connect,
  start
}));
const resume = vi.fn().mockResolvedValue(undefined);
const decodeAudioData = vi.fn();
let contextState: AudioContextState;

class MockAudioContext {
  state = contextState;
  destination = {} as AudioDestinationNode;
  createBufferSource = createBufferSource;
  decodeAudioData = decodeAudioData;
  resume = resume;
}

describe('feedback sound player', () => {
  beforeEach(() => {
    contextState = 'running';
    decodeAudioData.mockResolvedValue({} as AudioBuffer);
    resume.mockResolvedValue(undefined);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('Audio', vi.fn(() => {
      throw new Error('Feedback sounds must not use HTMLAudioElement');
    }));
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
      }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('plays distinct correct and incorrect sound assets through Web Audio', async () => {
    const player = createFeedbackSoundPlayer();

    await player.playCorrect();
    await player.playIncorrect();

    expect(fetch).toHaveBeenNthCalledWith(1, '/sounds/correct.wav');
    expect(fetch).toHaveBeenNthCalledWith(2, '/sounds/incorrect.wav');
    expect(decodeAudioData).toHaveBeenCalledTimes(2);
    expect(createBufferSource).toHaveBeenCalledTimes(2);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('caches each decoded sound for later plays', async () => {
    const player = createFeedbackSoundPlayer();

    await player.playCorrect();
    await player.playCorrect();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['context resume', () => {
      contextState = 'suspended';
      resume.mockRejectedValueOnce(new Error('blocked'));
    }],
    ['asset fetch', () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    }],
    ['asset response', () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    }],
    ['asset decoding', () => {
      decodeAudioData.mockRejectedValueOnce(new Error('invalid audio'));
    }],
    ['buffer playback', () => {
      start.mockImplementationOnce(() => {
        throw new Error('playback failed');
      });
    }]
  ])('does not reject when %s fails', async (_name, arrange) => {
    arrange();
    const player = createFeedbackSoundPlayer();

    await expect(player.playCorrect()).resolves.toBeUndefined();
  });
});
