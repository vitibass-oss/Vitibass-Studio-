import React from 'react';
import {
  Users,
  Zap,
  Music,
  Clock,
  CheckSquare,
  Square,
  Waves,
  Sparkles,
  AlignLeft,
  Target,
} from 'lucide-react';
import {
  VocalTrack,
  MusicalKey,
  ScaleType,
  QuantizeDivision,
  TuningMode,
} from '../../types/audio';

interface UnisonControlsBarProps {
  tracks: VocalTrack[];
  onSelectAllUnison: (select: boolean) => void;
  onApplyUnisonTuningMode: (mode: TuningMode, speedMs?: number) => void;
  onApplyUnisonKeyScale: (key: MusicalKey, scale: ScaleType) => void;
  onApplyUnisonQuantize: (quantize: QuantizeDivision) => void;
  onApplyUnisonPitchShift: (deltaSemitones: number) => void;
  onApplyUnisonFormantSpread: () => void;
  onAlignToGuideTrack?: () => void;
  onMacroCenteringPitch?: () => void;
  isUnisonModeActive: boolean;
  setIsUnisonModeActive: (active: boolean) => void;
}

export const UnisonControlsBar: React.FC<UnisonControlsBarProps> = ({
  tracks,
  onSelectAllUnison,
  onApplyUnisonTuningMode,
  onApplyUnisonKeyScale,
  onApplyUnisonQuantize,
  onApplyUnisonPitchShift,
  onApplyUnisonFormantSpread,
  onAlignToGuideTrack,
  onMacroCenteringPitch,
  isUnisonModeActive,
  setIsUnisonModeActive,
}) => {
  const selectedCount = tracks.filter((t) => t.isSelectedForUnison).length;
  const allSelected = selectedCount === tracks.length && tracks.length > 0;

  return (
    <section className="rounded-2xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/40 via-zinc-950/90 to-indigo-950/40 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Corrección al Unísono (Control Colectivo de hasta 8 Pistas)</span>
                <span className="text-[10px] font-mono rounded bg-cyan-950 border border-cyan-700/60 px-2 py-0.5 text-cyan-300 font-semibold">
                  {selectedCount} SELECCIONADAS
                </span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Modifica simultáneamente todas las voces del coro, doblaje o armonías en tono, tiempo, formantes y alineación
            </p>
          </div>
        </div>

        {/* Selection status and toggle buttons */}
        <div className="flex items-center gap-2">
          {onAlignToGuideTrack && (
            <button
              type="button"
              onClick={onAlignToGuideTrack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 shadow-sm transition-all"
              title="Alinea rítmicamente el inicio y transitorios de las pistas secundarias a la Pista Guía 1 (estilo VocALign para doblaje y coros)"
            >
              <AlignLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span>Alinear a Pista Guía 1 (VocALign)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectAllUnison(!allSelected)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-zinc-500" />
            )}
            <span>
              {allSelected ? 'Todas Seleccionadas' : `Seleccionar Todas (${selectedCount}/${tracks.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Unison Collective Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Unison Auto-Tune & Melodyne */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Afinación al Unísono
            </span>
            {onMacroCenteringPitch && (
              <button
                type="button"
                onClick={onMacroCenteringPitch}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                title="Centra todas las notas al 100% (0 cents de desviación) en todas las pistas"
              >
                Centrar 100%
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onApplyUnisonTuningMode('autotune_hard', 0)}
              className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-center font-bold text-[11px] transition-all"
              title="Aplica Auto-Tune duro con 0ms a todas las pistas seleccionadas"
            >
              Auto-Tune (0ms)
            </button>

            <button
              type="button"
              onClick={() => onApplyUnisonTuningMode('melodyne_natural', 30)}
              className="px-2 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-center font-bold text-[11px] transition-all"
              title="Aplica corrección Melodyne suave y natural (30ms)"
            >
              Melodyne (30ms)
            </button>
          </div>
          <button
            type="button"
            onClick={() => onApplyUnisonTuningMode('none')}
            className="w-full py-1 text-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] transition-colors"
          >
            Bypass Colectivo (Tono Original)
          </button>
        </div>

        {/* Unison Transpose / Pitch Shift */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-2">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-cyan-400" />
            Transposición Grupal
          </span>
          <div className="grid grid-cols-4 gap-1 font-mono font-bold text-[11px]">
            <button
              type="button"
              onClick={() => onApplyUnisonPitchShift(-12)}
              className="py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 text-center transition-colors"
              title="Bajar 1 octava a todas las pistas (-12 semitonos)"
            >
              -12st
            </button>
            <button
              type="button"
              onClick={() => onApplyUnisonPitchShift(-1)}
              className="py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 text-center transition-colors"
              title="Bajar 1 semitono a todas"
            >
              -1st
            </button>
            <button
              type="button"
              onClick={() => onApplyUnisonPitchShift(1)}
              className="py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700/60 text-center transition-colors"
              title="Subir 1 semitono a todas"
            >
              +1st
            </button>
            <button
              type="button"
              onClick={() => onApplyUnisonPitchShift(12)}
              className="py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700/60 text-center transition-colors"
              title="Subir 1 octava a todas las pistas (+12 semitonos)"
            >
              +12st
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 text-center font-mono">
            Transpone todas las voces en bloque
          </div>
        </div>

        {/* Unison Quantize & BPM Sync */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-2">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            Cuantizar Tiempo Colectivo
          </span>
          <div className="grid grid-cols-3 gap-1 font-mono font-bold text-[11px]">
            <button
              type="button"
              onClick={() => onApplyUnisonQuantize('1/4')}
              className="py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-center transition-colors"
              title="Cuantizar a negras (1/4)"
            >
              1/4
            </button>
            <button
              type="button"
              onClick={() => onApplyUnisonQuantize('1/8')}
              className="py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-center transition-colors"
              title="Cuantizar a corcheas (1/8)"
            >
              1/8
            </button>
            <button
              type="button"
              onClick={() => onApplyUnisonQuantize('1/16')}
              className="py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-center transition-colors"
              title="Cuantizar a semicorcheas (1/16)"
            >
              1/16
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 text-center font-mono">
            Alinea ataques rítmicos al compás
          </div>
        </div>

        {/* Formant Spread & Humanize */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-2">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="h-3.5 w-3.5 text-purple-400" />
            Empaste Coral & Formantes
          </span>
          <button
            type="button"
            onClick={onApplyUnisonFormantSpread}
            className="w-full py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-center font-bold text-[11px] transition-all"
            title="Distribuye formantes escalonados y paneo estéreo entre las 8 pistas para evitar cancelaciones de fase"
          >
            Difusión de Formantes (Spread)
          </button>
          <div className="text-[10px] text-zinc-500 text-center font-mono">
            Abre el campo estéreo y cuerpo coral
          </div>
        </div>
      </div>
    </section>
  );
};
