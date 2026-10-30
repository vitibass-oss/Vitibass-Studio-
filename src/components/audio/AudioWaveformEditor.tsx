import React, { useRef, useEffect, useState } from 'react';
import {
  Scissors,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  Play,
  Pause,
  Maximize2,
  ArrowRightLeft,
  Sparkles,
  Zap,
  Sliders,
  Check,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { VocalTrack } from '../../types/audio';
import {
  trimAudioBuffer,
  normalizeAudioBuffer,
  applyFadesToAudioBuffer,
  muteAudioBufferRegion,
  invertAudioBufferPhase,
  reverseAudioBuffer,
  extractWaveformData,
  analyzePitchSegments,
} from '../../utils/audioDsp';

interface AudioWaveformEditorProps {
  track: VocalTrack | null;
  onUpdateTrackAudio: (newBuffer: AudioBuffer, actionDescription: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastActionDescription?: string;
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  audioContext: AudioContext | null;
}

export const AudioWaveformEditor: React.FC<AudioWaveformEditorProps> = ({
  track,
  onUpdateTrackAudio,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastActionDescription,
  currentTime,
  onSeek,
  isPlaying,
  onPlayPause,
  audioContext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(6.0);
  const [fadeInMs, setFadeInMs] = useState<number>(50);
  const [fadeOutMs, setFadeOutMs] = useState<number>(100);
  const [isDraggingHandle, setIsDraggingHandle] = useState<'start' | 'end' | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const duration = track?.duration || track?.audioBuffer?.duration || 6.0;

  // Sync trim bounds when track changes
  useEffect(() => {
    if (track?.audioBuffer) {
      setTrimStart(0);
      setTrimEnd(track.audioBuffer.duration);
    }
  }, [track?.id]);

  const showStatus = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // Draw Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track?.audioBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const wavePoints = extractWaveformData(track.audioBuffer, 220);
    const midY = height / 2;

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // 1. Draw Inactive / Active region background
    const startX = (trimStart / duration) * width;
    const endX = (trimEnd / duration) * width;

    // Dim outside selected region
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    // Active selection highlight
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillRect(startX, 0, endX - startX, height);

    // 2. Draw Waveform Bars
    const barWidth = width / wavePoints.length;
    wavePoints.forEach((val, i) => {
      const x = i * barWidth;
      const barHeight = Math.max(2, val * (height * 0.44));
      const isInSelection = x >= startX && x <= endX;

      ctx.fillStyle = isInSelection ? '#22d3ee' : 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(x, midY - barHeight, barWidth - 1, barHeight * 2);
    });

    // 3. Draw Trim Handles
    // Start Handle (Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(startX, 12, 6, 0, 2 * Math.PI);
    ctx.fill();

    // End Handle (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(endX, 12, 6, 0, 2 * Math.PI);
    ctx.fill();

    // 4. Playhead position line
    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [track?.audioBuffer, trimStart, trimEnd, currentTime, duration]);

  // Handle canvas mouse interaction for trim handles
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const startX = (trimStart / duration) * canvas.width;
    const endX = (trimEnd / duration) * canvas.width;

    if (Math.abs(clickX - startX) <= 15) {
      setIsDraggingHandle('start');
    } else if (Math.abs(clickX - endX) <= 15) {
      setIsDraggingHandle('end');
    } else {
      // Seek to click position
      const clickedTime = (clickX / canvas.width) * duration;
      onSeek(clickedTime);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingHandle || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(canvas.width, ((e.clientX - rect.left) / rect.width) * canvas.width));
    const newTime = (mouseX / canvas.width) * duration;

    if (isDraggingHandle === 'start') {
      setTrimStart(Math.min(newTime, trimEnd - 0.1));
    } else if (isDraggingHandle === 'end') {
      setTrimEnd(Math.max(newTime, trimStart + 0.1));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingHandle(null);
  };

  // Audio Operations with Undo tracking
  const handleApplyTrim = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const trimmed = trimAudioBuffer(audioContext, track.audioBuffer, trimStart, trimEnd);
    onUpdateTrackAudio(trimmed, `Recorte de audio (${trimStart.toFixed(2)}s a ${trimEnd.toFixed(2)}s)`);
    setTrimStart(0);
    setTrimEnd(trimmed.duration);
    showStatus('¡Audio recortado con éxito!');
  };

  const handleNormalize = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const normalized = normalizeAudioBuffer(audioContext, track.audioBuffer, -0.2);
    onUpdateTrackAudio(normalized, 'Normalización de pico a -0.2 dBFS');
    showStatus('¡Volumen normalizado sin saturación!');
  };

  const handleApplyFades = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const faded = applyFadesToAudioBuffer(
      audioContext,
      track.audioBuffer,
      fadeInMs / 1000,
      fadeOutMs / 1000
    );
    onUpdateTrackAudio(faded, `Fade In (${fadeInMs}ms) y Fade Out (${fadeOutMs}ms)`);
    showStatus('¡Fundidos aplicados a la forma de onda!');
  };

  const handleMuteSelection = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const muted = muteAudioBufferRegion(audioContext, track.audioBuffer, trimStart, trimEnd);
    onUpdateTrackAudio(muted, `Silenciar región (${trimStart.toFixed(2)}s a ${trimEnd.toFixed(2)}s)`);
    showStatus('¡Región silenciada!');
  };

  const handleInvertPhase = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const inverted = invertAudioBufferPhase(audioContext, track.audioBuffer);
    onUpdateTrackAudio(inverted, 'Inversión de polaridad / fase 180°');
    showStatus('¡Fase invertida 180°!');
  };

  const handleReverse = () => {
    if (!track?.audioBuffer || !audioContext) return;
    const reversed = reverseAudioBuffer(audioContext, track.audioBuffer);
    onUpdateTrackAudio(reversed, 'Inversión temporal (Reverse)');
    showStatus('¡Audio invertido (Reverse)!');
  };

  if (!track || !track.audioBuffer) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-500 space-y-2">
        <AlertCircle className="h-5 w-5 text-zinc-600 mx-auto" />
        <p>Selecciona una pista que contenga audio grabado o importado para abrir el Editor de Onda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header with Undo & Redo Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-lg"
            style={{ backgroundColor: `${track.color}25`, color: track.color, border: `1px solid ${track.color}60` }}
          >
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Editor de Audio y Forma de Onda
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
                style={{ backgroundColor: `${track.color}20`, color: track.color }}
              >
                {track.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Recorte, normalización, fundidos (fades), fase y silenciado de regiones con historial ilimitado de <strong className="text-cyan-400">Deshacer (Undo)</strong> y <strong className="text-cyan-400">Rehacer (Redo)</strong>.
            </p>
          </div>
        </div>

        {/* Undo and Redo Main Actions */}
        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              canUndo
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 shadow-sm active:scale-95'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
            title="Deshacer última acción (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 className="h-4 w-4 text-cyan-400" />
            <span>Deshacer</span>
          </button>

          {/* Redo Button */}
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              canRedo
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 shadow-sm active:scale-95'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
            title="Rehacer acción deshecha (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4 text-cyan-400" />
            <span>Rehacer</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs text-cyan-200 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Interactive Waveform Canvas */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={900}
          height={160}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-auto block rounded-xl cursor-crosshair"
        />

        {/* Time overlay indicator */}
        <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800">
          <span className="text-cyan-400">Inicio: {trimStart.toFixed(2)}s</span>
          <span>·</span>
          <span className="text-amber-400">Fin: {trimEnd.toFixed(2)}s</span>
          <span>·</span>
          <span>Duración Sel: {(trimEnd - trimStart).toFixed(2)}s</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Recortar Selección */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5 text-cyan-400" />
            <span>Recortar (Crop)</span>
          </span>
          <p className="text-[10px] text-zinc-400">
            Conserva únicamente el audio entre los marcadores seleccionados.
          </p>
          <button
            type="button"
            onClick={handleApplyTrim}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-md transition-all"
          >
            <Scissors className="h-3 w-3" />
            <span>Aplicar Recorte</span>
          </button>
        </div>

        {/* 2. Normalizar Audio */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Normalizar Pico</span>
          </span>
          <p className="text-[10px] text-zinc-400">
            Ajusta el volumen máximo a -0.2 dBFS sin distorsión ni clipping.
          </p>
          <button
            type="button"
            onClick={handleNormalize}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Normalizar</span>
          </button>
        </div>

        {/* 3. Fundidos (Fades) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Fades In / Out</span>
            <span className="text-[10px] font-mono text-cyan-300">{fadeInMs}ms / {fadeOutMs}ms</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-zinc-500 font-mono">In (ms)</label>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={fadeInMs}
                onChange={(e) => setFadeInMs(Number(e.target.value))}
                className="w-full h-1 rounded bg-zinc-800 accent-cyan-400"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-mono">Out (ms)</label>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={fadeOutMs}
                onChange={(e) => setFadeOutMs(Number(e.target.value))}
                className="w-full h-1 rounded bg-zinc-800 accent-amber-400"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyFades}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all"
          >
            <Sparkles className="h-3 w-3" />
            <span>Aplicar Fades</span>
          </button>
        </div>

        {/* 4. Silenciar / Invertir Fase / Reverse */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-purple-400" />
            <span>Utilidades de Edición</span>
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={handleMuteSelection}
              className="px-2 py-1.5 rounded text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              title="Silenciar la región seleccionada"
            >
              Silenciar
            </button>
            <button
              type="button"
              onClick={handleInvertPhase}
              className="px-2 py-1.5 rounded text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              title="Invertir fase 180°"
            >
              Fase 180°
            </button>
            <button
              type="button"
              onClick={handleReverse}
              className="px-2 py-1.5 rounded text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              title="Invertir audio en el tiempo"
            >
              Reverse
            </button>
          </div>
          <p className="text-[9px] text-zinc-500 font-mono">
            Último cambio: {lastActionDescription || 'Sin cambios recientes'}
          </p>
        </div>
      </div>
    </div>
  );
};
