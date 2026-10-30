import React from 'react';
import {
  Sliders,
  Zap,
  Music,
  Clock,
  Waves,
  RefreshCw,
  Gauge,
  HelpCircle,
  Sparkles,
  AlignLeft,
} from 'lucide-react';
import {
  VocalTrack,
  TuningMode,
  MusicalKey,
  ScaleType,
  QuantizeDivision,
} from '../../types/audio';
import { NOTE_NAMES } from '../../utils/audioDsp';

interface AutoTunePanelProps {
  track: VocalTrack | null;
  onUpdateTrack: (updates: Partial<VocalTrack>) => void;
  masterBpm: number;
}

export const AutoTunePanel: React.FC<AutoTunePanelProps> = ({
  track,
  onUpdateTrack,
  masterBpm,
}) => {
  if (!track) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-500">
        Selecciona una pista vocal en la lista superior para configurar Auto-Tune, Melodyne y BPM.
      </div>
    );
  }

  // Pre-sets for fast 1-click calibration
  const setQuickPreset = (mode: TuningMode) => {
    if (mode === 'autotune_hard') {
      onUpdateTrack({
        tuningMode: 'autotune_hard',
        retuneSpeedMs: 0,
        vibratoDepth: 0,
      });
    } else if (mode === 'melodyne_natural') {
      onUpdateTrack({
        tuningMode: 'melodyne_natural',
        retuneSpeedMs: 35,
        vibratoDepth: 25,
      });
    } else if (mode === 'none') {
      onUpdateTrack({
        tuningMode: 'none',
      });
    }
  };

  const handleFormantPreset = (shift: number) => {
    onUpdateTrack({ formantShift: shift });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span>Consola Individual de Afinación (Melodyne & Auto-Tune) y Tiempo BPM</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Ajusta tono exacto, velocidad de corrección, formantes y sincronía rítmica para: <span className="font-semibold text-white">{track.name}</span>
          </p>
        </div>

        {/* Quick Mode Presets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuickPreset('melodyne_natural')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
              track.tuningMode === 'melodyne_natural'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Melodyne Natural
          </button>

          <button
            type="button"
            onClick={() => setQuickPreset('autotune_hard')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
              track.tuningMode === 'autotune_hard'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Auto-Tune Duro (0ms)
          </button>

          <button
            type="button"
            onClick={() => setQuickPreset('none')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
              track.tuningMode === 'none'
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            Bypass
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section 1: Musical Key & Scale */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-cyan-400" />
              Escala de Afinación
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">PITCH SNAP</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Nota Tónica</label>
              <select
                value={track.musicalKey}
                onChange={(e) => onUpdateTrack({ musicalKey: e.target.value as MusicalKey })}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white font-bold focus:border-cyan-500 focus:outline-none"
              >
                {NOTE_NAMES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Tipo de Escala</label>
              <select
                value={track.scaleType}
                onChange={(e) => onUpdateTrack({ scaleType: e.target.value as ScaleType })}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="chromatic">Cromática</option>
                <option value="major">Mayor</option>
                <option value="minor">Menor Natural</option>
                <option value="dorian">Dórica</option>
                <option value="pentatonic_major">Pentatónica Mayor</option>
                <option value="pentatonic_minor">Pentatónica Menor</option>
              </select>
            </div>
          </div>

          {/* Retune Speed Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Velocidad de Corrección (Retune Speed)</span>
              <span className="font-mono font-bold text-cyan-300">{track.retuneSpeedMs} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={track.retuneSpeedMs}
              onChange={(e) => onUpdateTrack({ retuneSpeedMs: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0ms (T-Pain / Trap)</span>
              <span>25ms (Pop suave)</span>
              <span>100ms (Transparente)</span>
            </div>
          </div>

          {/* Vibrato Depth */}
          <div className="space-y-1 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Preservación de Vibrato Natural</span>
              <span className="font-mono text-zinc-300">{track.vibratoDepth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={track.vibratoDepth}
              onChange={(e) => onUpdateTrack({ vibratoDepth: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Formant & Pitch Transposition */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-amber-400" />
              Tono y Formantes
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">TIMBRE VOCAL</span>
          </div>

          {/* Semitone Pitch Shift */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Transposición Semitonos</span>
              <span className="font-mono font-bold text-amber-300">
                {track.pitchShiftSemitones >= 0 ? `+${track.pitchShiftSemitones}` : track.pitchShiftSemitones} st
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={track.pitchShiftSemitones}
              onChange={(e) => onUpdateTrack({ pitchShiftSemitones: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>-1 Octava (-12st)</span>
              <span>0 (Original)</span>
              <span>+1 Octava (+12st)</span>
            </div>
          </div>

          {/* Fine Tune Cents */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Afinación Fina (Cents)</span>
              <span className="font-mono text-zinc-300">
                {track.fineTuneCents >= 0 ? `+${track.fineTuneCents}` : track.fineTuneCents} ct
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={track.fineTuneCents}
              onChange={(e) => onUpdateTrack({ fineTuneCents: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Formant Shift */}
          <div className="space-y-1 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Desplazamiento de Garganta (Formantes)</span>
              <span className="font-mono text-amber-300">
                {track.formantShift >= 0 ? `+${track.formantShift}` : track.formantShift}
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={track.formantShift}
              onChange={(e) => onUpdateTrack({ formantShift: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-400 cursor-pointer"
            />
            {/* Quick formant buttons for dubbing / character voices */}
            <div className="flex gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleFormantPreset(-4)}
                className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
              >
                Grave
              </button>
              <button
                type="button"
                onClick={() => handleFormantPreset(0)}
                className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
              >
                Neutro
              </button>
              <button
                type="button"
                onClick={() => handleFormantPreset(4)}
                className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
              >
                Brillante
              </button>
              <button
                type="button"
                onClick={() => handleFormantPreset(7)}
                className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
              >
                Dibujo / Aguda
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Time Correction & BPM */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Tiempo Musical & BPM
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">TIME STRETCH</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">BPM Origen de la Toma</label>
              <input
                type="number"
                min="40"
                max="240"
                value={track.sourceBpm}
                onChange={(e) => onUpdateTrack({ sourceBpm: Number(e.target.value) || 120 })}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">BPM Destino Proyecto</label>
              <div className="flex items-center justify-between rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-emerald-300 font-mono font-bold">
                <span>{masterBpm} BPM</span>
                <span className="text-[10px] text-zinc-500 font-normal">Global</span>
              </div>
            </div>
          </div>

          {/* Time Stretch Factor Readout */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Factor de Estiramiento Temporal:</span>
            <span className="font-mono font-bold text-emerald-400">
              {(masterBpm / (track.sourceBpm || 120)).toFixed(2)}x
            </span>
          </div>

          {/* Lip-sync / Dubbing Time Offset (ms) */}
          <div className="space-y-1 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <AlignLeft className="h-3 w-3 text-emerald-400" />
                Desfase / Sincronía Labial (Offset)
              </span>
              <span className="font-mono text-emerald-300">
                {(track.timeOffsetMs || 0) >= 0 ? `+${track.timeOffsetMs || 0}` : track.timeOffsetMs} ms
              </span>
            </div>
            <input
              type="range"
              min="-250"
              max="250"
              step="5"
              value={track.timeOffsetMs || 0}
              onChange={(e) => onUpdateTrack({ timeOffsetMs: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>-250ms (Adelantar)</span>
              <span>0ms</span>
              <span>+250ms (Retrasar)</span>
            </div>
          </div>

          {/* Quantize Rhythm Grid */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1.5">
              Cuantización de Ataques y Transitorios
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['off', '1/4', '1/8', '1/16', '1/8T', '1/16T'] as QuantizeDivision[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onUpdateTrack({ quantizeDivision: q })}
                  className={`py-1 rounded text-center font-mono text-[11px] font-semibold border transition-all ${
                    track.quantizeDivision === q
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {q === 'off' ? 'Apagado' : q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
