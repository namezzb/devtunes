const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

interface ToneConfig {
  frequency: number;
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  bassFrequency?: number;
}

const TONE_MAP: Record<string, ToneConfig> = {
  '1': { frequency: 261.63, waveform: 'sine' },
  '2': { frequency: 329.63, waveform: 'triangle' },
  '3': { frequency: 392.00, waveform: 'sine', bassFrequency: 196.00 },
  '4': { frequency: 440.00, waveform: 'sawtooth' },
};

const DEFAULT_TONE: ToneConfig = { frequency: 349.23, waveform: 'sine' };

function generateSample(
  t: number,
  frequency: number,
  waveform: ToneConfig['waveform'],
  duration: number,
): number {
  const phase = (2 * Math.PI * frequency * t) / SAMPLE_RATE;
  const envelope = Math.max(0, 1 - t / (SAMPLE_RATE * duration) * 0.8);

  switch (waveform) {
    case 'sine':
      return Math.sin(phase) * envelope;
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase)) * envelope;
    case 'square':
      return (Math.sin(phase) > 0 ? 1 : -1) * 0.5 * envelope;
    case 'sawtooth':
      return (2 * ((phase % (2 * Math.PI)) / (2 * Math.PI) - 0.5)) * envelope;
  }
}

function generateWavData(trackId: string, durationSec: number = 6): Uint8Array {
  const config = TONE_MAP[trackId] || DEFAULT_TONE;
  const numSamples = SAMPLE_RATE * durationSec;
  const bytesPerSample = BITS_PER_SAMPLE / 8;
  const dataSize = numSamples * NUM_CHANNELS * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  function writeAscii(offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  const byteRate = SAMPLE_RATE * NUM_CHANNELS * bytesPerSample;
  const blockAlign = NUM_CHANNELS * bytesPerSample;

  writeAscii(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, NUM_CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let sample = generateSample(i, config.frequency, config.waveform, durationSec);

    if (config.bassFrequency) {
      sample += generateSample(i, config.bassFrequency, 'sine', durationSec) * 0.3;
    }

    const clamped = Math.max(-1, Math.min(1, sample * 0.4));
    const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

export function getDemoAudioUrl(trackId: string): string {
  const wavData = generateWavData(trackId);
  const blob = new Blob([wavData.buffer as ArrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

const demoUrlCache = new Map<string, string>();

export function getCachedDemoAudioUrl(trackId: string): string {
  if (!demoUrlCache.has(trackId)) {
    demoUrlCache.set(trackId, getDemoAudioUrl(trackId));
  }
  return demoUrlCache.get(trackId)!;
}

export function cleanupDemoAudioUrls(): void {
  demoUrlCache.forEach((url) => URL.revokeObjectURL(url));
  demoUrlCache.clear();
}
