export interface AudioPlayer {
  prepare(url: string): Promise<void>;
  playPrepared(): Promise<void>;
  prepareNext(url: string): Promise<void>;
  playNext(): Promise<void>;
  play(url: string): Promise<void>;
  getElapsedMs(): number;
  stop(): void;
  onEnded(handler: () => void): () => void;
  onError(handler: (error: Error) => void): () => void;
}

function prepareAudio(audio: HTMLAudioElement, url: string): Promise<void> {
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
}

export function createAudioPlayer(
  initialAudio: HTMLAudioElement = new Audio(),
  initialNextAudio: HTMLAudioElement = new Audio()
): AudioPlayer {
  let audio = initialAudio;
  let nextAudio = initialNextAudio;

  return {
    prepare(url) {
      return prepareAudio(audio, url);
    },
    async playPrepared() {
      await audio.play();
    },
    prepareNext(url) {
      return prepareAudio(nextAudio, url);
    },
    async playNext() {
      await nextAudio.play();
      const previousAudio = audio;
      audio = nextAudio;
      nextAudio = previousAudio;
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
      nextAudio.addEventListener('ended', handler);
      return () => {
        audio.removeEventListener('ended', handler);
        nextAudio.removeEventListener('ended', handler);
      };
    },
    onError: (handler) => {
      const listener = () => handler(new Error('Audio playback failed'));
      audio.addEventListener('error', listener);
      nextAudio.addEventListener('error', listener);
      return () => {
        audio.removeEventListener('error', listener);
        nextAudio.removeEventListener('error', listener);
      };
    }
  };
}
