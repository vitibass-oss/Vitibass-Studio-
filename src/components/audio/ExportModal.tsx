import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  Music,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Sliders,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { VocalTrack } from '../../types/audio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: VocalTrack[];
  masterBpm: number;
  masterKey: string;
  masterScale: string;
  onExportMixdown: () => Promise<void>;
  onExportStemsZip: (selectedTrackIds?: string[]) => Promise<void>;
  isExporting: boolean;
  exportProgressText: string;
  exportProgressPercent: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  masterBpm,
  masterKey,
  masterScale,
  onExportMixdown,
  onExportStemsZip,
  isExporting,
  exportProgressText,
  exportProgressPercent,
}) => {
  const activeTracks = tracks.filter((t) => t.audioBuffer !== null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    activeTracks.map((t) => t.id)
  );
  const [includeReadme, setIncludeReadme] = useState(true);

  if (!isOpen) return null;

  const allSelected = selectedTrackIds.length === activeTracks.length && activeTracks.length > 0;

  const toggleSelectTrack = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedTrackIds(select ? activeTracks.map((t) => t.id) : []);
  };

  const handleTriggerStemsZip = async () => {
    if (selectedTrackIds.length === 0) return;
    await onExportStemsZip(selectedTrackIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-800/40">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Menú de Exportación de Audio & Stems
              </h3>
              <p className="text-xs text-zinc-400">
                Descarga stems individuales afinados o la mezcla completa para Pro Tools, Logic, Ableton, FL Studio y Reaper
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar during Export */}
        {isExporting && (
          <div className="rounded-xl border border-cyan-700/60 bg-cyan-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                {exportProgressText || 'Procesando exportación...'}
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {exportProgressPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 transition-all duration-200"
                style={{ width: `${exportProgressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Renderizando cada pista con algoritmos de fase y cuantización temporal en {masterBpm} BPM...
            </p>
          </div>
        )}

        {/* Export Options Grid */}
        {!isExporting && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: ZIP of Individual Stems (Requested by User) */}
            <div className="flex flex-col justify-between rounded-xl border border-cyan-800/80 bg-gradient-to-b from-cyan-950/30 to-zinc-900/60 p-5 space-y-4 shadow-lg hover:border-cyan-600 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <FolderArchive className="h-5 w-5" />
                    <span>Stems en Archivo ZIP</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    RECOMENDADO PARA DAW
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Exporta un archivo ZIP con cada pista procesada por separado en alta definición (WAV 44.1kHz 16-bit). Todas las pistas conservan el mismo ajuste de <strong className="text-white">BPM ({masterBpm})</strong>, <strong className="text-white">afinación ({masterKey} {masterScale})</strong> y alineación temporal desde 00:00.
                </p>
                <div className="text-[11px] text-zinc-400 font-mono space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Pistas individuales con Auto-Tune / Melodyne</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Alineadas temporalmente para soltar en compás 1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Incluye archivo LEEME con notas técnicas</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerStemsZip}
                disabled={selectedTrackIds.length === 0}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <FolderArchive className="h-4 w-4" />
                <span>Descargar Stems ZIP ({selectedTrackIds.length} pistas)</span>
              </button>
            </div>

            {/* Option 2: Full Mixdown WAV */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 hover:border-zinc-700 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
                    <Music className="h-5 w-5 text-amber-400" />
                    <span>Mezcla Maestra (WAV)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
                    ESTÉREO
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Exporta un único archivo de audio consolidado con todas las pistas activas mezcladas, aplicando sus volúmenes, paneos estéreo y correcciones de afinación al unísono.
                </p>
                <div className="text-[11px] text-zinc-500 font-mono space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Suma estéreo de hasta 8 pistas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>WAV 44.1 kHz / 16-bit sin compresión</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Ideal para escucha directa o masterización</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onExportMixdown}
                disabled={activeTracks.length === 0}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 transition-all"
              >
                <Music className="h-4 w-4 text-amber-400" />
                <span>Descargar Mezcla Estéreo (WAV)</span>
              </button>
            </div>
          </div>
        )}

        {/* Stem Track Selection Checklist (for ZIP option) */}
        {!isExporting && activeTracks.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
                Selección de Pistas para el paquete ZIP ({selectedTrackIds.length}/{activeTracks.length})
              </span>
              <button
                type="button"
                onClick={() => handleSelectAll(!allSelected)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                {allSelected ? 'Desmarcar todas' : 'Marcar todas'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {activeTracks.map((track, idx) => {
                const isChecked = selectedTrackIds.includes(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => toggleSelectTrack(track.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-cyan-700/60 bg-cyan-950/30 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600 shrink-0" />
                    )}
                    <div
                      className="h-3 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <div className="truncate flex-1">
                      <span className="font-semibold">{idx + 1}. {track.name}</span>
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        {track.tuningMode === 'autotune_hard' ? 'Auto-Tune 0ms' : track.tuningMode === 'melodyne_natural' ? `Melodyne ${track.retuneSpeedMs}ms` : 'Bypass'} · {masterBpm} BPM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/80">
          <span>Formato: WAV 44.1kHz 16-bit PCM lineal</span>
          <span>Compatibilidad: Pro Tools, Logic Pro, Ableton, FL Studio, Cubase, Reaper</span>
        </div>
      </div>
    </div>
  );
};
