import { describe, expect, it, vi } from 'vitest';
import { createAudioPlayer } from '../../src/game/audio/player';

describe('audio player', () => {
  it('plays and reads elapsed time', async () => {
    const audio = new Audio();
    audio.pause = vi.fn();
    audio.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, 'currentTime', { value: 2.5, writable: true });
    const player = createAudioPlayer(audio);
    await player.play('https://example.test/preview.mp3');
    expect(audio.play).toHaveBeenCalled();
    expect(player.getElapsedMs()).toBe(2500);
  });
  it('prepares a source without playing and then plays the prepared source', async () => {
    const audio = new Audio();
    audio.load = vi.fn();
    audio.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, 'readyState', {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_NOTHING
    });
    const player = createAudioPlayer(audio);
    const preparation = player.prepare('https://example.test/prepared.mp3');

    expect(audio.preload).toBe('auto');
    expect(audio.src).toBe('https://example.test/prepared.mp3');
    expect(audio.load).toHaveBeenCalledOnce();
    expect(audio.play).not.toHaveBeenCalled();
    expect(player.getElapsedMs()).toBe(0);

    audio.dispatchEvent(new Event('canplay'));
    await expect(preparation).resolves.toBeUndefined();
    await player.playPrepared();
    expect(audio.play).toHaveBeenCalledOnce();
  });
  it('rejects preparation errors and cleans up readiness listeners', async () => {
    const audio = new Audio();
    audio.load = vi.fn();
    const removeEventListener = vi.spyOn(audio, 'removeEventListener');
    const player = createAudioPlayer(audio);
    const preparation = player.prepare('https://example.test/broken.mp3');

    audio.dispatchEvent(new Event('error'));

    await expect(preparation).rejects.toThrow('Audio preparation failed');
    expect(removeEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });
  it('prepares the next source without interrupting active playback and promotes it after playback starts', async () => {
    const active = new Audio();
    const next = new Audio();
    active.play = vi.fn().mockResolvedValue(undefined);
    active.pause = vi.fn();
    next.load = vi.fn();
    next.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(next, 'readyState', {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_NOTHING
    });
    Object.defineProperty(active, 'currentTime', { value: 3, writable: true });
    Object.defineProperty(next, 'currentTime', { value: 0, writable: true });
    const player = createAudioPlayer(active, next);

    await player.play('https://example.test/current.mp3');
    const preparation = player.prepareNext('https://example.test/next.mp3');

    expect(active.pause).not.toHaveBeenCalled();
    expect(active.src).toBe('https://example.test/current.mp3');
    expect(next.src).toBe('https://example.test/next.mp3');
    expect(next.play).not.toHaveBeenCalled();

    next.dispatchEvent(new Event('canplay'));
    await preparation;
    await player.playNext();

    Object.defineProperty(next, 'currentTime', { value: 1.5, writable: true });
    expect(player.getElapsedMs()).toBe(1500);
  });
  it('stops and supports ended/error subscriptions', () => {
    const audio = new Audio();
    audio.pause = vi.fn();
    const player = createAudioPlayer(audio);
    const ended = vi.fn();
    const error = vi.fn();
    player.onEnded(ended);
    player.onError(error);
    audio.dispatchEvent(new Event('ended'));
    audio.dispatchEvent(new Event('error'));
    expect(ended).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    player.stop();
    expect(audio.currentTime).toBe(0);
  });
});
