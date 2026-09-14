export interface FeedbackSoundPlayer {
  playCorrect(): Promise<void>;
  playIncorrect(): Promise<void>;
}

type FeedbackSound = 'correct' | 'incorrect';

export function createFeedbackSoundPlayer(): FeedbackSoundPlayer {
  let context: AudioContext | undefined;
  const buffers = new Map<FeedbackSound, Promise<AudioBuffer>>();

  const loadBuffer = (sound: FeedbackSound, audioContext: AudioContext) => {
    const existing = buffers.get(sound);
    if (existing) return existing;

    const loading = fetch(`${import.meta.env.BASE_URL}sounds/${sound}.wav`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${sound} feedback sound`);
        return response.arrayBuffer();
      })
      .then((data) => audioContext.decodeAudioData(data));
    buffers.set(sound, loading);
    return loading;
  };

  const play = async (sound: FeedbackSound): Promise<void> => {
    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') await context.resume();

      const source = context.createBufferSource();
      source.buffer = await loadBuffer(sound, context);
      source.connect(context.destination);
      source.start();
    } catch {
      // Feedback audio is optional and must never interrupt gameplay.
    }
  };

  return {
    playCorrect: () => play('correct'),
    playIncorrect: () => play('incorrect')
  };
}
