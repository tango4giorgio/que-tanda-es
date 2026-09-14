import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44_100;
const MAX_AMPLITUDE = 0.32;
const OUTPUT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/sounds');

interface ToneSegment {
  frequencyHz: number;
  durationSeconds: number;
}

function synthesiseWave(segments: ToneSegment[]): Buffer {
  const sampleCount = segments.reduce(
    (total, segment) => total + Math.round(segment.durationSeconds * SAMPLE_RATE),
    0
  );
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let sampleOffset = 0;
  for (const segment of segments) {
    const segmentSamples = Math.round(segment.durationSeconds * SAMPLE_RATE);
    for (let index = 0; index < segmentSamples; index += 1) {
      const progress = index / segmentSamples;
      const envelope = Math.sin(Math.PI * progress) ** 2;
      const sample = Math.sin(2 * Math.PI * segment.frequencyHz * index / SAMPLE_RATE);
      buffer.writeInt16LE(Math.round(sample * envelope * MAX_AMPLITUDE * 0x7fff), 44 + sampleOffset * 2);
      sampleOffset += 1;
    }
  }

  return buffer;
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await Promise.all([
  writeFile(
    resolve(OUTPUT_DIRECTORY, 'correct.wav'),
    synthesiseWave([
      { frequencyHz: 659.25, durationSeconds: 0.12 },
      { frequencyHz: 783.99, durationSeconds: 0.22 }
    ])
  ),
  writeFile(
    resolve(OUTPUT_DIRECTORY, 'incorrect.wav'),
    synthesiseWave([
      { frequencyHz: 293.66, durationSeconds: 0.14 },
      { frequencyHz: 220, durationSeconds: 0.24 }
    ])
  )
]);
