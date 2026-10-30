export type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ScaleType = 'chromatic' | 'major' | 'minor' | 'dorian' | 'pentatonic_major' | 'pentatonic_minor';

export type TuningMode = 'none' | 'melodyne_natural' | 'autotune_hard' | 'custom';

export type QuantizeDivision = 'off' | '1/4' | '1/8' | '1/16' | '1/8T' | '1/16T';

export type VocalStylePreset = 'pop_studio' | 'autotune_trap' | 'dubbing_pro' | 'choir_wall' | 'podcast_voice';

export interface EqBand {
  id: number;
  name: string;
  type: BiquadFilterType;
  frequency: number; // 20 to 20000 Hz
  gain: number; // -18 to +18 dB
  q: number; // 0.1 to 12
  enabled: boolean;
}

export interface TrackEq {
  enabled: boolean;
  bands: EqBand[];
}

export interface TrackCompressor {
  enabled: boolean;
  threshold: number; // -60 to 0 dB, default -20
  ratio: number; // 1 to 20, default 4
  attack: number; // 0.001 to 0.5 s (1ms to 500ms), default 0.015 (15ms)
  release: number; // 0.01 to 1.0 s (10ms to 1000ms), default 0.15 (150ms)
  knee: number; // 0 to 40 dB, default 6
  makeupGain: number; // 0 to 18 dB, default 0
}

export interface PitchNote {
  id: string;
  startTime: number;
  duration: number;
  frequency: number;
  midiNote: number;
  noteName: string;
  targetMidiNote: number;
  targetNoteName: string;
  deviationCents: number;
}

export interface VocalTrack {
  id: string;
  name: string;
  role: 'lead' | 'harmony' | 'backing' | 'dubbing';
  color: string;
  audioBuffer: AudioBuffer | null;
  duration: number;
  muted: boolean;
  solo: boolean;
  volume: number; // 0 to 1.5
  pan: number; // -1 to 1
  timeOffsetMs?: number; // Delay / offset for dubbing lip-sync (-500ms to +500ms)

  // Pitch Correction & Tuning (Melodyne / Auto-Tune style)
  tuningMode: TuningMode;
  musicalKey: MusicalKey;
  scaleType: ScaleType;
  retuneSpeedMs: number; // 0 (fast autotune snap) to 100 (smooth natural)
  pitchShiftSemitones: number; // -12 to +12
  fineTuneCents: number; // -50 to +50
  formantShift: number; // -12 to +12
  vibratoDepth: number; // 0 to 100%

  // Time & BPM Manipulation
  sourceBpm: number;
  targetBpm: number;
  quantizeDivision: QuantizeDivision;
  timeStretchRatio: number; // targetBpm / sourceBpm

  // Visuals & Analysis
  detectedNotes: PitchNote[];
  isProcessing: boolean;
  isSelectedForUnison: boolean; // For batch unison tuning and time editing

  // Parametric 5-band EQ & Dynamics Compressor
  eq?: TrackEq;
  compressor?: TrackCompressor;
}

export interface VocalAiAnalysis {
  detectedKey: string;
  detectedScale: string;
  detectedBpm: number;
  pitchAccuracyScore: number; // 1-100
  tuningRecommendations: string[];
  dubbingTimingTips: string[];
  suggestedRetuneSpeed: number;
}
