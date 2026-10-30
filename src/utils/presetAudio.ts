import { VocalTrack } from '../types/audio';
import { analyzePitchSegments } from './audioDsp';
import { createDefaultTrackEq, createDefaultTrackCompressor } from './eqCalculations';

/**
 * Creates up to 8 preset synthetic vocal audio tracks simulating multi-track singing and dubbing
 */
export async function createPresetVocalTracks(audioContext: AudioContext, count = 8): Promise<VocalTrack[]> {
  const sampleRate = audioContext.sampleRate;
  const duration = 6.0; // 6 seconds phrase
  const numSamples = Math.floor(sampleRate * duration);

  const colors = [
    '#0ea5e9', // 1: Sky Blue
    '#8b5cf6', // 2: Purple / Violet
    '#10b981', // 3: Emerald
    '#f59e0b', // 4: Amber
    '#ec4899', // 5: Pink
    '#06b6d4', // 6: Cyan
    '#6366f1', // 7: Indigo
    '#f97316', // 8: Orange
  ];

  // Helper to create empty or synthetic buffer
  const generateTrack = (
    id: string,
    name: string,
    role: 'lead' | 'harmony' | 'backing' | 'dubbing',
    idx: number,
    melodyNotes: { freq: number; start: number; dur: number; vowel: string }[] | null,
    speechNotes: { freq: number; start: number; dur: number }[] | null,
    tuningMode: 'melodyne_natural' | 'autotune_hard' | 'none',
    retuneSpeedMs: number,
    pan = 0,
    volume = 0.85
  ): VocalTrack => {
    const buffer = audioContext.createBuffer(2, numSamples, sampleRate);

    if (melodyNotes) {
      generateVocalMelody(buffer, melodyNotes);
    } else if (speechNotes) {
      generateVocalSpeech(buffer, speechNotes);
    }

    const detected = analyzePitchSegments(buffer, 'C', 'major');

    return {
      id,
      name,
      role,
      color: colors[idx % colors.length],
      audioBuffer: buffer,
      duration,
      muted: false,
      solo: false,
      volume,
      pan,
      tuningMode,
      musicalKey: 'C',
      scaleType: 'major',
      retuneSpeedMs,
      pitchShiftSemitones: 0,
      fineTuneCents: 0,
      formantShift: 0,
      vibratoDepth: 15,
      sourceBpm: 120,
      targetBpm: 120,
      quantizeDivision: '1/8',
      timeStretchRatio: 1.0,
      detectedNotes: detected,
      isProcessing: false,
      isSelectedForUnison: true,
      eq: createDefaultTrackEq(),
      compressor: createDefaultTrackCompressor(),
    };
  };

  const all8Tracks: VocalTrack[] = [
    // 1. Lead Vocal (Melody C4 - D4 - E4 - G4 - F4)
    generateTrack(
      'track_1_lead',
      'Pista 1: Voz Principal (Lead)',
      'lead',
      0,
      [
        { freq: 261.63, start: 0.2, dur: 1.1, vowel: 'a' }, // C4
        { freq: 293.66, start: 1.3, dur: 0.9, vowel: 'e' }, // D4
        { freq: 329.63, start: 2.2, dur: 1.2, vowel: 'o' }, // E4
        { freq: 392.00, start: 3.4, dur: 1.3, vowel: 'u' }, // G4
        { freq: 349.23, start: 4.7, dur: 1.1, vowel: 'a' }, // F4
      ],
      null,
      'melodyne_natural',
      25,
      0,
      0.95
    ),

    // 2. High Harmony (+3rd above: E4 - F4 - G4 - A4 - G4)
    generateTrack(
      'track_2_harmony_hi',
      'Pista 2: Armonía Alta (+3ra)',
      'harmony',
      1,
      [
        { freq: 329.63, start: 0.2, dur: 1.1, vowel: 'e' }, // E4
        { freq: 349.23, start: 1.3, dur: 0.9, vowel: 'a' }, // F4
        { freq: 392.00, start: 2.2, dur: 1.2, vowel: 'a' }, // G4
        { freq: 440.00, start: 3.4, dur: 1.3, vowel: 'o' }, // A4
        { freq: 392.00, start: 4.7, dur: 1.1, vowel: 'u' }, // G4
      ],
      null,
      'autotune_hard',
      0,
      0.35,
      0.75
    ),

    // 3. Fifth Harmony (+5th above: G4 - A4 - B4 - C5 - A4)
    generateTrack(
      'track_3_harmony_fifth',
      'Pista 3: Armonía Quinta (+5ta)',
      'harmony',
      2,
      [
        { freq: 392.00, start: 0.2, dur: 1.1, vowel: 'o' }, // G4
        { freq: 440.00, start: 1.3, dur: 0.9, vowel: 'o' }, // A4
        { freq: 493.88, start: 2.2, dur: 1.2, vowel: 'u' }, // B4
        { freq: 523.25, start: 3.4, dur: 1.3, vowel: 'a' }, // C5
        { freq: 440.00, start: 4.7, dur: 1.1, vowel: 'e' }, // A4
      ],
      null,
      'autotune_hard',
      0,
      -0.35,
      0.75
    ),

    // 4. Low Harmony / Baritone (-1 Octave C3 - D3 - E3 - G3 - F3)
    generateTrack(
      'track_4_bass_vocal',
      'Pista 4: Voz Grave (-Octava / Barítono)',
      'backing',
      3,
      [
        { freq: 130.81, start: 0.2, dur: 1.1, vowel: 'u' }, // C3
        { freq: 146.83, start: 1.3, dur: 0.9, vowel: 'u' }, // D3
        { freq: 164.81, start: 2.2, dur: 1.2, vowel: 'o' }, // E3
        { freq: 196.00, start: 3.4, dur: 1.3, vowel: 'o' }, // G3
        { freq: 174.61, start: 4.7, dur: 1.1, vowel: 'a' }, // F3
      ],
      null,
      'melodyne_natural',
      30,
      0,
      0.8
    ),

    // 5. Stereo Doubler Left (Tight double tracking panned hard left)
    generateTrack(
      'track_5_doubler_left',
      'Pista 5: Doblaje Estéreo Izq (Doubler L)',
      'backing',
      4,
      [
        { freq: 261.63 * 1.003, start: 0.22, dur: 1.08, vowel: 'a' },
        { freq: 293.66 * 0.998, start: 1.31, dur: 0.88, vowel: 'e' },
        { freq: 329.63 * 1.002, start: 2.22, dur: 1.18, vowel: 'o' },
        { freq: 392.00 * 0.999, start: 3.41, dur: 1.28, vowel: 'u' },
        { freq: 349.23 * 1.004, start: 4.71, dur: 1.09, vowel: 'a' },
      ],
      null,
      'autotune_hard',
      5,
      -0.65,
      0.7
    ),

    // 6. Stereo Doubler Right (Tight double tracking panned hard right)
    generateTrack(
      'track_6_doubler_right',
      'Pista 6: Doblaje Estéreo Der (Doubler R)',
      'backing',
      5,
      [
        { freq: 261.63 * 0.997, start: 0.21, dur: 1.09, vowel: 'a' },
        { freq: 293.66 * 1.003, start: 1.29, dur: 0.89, vowel: 'e' },
        { freq: 329.63 * 0.998, start: 2.19, dur: 1.19, vowel: 'o' },
        { freq: 392.00 * 1.002, start: 3.39, dur: 1.29, vowel: 'u' },
        { freq: 349.23 * 0.996, start: 4.69, dur: 1.11, vowel: 'a' },
      ],
      null,
      'autotune_hard',
      5,
      0.65,
      0.7
    ),

    // 7. Dubbing Dialog Lead (Spoken Spanish dialogue)
    generateTrack(
      'track_7_dubbing_dialog',
      'Pista 7: Doblaje Diálogo A (Actor)',
      'dubbing',
      6,
      null,
      [
        { freq: 165, start: 0.3, dur: 0.7 }, // "El tiempo"
        { freq: 150, start: 1.2, dur: 0.8 }, // "y el tono"
        { freq: 180, start: 2.1, dur: 0.9 }, // "sincronizados"
        { freq: 135, start: 3.3, dur: 1.2 }, // "con máxima precisión"
      ],
      'none',
      40,
      -0.2,
      0.85
    ),

    // 8. Dubbing Response / Whispers (Ad-libs / Secondary voice)
    generateTrack(
      'track_8_dubbing_ambient',
      'Pista 8: Doblaje Diálogo B (Susurros / Reacción)',
      'dubbing',
      7,
      null,
      [
        { freq: 195, start: 0.8, dur: 0.6 }, // "Sí..."
        { freq: 210, start: 2.7, dur: 0.8 }, // "Exactamente..."
        { freq: 170, start: 4.4, dur: 1.0 }, // "Al unísono."
      ],
      'melodyne_natural',
      50,
      0.25,
      0.65
    ),
  ];

  return all8Tracks.slice(0, count);
}

