import { TrackEq, EqBand, TrackCompressor } from '../types/audio';

export function createDefaultTrackCompressor(): TrackCompressor {
  return {
    enabled: true,
    threshold: -20,
    ratio: 3.5,
    attack: 0.015, // 15ms
    release: 0.15, // 150ms
    knee: 6,
    makeupGain: 2.0,
  };
}

export interface CompressorPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<TrackCompressor>;
}

export const VOCAL_COMPRESSOR_PRESETS: CompressorPreset[] = [
  {
    id: 'pop_vocal',
    name: 'Voz Pop Moderna',
    description: 'Control dinámico firme, realza el sustain y mantiene la voz al frente en la mezcla.',
    settings: { threshold: -22, ratio: 4, attack: 0.015, release: 0.12, knee: 6, makeupGain: 3.5, enabled: true },
  },
  {
    id: 'dubbing_dialog',
    name: 'Doblaje & Locución Cine',
    description: 'Nivelación suave y transparente para igualar tomas de diálogo y susurros.',
    settings: { threshold: -18, ratio: 2.8, attack: 0.02, release: 0.18, knee: 8, makeupGain: 2.0, enabled: true },
  },
  {
    id: 'trap_aggressive',
    name: 'Trap / Auto-Tune Punch',
    description: 'Ataque ultra-rápido y compresión contundente tipo "In-Your-Face" para estilos urbanos.',
    settings: { threshold: -26, ratio: 6, attack: 0.005, release: 0.08, knee: 3, makeupGain: 5.0, enabled: true },
  },
  {
    id: 'smooth_acoustic',
    name: 'Balada / Acústico Natural',
    description: 'Ataque relajado para preservar la expresividad y dinámica orgánica del cantante.',
    settings: { threshold: -15, ratio: 2.2, attack: 0.035, release: 0.25, knee: 12, makeupGain: 1.5, enabled: true },
  },
  {
    id: 'bypass_neutral',
    name: 'Neutro (Sin Compresión)',
    description: 'Umbral alto sin reducción de ganancia.',
    settings: { threshold: 0, ratio: 1, attack: 0.02, release: 0.15, knee: 0, makeupGain: 0, enabled: false },
  },
];

export function createDefaultTrackEq(): TrackEq {
  return {
    enabled: true,
    bands: [
      { id: 1, name: 'B1: Low Cut (Sub-graves)', type: 'highpass', frequency: 80, gain: 0, q: 0.71, enabled: true },
      { id: 2, name: 'B2: Graves (Cuerpo/Caja)', type: 'peaking', frequency: 280, gain: 0, q: 1.2, enabled: true },
      { id: 3, name: 'B3: Medios (Claridad)', type: 'peaking', frequency: 1250, gain: 0, q: 1.5, enabled: true },
      { id: 4, name: 'B4: Presencia (Mordida)', type: 'peaking', frequency: 3800, gain: 0, q: 1.8, enabled: true },
      { id: 5, name: 'B5: Brillo & Aire', type: 'highshelf', frequency: 10000, gain: 0, q: 0.8, enabled: true },
    ],
  };
}

export interface EqPreset {
  id: string;
  name: string;
  description: string;
  bands: Partial<EqBand>[];
}

export const VOCAL_EQ_PRESETS: EqPreset[] = [
  {
    id: 'flat',
    name: 'Plano (Reset)',
    description: 'Respuesta plana sin alteración tímbrica (0 dB en todas las bandas)',
    bands: [
      { id: 1, type: 'highpass', frequency: 40, gain: 0, q: 0.71, enabled: true },
      { id: 2, type: 'peaking', frequency: 280, gain: 0, q: 1.2, enabled: true },
      { id: 3, type: 'peaking', frequency: 1250, gain: 0, q: 1.5, enabled: true },
      { id: 4, type: 'peaking', frequency: 3800, gain: 0, q: 1.8, enabled: true },
      { id: 5, type: 'highshelf', frequency: 10000, gain: 0, q: 0.8, enabled: true },
    ],
  },
  {
    id: 'pop_vocal',
    name: 'Voz Pop Moderna',
    description: 'Limpieza de graves sub, corte de turbidez en 320Hz y realce de aire en agudos',
    bands: [
      { id: 1, type: 'highpass', frequency: 95, gain: 0, q: 0.8, enabled: true },
      { id: 2, type: 'peaking', frequency: 320, gain: -2.5, q: 1.8, enabled: true },
      { id: 3, type: 'peaking', frequency: 1400, gain: 1.0, q: 1.5, enabled: true },
      { id: 4, type: 'peaking', frequency: 4200, gain: 3.5, q: 1.6, enabled: true },
      { id: 5, type: 'highshelf', frequency: 11000, gain: 4.5, q: 0.7, enabled: true },
    ],
  },
  {
    id: 'dubbing_dialog',
    name: 'Doblaje & Locución Cine',
    description: 'Máxima inteligibilidad de sílabas y reducción de efecto proximidad de micro',
    bands: [
      { id: 1, type: 'highpass', frequency: 85, gain: 0, q: 0.71, enabled: true },
      { id: 2, type: 'peaking', frequency: 250, gain: -1.5, q: 1.4, enabled: true },
      { id: 3, type: 'peaking', frequency: 2400, gain: 3.0, q: 1.9, enabled: true },
      { id: 4, type: 'peaking', frequency: 5500, gain: -2.0, q: 3.0, enabled: true }, // tame sibilance
      { id: 5, type: 'highshelf', frequency: 9500, gain: 2.0, q: 0.9, enabled: true },
    ],
  },
  {
    id: 'warm_intimate',
    name: 'Calidez e Intimidad',
    description: 'Enfatiza el cuerpo del pecho sin estridencias, ideal para baladas o voces suaves',
    bands: [
      { id: 1, type: 'highpass', frequency: 70, gain: 0, q: 0.6, enabled: true },
      { id: 2, type: 'peaking', frequency: 220, gain: 2.5, q: 1.1, enabled: true },
      { id: 3, type: 'peaking', frequency: 1000, gain: 0, q: 1.4, enabled: true },
      { id: 4, type: 'peaking', frequency: 3200, gain: 1.0, q: 1.3, enabled: true },
      { id: 5, type: 'highshelf', frequency: 8000, gain: -1.0, q: 0.8, enabled: true },
    ],
  },
  {
    id: 'de_harsh',
    name: 'Suavizar Dureza / Sibilancias',
    description: 'Atenúa las frecuencias ásperas de consonantes (S, T, Z) y resonancias nasales',
    bands: [
      { id: 1, type: 'highpass', frequency: 90, gain: 0, q: 0.7, enabled: true },
      { id: 2, type: 'peaking', frequency: 400, gain: 0, q: 1.2, enabled: true },
      { id: 3, type: 'peaking', frequency: 1100, gain: -2.0, q: 2.5, enabled: true },
      { id: 4, type: 'peaking', frequency: 6200, gain: -4.5, q: 3.5, enabled: true },
      { id: 5, type: 'highshelf', frequency: 12000, gain: 1.0, q: 0.8, enabled: true },
    ],
  },
];

