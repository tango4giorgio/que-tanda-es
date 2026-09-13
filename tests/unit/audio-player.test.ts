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
