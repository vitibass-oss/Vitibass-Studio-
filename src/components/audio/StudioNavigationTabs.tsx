import React from 'react';
import {
  Sliders,
  Activity,
  Music2,
  Layers,
  LayoutGrid,
  Gauge,
  ChevronDown,
  Volume2,
  Check,
  Upload,
  Scissors,
  Undo2,
  Redo2,
  Download,
} from 'lucide-react';
import { VocalTrack } from '../../types/audio';

export type StudioViewMode =
  | 'all'
  | 'import_export'
  | 'audio_editor'
  | 'tuning'
  | 'eq'
  | 'pianoroll'
  | 'mixer';

export type StudioModuleTab = 'tuning' | 'eq' | 'both';

interface StudioNavigationTabsProps {
  viewMode: StudioViewMode;
  onSelectViewMode: (mode: StudioViewMode) => void;
  activeModuleTab: StudioModuleTab;
  onSelectModuleTab: (tab: StudioModuleTab) => void;
  tracks: VocalTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const StudioNavigationTabs: React.FC<StudioNavigationTabsProps> = ({
  viewMode,
  onSelectViewMode,
  activeModuleTab,
  onSelectModuleTab,
  tracks,
  selectedTrackId,
  onSelectTrack,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;

  return (
    <div className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-xl transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        {/* Left: View Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* 1. Centro de Importación / Exportación (Destacado) */}
          <button
            type="button"
            onClick={() => onSelectViewMode('import_export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'import_export'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 border-zinc-700/80 text-cyan-300 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Subir audios, procesar y descargar stems/master"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Importar / Exportar Audios</span>
          </button>

          {/* 2. Editor de Onda (Recorte, Fades, Fase) */}
          <button
            type="button"
            onClick={() => onSelectViewMode('audio_editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'audio_editor'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm ring-1 ring-rose-500/40'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-rose-300 hover:border-rose-800/60'
            }`}
            title="Editar audio: Recortar, Normalizar, Fades, Invertir"
          >
            <Scissors className="h-3.5 w-3.5 text-rose-400" />
            <span>Editor de Onda</span>
          </button>

          {/* 3. Afinación & Auto-Tune */}
          <button
            type="button"
            onClick={() => {
              onSelectViewMode('tuning');
              onSelectModuleTab('tuning');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'tuning'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm ring-1 ring-cyan-500/40'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-cyan-300 hover:border-cyan-800/60'
            }`}
            title="Ver módulo de afinación Auto-Tune & tiempo BPM al frente"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Afinación & Auto-Tune</span>
          </button>

          {/* 4. EQ 5 Bandas & Compresor */}
          <button
            type="button"
            onClick={() => {
              onSelectViewMode('eq');
              onSelectModuleTab('eq');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'eq'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm ring-1 ring-purple-500/40'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-purple-300 hover:border-purple-800/60'
            }`}
            title="Ver ecualizador paramétrico y compresor dinámico al frente"
          >
            <Activity className="h-3.5 w-3.5 text-purple-400" />
            <span>EQ & Compresor</span>
          </button>

          {/* 5. Melodyne Piano Roll */}
          <button
            type="button"
            onClick={() => onSelectViewMode('pianoroll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'pianoroll'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/40'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-emerald-300 hover:border-emerald-800/60'
            }`}
            title="Ver Piano Roll Melodyne con edición de notas al frente"
          >
            <Music2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Melodyne Piano Roll</span>
          </button>

          {/* 6. Mezclador 8 Pistas */}
          <button
            type="button"
            onClick={() => onSelectViewMode('mixer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'mixer'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm ring-1 ring-amber-500/40'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-amber-300 hover:border-amber-800/60'
            }`}
            title="Ver mezclador de 8 pistas y controles al unísono"
          >
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>Mezclador 8 Pistas</span>
          </button>

          {/* 7. Vista Completa / Estudio */}
          <button
            type="button"
            onClick={() => onSelectViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'all'
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm ring-1 ring-zinc-600/50'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Ver todos los paneles del estudio en la pantalla"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-zinc-300" />
            <span>Vista Integral</span>
          </button>
        </div>

        {/* Right: Undo / Redo & Quick Active Track Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Undo and Redo Buttons */}
          <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 shadow-sm">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={`p-1.5 rounded-lg transition-all ${
                canUndo
                  ? 'text-cyan-400 hover:bg-zinc-800 active:scale-95'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Deshacer última acción (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={`p-1.5 rounded-lg transition-all ${
                canRedo
                  ? 'text-cyan-400 hover:bg-zinc-800 active:scale-95'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Rehacer acción (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Track Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={selectedTrackId || ''}
                onChange={(e) => onSelectTrack(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 text-xs font-bold rounded-xl pl-8 pr-8 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                {tracks.map((t, idx) => (
                  <option key={t.id} value={t.id}>
                    P{idx + 1}: {t.name} ({t.tuningMode === 'autotune_hard' ? 'AutoTune' : t.tuningMode === 'melodyne_natural' ? 'Melodyne' : 'Bypass'})
                  </option>
                ))}
              </select>

              {/* Color dot of selected track */}
              {selectedTrack && (
                <span
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: selectedTrack.color }}
                />
              )}

              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