// Helper to convert frequency (20 to 20000 Hz) to X pixel coordinate on logarithmic scale
export function freqToX(freq: number, width: number): number {
  const minF = Math.log10(20);
  const maxF = Math.log10(20000);
  const curF = Math.log10(Math.max(20, Math.min(20000, freq)));
  return ((curF - minF) / (maxF - minF)) * width;
}

// Helper to convert X pixel coordinate to frequency
export function xToFreq(x: number, width: number): number {
  const minF = Math.log10(20);
  const maxF = Math.log10(20000);
  const ratio = Math.max(0, Math.min(1, x / width));
  return Math.pow(10, minF + ratio * (maxF - minF));
}

// Helper to convert Gain dB (-18 to +18) to Y pixel coordinate
export function gainToY(gainDb: number, height: number, maxDb = 18): number {
  const clamped = Math.max(-maxDb, Math.min(maxDb, gainDb));
  // 0 dB is middle of height
  const normalized = clamped / maxDb; // -1 to 1
  return height * 0.5 - (normalized * (height * 0.42));
}

// Helper to convert Y pixel coordinate to Gain dB
export function yToGain(y: number, height: number, maxDb = 18): number {
  const normalized = (height * 0.5 - y) / (height * 0.42);
  const gain = normalized * maxDb;
  return Math.max(-maxDb, Math.min(maxDb, Math.round(gain * 10) / 10));
}

/**
 * Calculates theoretical combined frequency response curve in dB across N points
 */
export function calculateEqResponseCurve(
  bands: EqBand[],
  numPoints = 250,
  sampleRate = 44100
): { freq: number; db: number }[] {
  const points: { freq: number; db: number }[] = [];
  const minF = Math.log10(20);
  const maxF = Math.log10(20000);

  for (let i = 0; i < numPoints; i++) {
    const f = Math.pow(10, minF + (i / (numPoints - 1)) * (maxF - minF));
    let totalDb = 0;

    for (const b of bands) {
      if (!b.enabled) continue;

      if (b.type === 'highpass') {
        // 2nd order highpass filter approximation
        const ratio = f / b.frequency;
        if (ratio < 1) {
          const octavesBelow = Math.log2(1 / ratio);
          totalDb -= Math.min(48, octavesBelow * 12);
        }
      } else if (b.type === 'peaking') {
        // Peaking Bell filter response approximation
        const ratio = f / b.frequency;
        const logRatio = Math.abs(Math.log2(ratio));
        const bandwidth = 1 / Math.max(0.1, b.q);
        const weight = Math.exp(-Math.pow(logRatio / (bandwidth * 0.5), 2));
        totalDb += b.gain * weight;
      } else if (b.type === 'highshelf') {
        // High Shelf filter response approximation
        const ratio = f / b.frequency;
        if (ratio > 1) {
          const weight = 1 - Math.exp(-(ratio - 1) * Math.max(0.5, b.q));
          totalDb += b.gain * Math.min(1, weight);
        }
      } else if (b.type === 'lowshelf') {
        const ratio = b.frequency / f;
        if (ratio > 1) {
          const weight = 1 - Math.exp(-(ratio - 1) * Math.max(0.5, b.q));
          totalDb += b.gain * Math.min(1, weight);
        }
      }
    }

    points.push({ freq: f, db: Math.max(-36, Math.min(24, totalDb)) });
  }

  return points;
}
