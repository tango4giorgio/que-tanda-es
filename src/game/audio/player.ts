export interface AudioPlayer {
  prepare(url: string): Promise<void>;
  playPrepared(): Promise<void>;
  play(url: string): Promise<void>;
  getElapsedMs(): number;
  stop(): void;
  onEnded(handler: () => void): () => void;
  onError(handler: (error: Error) => void): () => void;
}

export function createAudioPlayer(audio: HTMLAudioElement = new Audio()): AudioPlayer {
  return {
    prepare(url) {
      audio.preload = 'auto';
      audio.src = url;
      audio.currentTime = 0;
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          audio.removeEventListener('canplay', handleReady);
          audio.removeEventListener('error', handleError);
        };
        const handleReady = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error('Audio preparation failed'));
        };
        audio.addEventListener('canplay', handleReady, { once: true });
        audio.addEventListener('error', handleError, { once: true });
        audio.load();
      });
    },
    async playPrepared() {
      await audio.play();
    },
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
