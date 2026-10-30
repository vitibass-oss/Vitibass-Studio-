import React, { useRef, useState } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Sliders,
  Download,
  Trash2,
  Copy,
  Plus,
  CheckSquare,
  Square,
  Activity,
  Layers,
  Upload,
  AlignLeft,
  FileAudio,
} from 'lucide-react';
import { VocalTrack } from '../../types/audio';

interface VocalTrackListProps {
  tracks: VocalTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<VocalTrack>) => void;
  onDeleteTrack: (trackId: string) => void;
  onDuplicateTrack: (trackId: string) => void;
  onExportTrackWav: (track: VocalTrack) => void;
  onAddEmptyTrack: () => void;
  onAddTrackFile?: (file: File) => void;
  onAssignAudioToTrack?: (trackId: string, file: File) => void;
  onAlignSingleTrackToGuide?: (trackId: string) => void;
  onOpenEqForTrack?: (trackId: string) => void;
  isPlaying?: boolean;
  maxTracks?: number;
}

export const VocalTrackList: React.FC<VocalTrackListProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onUpdateTrack,
  onDeleteTrack,
  onDuplicateTrack,
  onExportTrackWav,
  onAddEmptyTrack,
  onAddTrackFile,
  onAssignAudioToTrack,
  onAlignSingleTrackToGuide,
  onOpenEqForTrack,
  isPlaying = false,
  maxTracks = 8,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const trackFileInputRefs = useRef<{ [trackId: string]: HTMLInputElement | null }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!onAddTrackFile) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (tracks.length + i < maxTracks) {
          onAddTrackFile(files[i]);
        }
      }
    }
  };

  const handleTrackFileChange = (trackId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAssignAudioToTrack) {
      onAssignAudioToTrack(trackId, file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col space-y-3 rounded-2xl transition-all ${
        isDragOver ? 'ring-2 ring-cyan-400 bg-cyan-950/20 p-2' : ''
      }`}
    >
      {/* List Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Pistas Vocales ({tracks.length}/{maxTracks})
          </h3>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            · Selecciona para editar individualmente o marca la casilla para editar al unísono
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tracks.length < maxTracks && (
            <button
              type="button"
              onClick={onAddEmptyTrack}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 rounded-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Añadir Pista ({tracks.length + 1}/{maxTracks})</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Hint Banner if tracks < 8 */}
      {tracks.length < maxTracks && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-2 text-center text-xs text-zinc-500">
          <span className="text-cyan-400 font-semibold">Tip Pro:</span> Puedes arrastrar y soltar archivos de audio (.wav, .mp3) directamente aquí para cargar hasta {maxTracks} pistas de voz simultáneas.
        </div>
      )}

      {/* Track Slots (Up to 8) */}
      <div className="grid grid-cols-1 gap-2.5">
        {tracks.map((track, idx) => {
          const isSelected = track.id === selectedTrackId;
          const volDb = (20 * Math.log10(Math.max(0.01, track.volume))).toFixed(1);

          // Simulated VU Meter level
          const meterLevel = isPlaying && !track.muted && track.audioBuffer
            ? Math.min(100, Math.round(track.volume * 70 + (Math.sin(idx * 2 + Date.now() / 200) * 15 + 15)))
            : 0;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`group relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/90'
              }`}
            >
              {/* Left Column: Unison Checkbox, Slot Number, Color, Name, Role */}
              <div className="flex items-center gap-3 min-w-[280px]">
                {/* Checkbox for Unison group inclusion */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTrack(track.id, { isSelectedForUnison: !track.isSelectedForUnison });
                  }}
                  className="text-zinc-400 hover:text-cyan-400 transition-colors p-1"
                  title="Incluir / Excluir de la edición al unísono"
                >
                  {track.isSelectedForUnison ? (
                    <CheckSquare className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-600" />
                  )}
                </button>

                {/* Track Slot Number Badge */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800">
                  {idx + 1}
                </span>

                {/* Color Pip */}
                <div
                  className="h-8 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: track.color }}
                />

                {/* Name & Role */}
                <div className="space-y-0.5 flex-1 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={track.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                      className="bg-transparent text-xs font-bold text-white hover:border-b hover:border-zinc-700 focus:border-b focus:border-cyan-400 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <select
                      value={track.role}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateTrack(track.id, { role: e.target.value as any })}
                      className="bg-transparent text-zinc-300 font-medium hover:text-white cursor-pointer focus:outline-none text-[11px]"
                    >
                      <option value="lead" className="bg-zinc-900 text-white">Voz Principal (Lead)</option>
                      <option value="harmony" className="bg-zinc-900 text-white">Armonía</option>
                      <option value="backing" className="bg-zinc-900 text-white">Coros / Fondo</option>
                      <option value="dubbing" className="bg-zinc-900 text-white">Doblaje / Locución</option>
                    </select>
                    <span>·</span>
                    <span className="font-mono text-zinc-500">
                      {track.audioBuffer ? `${track.duration.toFixed(1)}s` : 'Sin audio'}
                    </span>
                  </div>
                </div>

                {/* Upload audio button if track has no audio or wants to replace */}
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="file"
                    ref={(el) => {
                      trackFileInputRefs.current[track.id] = el;
                    }}
                    onChange={(e) => handleTrackFileChange(track.id, e)}
                    accept="audio/*,.wav,.mp3,.ogg,.m4a"
                    className="hidden"
                  />
                  {!track.audioBuffer && (
                    <button
                      type="button"
                      onClick={() => trackFileInputRefs.current[track.id]?.click()}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-semibold hover:bg-cyan-900"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Cargar Audio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Center Column: Pitch Tuning Mode & Key/Scale Info */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                    track.tuningMode === 'autotune_hard'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                      : track.tuningMode === 'melodyne_natural'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {track.tuningMode === 'autotune_hard'
                    ? 'AUTO-TUNE 0ms'
                    : track.tuningMode === 'melodyne_natural'
                    ? `MELODYNE (${track.retuneSpeedMs}ms)`
                    : 'BYPASS'}
                </span>

                <span className="text-[11px] font-mono text-zinc-300">
                  {track.musicalKey} {track.scaleType}
                </span>

                <span className="text-[11px] font-mono text-zinc-400">
                  {track.pitchShiftSemitones >= 0 ? `+${track.pitchShiftSemitones}` : track.pitchShiftSemitones}st
                </span>

                <span className="text-[11px] font-mono text-zinc-500">
                  {track.sourceBpm} BPM
                </span>

                {/* Parametric EQ Badge / Quick Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTrack(track.id);
                    if (onOpenEqForTrack) onOpenEqForTrack(track.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border transition-all ${
                    track.eq?.enabled !== false
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/60 hover:bg-purple-900'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                  }`}
                  title="Abrir ecualizador paramétrico de 5 bandas para esta pista"
                >
                  EQ 5B
                </button>

                {/* Individual VocALign align to Guide Track 1 */}
                {idx > 0 && onAlignSingleTrackToGuide && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAlignSingleTrackToGuide(track.id);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-emerald-950 text-zinc-400 hover:text-emerald-300 border border-zinc-700 text-[10px] font-mono transition-colors"
                    title="Alinear rítmicamente esta pista a la Pista Guía 1"
                  >
                    <AlignLeft className="h-3 w-3" />
                    <span>Alinear a Pista 1</span>
                  </button>
                )}
              </div>

              {/* Right Column: Simulated VU meter, Solo / Mute / Volume / Pan / Actions */}
              <div
                className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Simulated VU Meter */}
                <div className="w-12 h-2.5 rounded bg-zinc-950 border border-zinc-800 p-0.5 flex items-center overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                    style={{ width: `${meterLevel}%` }}
                  />
                </div>

                {/* Solo and Mute Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateTrack(track.id, { solo: !track.solo })}
                    className={`h-7 w-7 rounded font-mono text-[11px] font-bold transition-all ${
                      track.solo
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Solo pista"
                  >
                    S
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                    className={`h-7 w-7 rounded font-mono text-[11px] font-bold transition-all ${
                      track.muted
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Silenciar pista (Mute)"
                  >
                    M
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 w-24">
                  <Volume2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={track.volume}
                    onChange={(e) => onUpdateTrack(track.id, { volume: Number(e.target.value) })}
                    className="w-full h-1.5 rounded bg-zinc-800 accent-cyan-400 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-zinc-400 w-7 text-right">
                    {volDb}
                  </span>
                </div>

                {/* Pan Slider */}
                <div className="flex items-center gap-1 w-20 text-[10px] font-mono text-zinc-400">
                  <span className="text-zinc-500">P:</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={track.pan}
                    onChange={(e) => onUpdateTrack(track.id, { pan: Number(e.target.value) })}
                    className="w-full h-1.5 rounded bg-zinc-800 accent-amber-400 cursor-pointer"
                    title="Paneo estéreo (L / R)"
                  />
                  <span>
                    {track.pan < -0.1 ? 'L' : track.pan > 0.1 ? 'R' : 'C'}
                  </span>
                </div>

                {/* Duplicate Track */}
                {tracks.length < maxTracks && (
                  <button
                    type="button"
                    onClick={() => onDuplicateTrack(track.id)}
                    className="p-1.5 text-zinc-400 hover:text-amber-300 transition-colors rounded hover:bg-zinc-800"
                    title="Duplicar pista para doblaje / armonía estéreo"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Export single track WAV */}
                <button
                  type="button"
                  onClick={() => onExportTrackWav(track)}
                  disabled={!track.audioBuffer}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-zinc-800"
                  title="Descargar pista afinada como WAV"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                {/* Delete Track */}
                <button
                  type="button"
                  onClick={() => onDeleteTrack(track.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors rounded hover:bg-zinc-800"
                  title="Eliminar pista"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
