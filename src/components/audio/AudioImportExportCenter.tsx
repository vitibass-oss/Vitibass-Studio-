import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  FolderArchive,
  FileAudio,
  Sparkles,
  Zap,
  Music,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Layers,
  ArrowRight,
  Maximize2,
  Trash2,
  Volume2,
  Gauge,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';
import { VocalTrack, MusicalKey, ScaleType } from '../../types/audio';

interface AudioImportExportCenterProps {
  tracks: VocalTrack[];
  onAddTrackFile: (file: File) => Promise<void>;
  onBatchAddFiles: (files: File[]) => Promise<void>;
  onSelectTrack: (trackId: string) => void;
  selectedTrackId: string | null;
  onExportMixdown: () => void;
  onExportStemsZip: () => void;
  onExportSingleTrack: (track: VocalTrack) => void;
  onOpenExportModal: () => void;
  onApplyUnisonTuning: (mode: any, speedMs: number) => void;
  onAlignToGuide: () => void;
  onNormalizeAllTracks: () => void;
  masterBpm: number;
  masterKey: MusicalKey;
  masterScale: ScaleType;
  maxTracks?: number;
}

const SUPPORTED_AUDIO_EXTENSIONS = '.wav, .mp3, .flac, .aif, .aiff, .ogg, .m4a, .aac, .pcm, .webm, audio/*';

