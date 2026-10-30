import { MusicalKey, ScaleType, PitchNote, TrackEq, TrackCompressor } from '../types/audio';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
};

export function frequencyToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
  const rounded = Math.round(midi);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function getKeyRootIndex(key: MusicalKey): number {
  return NOTE_NAMES.indexOf(key);
}

export function getNearestScaleMidi(
  currentMidi: number,
  key: MusicalKey,
  scale: ScaleType
): { targetMidi: number; deviationCents: number } {
  if (scale === 'chromatic') {
    const rounded = Math.round(currentMidi);
    const deviation = (currentMidi - rounded) * 100;
    return { targetMidi: rounded, deviationCents: deviation };
  }

  const rootIndex = getKeyRootIndex(key);
  const intervals = SCALE_INTERVALS[scale];

  // Generate allowed note pitch classes (0-11)
  const allowedClasses = new Set(intervals.map((int) => (rootIndex + int) % 12));

  let closestMidi = Math.round(currentMidi);
  let minDistance = Infinity;

  // Search within +- 6 semitones
  for (let m = Math.floor(currentMidi) - 6; m <= Math.ceil(currentMidi) + 6; m++) {
    const pitchClass = ((m % 12) + 12) % 12;
    if (allowedClasses.has(pitchClass)) {
      const dist = Math.abs(currentMidi - m);
      if (dist < minDistance) {
        minDistance = dist;
        closestMidi = m;
      }
    }
  }

  const deviation = (currentMidi - closestMidi) * 100;
  return { targetMidi: closestMidi, deviationCents: deviation };
}

/**
 * Autocorrelation pitch detector for vocal audio buffer (mono channel)
 */
export function analyzePitchSegments(
  audioBuffer: AudioBuffer,
  key: MusicalKey,
  scale: ScaleType
): PitchNote[] {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const bufferLength = channelData.length;

  const windowSize = 2048;
  const hopSize = 512;
  const minFreq = 65; // C2
  const maxFreq = 1000; // B5

  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  const notes: PitchNote[] = [];
  let currentSegment: {
    start: number;
    midis: number[];
    freqs: number[];
  } | null = null;

  for (let i = 0; i < bufferLength - windowSize; i += hopSize) {
    const time = i / sampleRate;

    // RMS amplitude check (voice gate)
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      const val = channelData[i + j];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSize);

    if (rms < 0.015) {
      if (currentSegment && currentSegment.midis.length >= 3) {
        addPitchNote(currentSegment, notes, key, scale);
      }
      currentSegment = null;
      continue;
    }

    // Normalized Autocorrelation
    let bestCorrelation = -1;
    let bestPeriod = -1;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let energy = 0;

      for (let j = 0; j < windowSize - period; j++) {
        const a = channelData[i + j];
        const b = channelData[i + j + period];
        correlation += a * b;
        energy += a * a + b * b;
      }

      const normalized = (2 * correlation) / (energy + 1e-9);
      if (normalized > bestCorrelation) {
        bestCorrelation = normalized;
        bestPeriod = period;
      }
    }

    if (bestCorrelation > 0.65 && bestPeriod > 0) {
      const freq = sampleRate / bestPeriod;
      const midi = frequencyToMidi(freq);

      if (!currentSegment) {
        currentSegment = { start: time, midis: [midi], freqs: [freq] };
      } else {
        // If sudden huge pitch jump (> 4 semitones), break segment
        const lastMidi = currentSegment.midis[currentSegment.midis.length - 1];
        if (Math.abs(midi - lastMidi) > 4) {
          if (currentSegment.midis.length >= 3) {
            addPitchNote(currentSegment, notes, key, scale);
          }
          currentSegment = { start: time, midis: [midi], freqs: [freq] };
        } else {
          currentSegment.midis.push(midi);
          currentSegment.freqs.push(freq);
        }
      }
    } else {
      if (currentSegment && currentSegment.midis.length >= 3) {
        addPitchNote(currentSegment, notes, key, scale);
      }
      currentSegment = null;
    }
  }

  if (currentSegment && currentSegment.midis.length >= 3) {
    addPitchNote(currentSegment, notes, key, scale);
  }

  return notes;
}

