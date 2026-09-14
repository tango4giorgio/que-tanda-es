export interface CountdownSoundPlayer {
  playPip(): Promise<void>;
  playFinalPip(): Promise<void>;
}

type CountdownSound = 'countdown-pip' | 'countdown-final';

export function createCountdownSoundPlayer(): CountdownSoundPlayer {
  let context: AudioContext | undefined;
  const buffers = new Map<CountdownSound, Promise<AudioBuffer>>();

  const loadBuffer = (sound: CountdownSound, audioContext: AudioContext) => {
    const existing = buffers.get(sound);
    if (existing) return existing;

    const loading = fetch(`${import.meta.env.BASE_URL}sounds/${sound}.wav`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${sound}`);
        return response.arrayBuffer();
      })
      .then((data) => audioContext.decodeAudioData(data));
    buffers.set(sound, loading);
    return loading;
  };

  const play = async (sound: CountdownSound): Promise<void> => {
    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') await context.resume();
      const source = context.createBufferSource();
      source.buffer = await loadBuffer(sound, context);
      source.connect(context.destination);
      source.start();
    } catch {
      // Countdown audio is optional; the visual countdown must continue.
    }
  };

  return {
    playPip: () => play('countdown-pip'),
    playFinalPip: () => play('countdown-final')
  };
}