export const AudioImportExportCenter: React.FC<AudioImportExportCenterProps> = ({
  tracks,
  onAddTrackFile,
  onBatchAddFiles,
  onSelectTrack,
  selectedTrackId,
  onExportMixdown,
  onExportStemsZip,
  onExportSingleTrack,
  onOpenExportModal,
  onApplyUnisonTuning,
  onAlignToGuide,
  onNormalizeAllTracks,
  masterBpm,
  masterKey,
  masterScale,
  maxTracks = 8,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeTracksWithAudio = tracks.filter((t) => t.audioBuffer !== null);
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingBatch(true);
    setStatusMessage(`Importando y analizando ${files.length} archivo(s) de audio...`);

    try {
      const fileArray = Array.from(files);
      if (fileArray.length === 1) {
        await onAddTrackFile(fileArray[0]);
      } else {
        await onBatchAddFiles(fileArray);
      }
      setStatusMessage(`¡${fileArray.length} archivo(s) importados y analizados correctamente!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Error al importar algunos archivos de audio.');
    } finally {
      setIsProcessingBatch(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-2xl space-y-7">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Centro de Importación, Procesamiento y Exportación de Audio</span>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono text-cyan-400 border border-cyan-500/30">
                  {activeTracksWithAudio.length}/{maxTracks} Pistas con Audio
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Sube tus pistas vocales en cualquier formato (<strong className="text-zinc-200">WAV, MP3, FLAC, AIFF, OGG, PCM, M4A</strong>), procésalas automáticamente y descárgalas masterizadas o en stems ZIP para cualquier DAW.
              </p>
            </div>
          </div>
        </div>

        {/* Global Key & BPM Indicator */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 font-mono text-xs text-right">
            <span className="text-[10px] text-zinc-500 block uppercase">Sesión de Procesado:</span>
            <span className="font-bold text-cyan-300">
              {masterBpm} BPM · {masterKey} {masterScale}
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert if batch is working */}
      {statusMessage && (
        <div className="rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-4 py-2.5 text-xs text-cyan-200 flex items-center gap-2 animate-pulse">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Import Dropzone (Left) & Export Options (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ========================================================= */}
        {/* LEFT: DRAG & DROP AUDIO IMPORT ZONE                       */}
        {/* ========================================================= */}
        <div
          className={`lg:col-span-7 flex flex-col justify-between rounded-2xl border border-dashed p-6 transition-all bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 relative overflow-hidden group shadow-inner ${
            isDraggingOver
              ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/50'
              : 'border-zinc-700 hover:border-zinc-500'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept={SUPPORTED_AUDIO_EXTENSIONS}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="text-center space-y-3 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all shadow-xl">
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Arrastra y Suelta tus Audios Aquí
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Sube una pista individual o arrastra múltiples archivos para cargarlos en pistas separadas automáticamente (hasta {maxTracks} pistas).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingBatch}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg transition-all active:scale-95"
              >
                <FileAudio className="h-4 w-4" />
                <span>Explorar Archivos en mi Dispositivo</span>
              </button>
            </div>

            {/* Badges of accepted formats */}
            <div className="pt-3 flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="text-zinc-400">Formatos compatibles:</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">WAV</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">MP3</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">FLAC</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">AIFF/AIF</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">PCM</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">OGG</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-bold">M4A</span>
            </div>
          </div>

          {/* Quick Batch Processing Presets */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Acciones de Procesamiento Inmediato para los Audios Cargados:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onApplyUnisonTuning('melodyne_natural', 25)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-cyan-500/60 hover:text-cyan-300 transition-all text-zinc-300 text-left"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Afinar Todo (Melodyne Natural 25ms)</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyUnisonTuning('autotune_hard', 0)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 hover:text-amber-300 transition-all text-zinc-300 text-left"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Auto-Tune Duro (Trap / Snap 0ms)</span>
              </button>

              <button
                type="button"
                onClick={onAlignToGuide}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-purple-500/60 hover:text-purple-300 transition-all text-zinc-300 text-left"
              >
                <Music className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Alinear Sincronía Temporal (VocALign)</span>
              </button>

              <button
                type="button"
                onClick={onNormalizeAllTracks}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 hover:text-emerald-300 transition-all text-zinc-300 text-left"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Normalizar Volumen a -0.2 dBFS</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: DEDICATED EXPORT CENTER                             */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <Download className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold">Opciones de Exportación y Descarga</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Descarga el resultado de tu procesamiento listo para mezclar en Pro Tools, Logic Pro, Ableton, FL Studio o Cubase.
            </p>
          </div>

          {/* Export Action Cards */}
          <div className="space-y-3">
            {/* Option 1: ZIP Stems (Highlighted) */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 transition-all hover:border-emerald-500">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <FolderArchive className="h-4 w-4 text-emerald-400" />
                  <span>Descargar Stems Individuales (.ZIP)</span>
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                  DAW Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Genera un archivo comprimido con cada pista procesada por separado en WAV 16-bit, alineadas a 00:00 y con archivo LEEME de sesión.
              </p>
              <button
                type="button"
                onClick={onExportStemsZip}
                disabled={activeTracksWithAudio.length === 0}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar Paquete ZIP ({activeTracksWithAudio.length} Stems)</span>
              </button>
            </div>

            {/* Option 2: Stereo Master WAV Mixdown */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-2 transition-all hover:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-white">
                  <FileAudio className="h-4 w-4 text-cyan-400" />
                  <span>Mezcla Master Completa (.WAV)</span>
                </span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                  Estéreo 16-bit
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Renderiza la suma de todas las pistas activas con volumen, paneo, EQ, afinación y compresión aplicada.
              </p>
              <button
                type="button"
                onClick={onExportMixdown}
                disabled={activeTracksWithAudio.length === 0}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar Mezcla Completa (WAV)</span>
              </button>
            </div>

            {/* Option 3: Export Selected Single Track */}
            {selectedTrack && selectedTrack.audioBuffer && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 block truncate max-w-[200px]">
                    Exportar {selectedTrack.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    WAV individual procesado
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onExportSingleTrack(selectedTrack)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                >
                  <Download className="h-3 w-3" />
                  <span>Descargar</span>
                </button>
              </div>
            )}
          </div>

          {/* More options button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-full py-2 text-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors border-t border-zinc-800/80"
          >
            Configuración Avanzada de Exportación (Selección manual de pistas) →
          </button>
        </div>
      </div>

      {/* Loaded Tracks Overview List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Pistas Vocales en el Estudio ({tracks.length} Canales)</span>
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            Haz clic en una pista para seleccionarla y editarla
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {tracks.map((t, idx) => {
            const isSelected = t.id === selectedTrackId;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                className={`flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-md ring-1 ring-cyan-500/40'
                    : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      P{idx + 1}: {t.name}
                    </span>
                  </div>
                  {t.audioBuffer ? (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                      AUDIO OK
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">
                      VACÍA
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Modo: <strong className="text-zinc-200">{t.tuningMode === 'autotune_hard' ? 'AutoTune' : t.tuningMode === 'melodyne_natural' ? 'Melodyne' : 'Bypass'}</strong></span>
                  <span>{t.duration ? `${t.duration.toFixed(1)}s` : '0s'}</span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1 text-[9px] font-mono pt-1 border-t border-zinc-800/60">
                  <span className={`px-1 rounded ${t.eq?.enabled ? 'text-purple-300 bg-purple-950/40' : 'text-zinc-600'}`}>
                    EQ:{t.eq?.enabled ? 'ON' : 'OFF'}
                  </span>
                  <span className={`px-1 rounded ${t.compressor?.enabled ? 'text-amber-300 bg-amber-950/40' : 'text-zinc-600'}`}>
                    COMP:{t.compressor?.enabled ? 'ON' : 'OFF'}
                  </span>
                  <span className="text-cyan-400 ml-auto">
                    {t.detectedNotes?.length || 0} notas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