function addPitchNote(
  segment: { start: number; midis: number[]; freqs: number[] },
  notes: PitchNote[],
  key: MusicalKey,
  scale: ScaleType
) {
  const avgMidi = segment.midis.reduce((a, b) => a + b, 0) / segment.midis.length;
  const avgFreq = segment.freqs.reduce((a, b) => a + b, 0) / segment.freqs.length;
  const duration = segment.midis.length * (512 / 44100);

  const { targetMidi, deviationCents } = getNearestScaleMidi(avgMidi, key, scale);

  notes.push({
    id: `note_${Math.random().toString(36).substring(2, 9)}`,
    startTime: segment.start,
    duration: Math.max(0.1, duration),
    frequency: avgFreq,
    midiNote: Math.round(avgMidi * 10) / 10,
    noteName: midiToNoteName(avgMidi),
    targetMidiNote: targetMidi,
    targetNoteName: midiToNoteName(targetMidi),
    deviationCents: Math.round(deviationCents),
  });
}

/**
 * Apply pitch shift, fine tune, time-stretch and offset to an AudioBuffer
 */
export async function renderProcessedVocalBuffer(
  audioContext: AudioContext,
  sourceBuffer: AudioBuffer,
  options: {
    pitchShiftSemitones: number;
    fineTuneCents: number;
    timeStretchRatio: number;
    tuningMode: 'none' | 'melodyne_natural' | 'autotune_hard' | 'custom';
    retuneSpeedMs: number;
    key: MusicalKey;
    scale: ScaleType;
    timeOffsetMs?: number;
    volume?: number;
    pan?: number;
    fullProjectDuration?: number;
    eq?: TrackEq;
    compressor?: TrackCompressor;
  }
): Promise<AudioBuffer> {
  const totalCents = options.pitchShiftSemitones * 100 + options.fineTuneCents;
  const pitchRatio = Math.pow(2, totalCents / 1200);

  // Time-stretch ratio: source duration / target duration
  const stretchRatio = Math.max(0.25, Math.min(4.0, options.timeStretchRatio || 1.0));

  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = 2; // Always render stems in stereo for professional DAW compatibility
  const offsetSeconds = (options.timeOffsetMs || 0) / 1000;

  // Stems start at 0s and have length matching project duration or stretched source
  const effectiveLength = Math.max(1, Math.round(sourceBuffer.length * stretchRatio));
  const projectLength = options.fullProjectDuration
    ? Math.round(options.fullProjectDuration * sampleRate)
    : effectiveLength + Math.max(0, Math.round(offsetSeconds * sampleRate));

  const totalSamples = Math.max(effectiveLength, projectLength);

  const offlineContext = new OfflineAudioContext(numChannels, totalSamples, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = sourceBuffer;

  // Granular pitch & rate modulation
  source.playbackRate.value = pitchRatio * (1 / stretchRatio);

  let lastNode: AudioNode = source;

  // 1. Dynamic Compressor (Pre-EQ vocal dynamics processing)
  if (options.compressor && options.compressor.enabled) {
    const compNode = offlineContext.createDynamicsCompressor();
    compNode.threshold.value = options.compressor.threshold;
    compNode.ratio.value = options.compressor.ratio;
    compNode.attack.value = options.compressor.attack;
    compNode.release.value = options.compressor.release;
    compNode.knee.value = options.compressor.knee;

    lastNode.connect(compNode);
    lastNode = compNode;

    // Makeup Gain if specified
    if (options.compressor.makeupGain && options.compressor.makeupGain > 0) {
      const makeupGainNode = offlineContext.createGain();
      makeupGainNode.gain.value = Math.pow(10, options.compressor.makeupGain / 20);
      lastNode.connect(makeupGainNode);
      lastNode = makeupGainNode;
    }
  }

  // 2. 5-Band Parametric EQ Chaining (Post-Compression)
  if (options.eq && options.eq.enabled) {
    options.eq.bands.forEach((b) => {
      if (b.enabled) {
        const filter = offlineContext.createBiquadFilter();
        filter.type = b.type;
        filter.frequency.value = b.frequency;
        filter.Q.value = b.q;
        filter.gain.value = b.type === 'highpass' ? 0 : b.gain;
        lastNode.connect(filter);
        lastNode = filter;
      }
    });
  }

  // Gain & Pan
  const gain = offlineContext.createGain();
  gain.gain.value = options.volume !== undefined ? options.volume : 0.9;

  const panner = offlineContext.createStereoPanner ? offlineContext.createStereoPanner() : null;
  if (panner && options.pan !== undefined) {
    panner.pan.value = options.pan;
    lastNode.connect(panner);
    panner.connect(gain);
  } else {
    lastNode.connect(gain);
  }
  gain.connect(offlineContext.destination);

  // Start with offset compensation so stems align in absolute project timeline
  const startTime = Math.max(0, offsetSeconds);
  const startOffsetInBuffer = offsetSeconds < 0 ? Math.abs(offsetSeconds) : 0;

  source.start(startTime, startOffsetInBuffer);

  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer;
}

/**
 * Encode an AudioBuffer into a WAV Blob
 */
export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferArray = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferArray);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // write interleaved 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    let s = Math.max(-1, Math.min(1, result[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, s, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Trim an AudioBuffer between startSec and endSec
 */