function generateVocalMelody(
  buffer: AudioBuffer,
  notes: { freq: number; start: number; dur: number; vowel: string }[]
) {
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const sampleRate = buffer.sampleRate;

  for (const n of notes) {
    const startSample = Math.floor(n.start * sampleRate);
    const numSamples = Math.floor(n.dur * sampleRate);

    let f1 = 800;
    let f2 = 1200;
    if (n.vowel === 'e') {
      f1 = 500;
      f2 = 1800;
    } else if (n.vowel === 'o') {
      f1 = 500;
      f2 = 900;
    } else if (n.vowel === 'u') {
      f1 = 350;
      f2 = 800;
    }

    let phase = 0;
    for (let i = 0; i < numSamples && startSample + i < left.length; i++) {
      const t = i / sampleRate;
      const vibrato = 1 + 0.008 * Math.sin(2 * Math.PI * 5.2 * t);
      const currentFreq = n.freq * vibrato;

      phase += (2 * Math.PI * currentFreq) / sampleRate;

      let sample = Math.sin(phase) + 0.5 * Math.sin(phase * 2) + 0.3 * Math.sin(phase * 3) + 0.15 * Math.sin(phase * 4);
      sample += 0.4 * Math.sin((phase * f1) / n.freq);
      sample += 0.25 * Math.sin((phase * f2) / n.freq);

      const attack = Math.min(1, i / (0.05 * sampleRate));
      const release = Math.min(1, (numSamples - i) / (0.08 * sampleRate));
      const env = attack * release;

      const out = sample * env * 0.2;
      left[startSample + i] += out;
      right[startSample + i] += out * 0.95;
    }
  }
}

function generateVocalSpeech(
  buffer: AudioBuffer,
  speechWords: { freq: number; start: number; dur: number }[]
) {
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const sampleRate = buffer.sampleRate;

  for (const w of speechWords) {
    const startSample = Math.floor(w.start * sampleRate);
    const numSamples = Math.floor(w.dur * sampleRate);

    let phase = 0;
    for (let i = 0; i < numSamples && startSample + i < left.length; i++) {
      const t = i / sampleRate;
      const pitchContour = w.freq * (1 - 0.15 * (t / w.dur));
      phase += (2 * Math.PI * pitchContour) / sampleRate;

      let sample = Math.sin(phase) * 0.5 + Math.sin(phase * 2) * 0.25;
      if (i < 0.04 * sampleRate) {
        sample += (Math.random() * 2 - 1) * 0.15;
      }

      const env = Math.sin((Math.PI * i) / numSamples);
      const out = sample * env * 0.25;
      left[startSample + i] += out;
      right[startSample + i] += out;
    }
  }
}
