export interface AudioPlayer {
  play(url: string): Promise<void>;
  getElapsedMs(): number;
  stop(): void;
  onEnded(handler: () => void): () => void;
  onError(handler: (error: Error) => void): () => void;
}

export function createAudioPlayer(audio: HTMLAudioElement = new Audio()): AudioPlayer {
  return {
    async play(url) {
      audio.src = url;
      await audio.play();
    },
    getElapsedMs: () => audio.currentTime * 1000,
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    onEnded: (handler) => {
      audio.addEventListener('ended', handler);
      return () => audio.removeEventListener('ended', handler);
    },
    onError: (handler) => {
      const listener = () => handler(new Error('Audio playback failed'));
      audio.addEventListener('error', listener);
      return () => audio.removeEventListener('error', listener);
    }
  };
}