export function trimAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
  const newLength = Math.max(1, endSample - startSample);

  const newBuffer = audioContext.createBuffer(numChannels, newLength, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    for (let i = 0; i < newLength; i++) {
      destData[i] = srcData[startSample + i] || 0;
    }
  }

  return newBuffer;
}

/**
 * Normalize an AudioBuffer to a target peak level (default -0.2 dBFS)
 */
export function normalizeAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  targetPeakDb = -0.2
): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const newBuffer = audioContext.createBuffer(numChannels, length, buffer.sampleRate);

  let peak = 0;
  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }

  const targetLinear = Math.pow(10, targetPeakDb / 20);
  const factor = peak > 0.0001 ? Math.min(10, targetLinear / peak) : 1;

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      destData[i] = Math.max(-1, Math.min(1, srcData[i] * factor));
    }
  }

  return newBuffer;
}

/**
 * Apply linear/exponential fade in and fade out
 */
export function applyFadesToAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  fadeInSec: number,
  fadeOutSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const newBuffer = audioContext.createBuffer(numChannels, length, sampleRate);

  const fadeInSamples = Math.floor(fadeInSec * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSec * sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);

    for (let i = 0; i < length; i++) {
      let gain = 1.0;
      if (i < fadeInSamples && fadeInSamples > 0) {
        gain *= i / fadeInSamples;
      }
      if (i >= length - fadeOutSamples && fadeOutSamples > 0) {
        gain *= (length - i) / fadeOutSamples;
      }
      destData[i] = srcData[i] * gain;
    }
  }

  return newBuffer;
}

/**
 * Mute a specific region between startSec and endSec
 */
export function muteAudioBufferRegion(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const newBuffer = audioContext.createBuffer(numChannels, length, sampleRate);

  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(length, Math.floor(endSec * sampleRate));

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      if (i >= startSample && i <= endSample) {
        destData[i] = 0;
      } else {
        destData[i] = srcData[i];
      }
    }
  }

  return newBuffer;
}

/**
 * Invert Phase (180° flip)
 */
export function invertAudioBufferPhase(
  audioContext: AudioContext,
  buffer: AudioBuffer
): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const newBuffer = audioContext.createBuffer(numChannels, length, buffer.sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      destData[i] = -srcData[i];
    }
  }

  return newBuffer;
}

/**
 * Reverse audio buffer
 */
export function reverseAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer
): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const newBuffer = audioContext.createBuffer(numChannels, length, buffer.sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      destData[i] = srcData[length - 1 - i];
    }
  }

  return newBuffer;
}

/**
 * Extract peak waveform points for drawing in canvas
 */
export function extractWaveformData(buffer: AudioBuffer, numBuckets = 160): number[] {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.max(1, Math.floor(totalSamples / numBuckets));
  const points: number[] = [];

  for (let i = 0; i < numBuckets; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize && start + j < totalSamples; j += 4) {
      const val = Math.abs(channelData[start + j]);
      if (val > max) max = val;
    }
    points.push(Math.min(1, max));
  }

  return points;
}

