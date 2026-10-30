import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Mic,
  Volume2,
  Clock,
  RotateCcw,
  FastForward,
  Rewind,
  Radio,
  Undo2,
  Redo2,
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  onRecordTake: (audioBlob: Blob) => void;
  bpm: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  duration,
  onSeek,
  isLooping,
  onToggleLoop,
  onRecordTake,
  bpm,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Calculate Bars : Beats : 16ths
  const beatsPerSecond = bpm / 60;
  const currentBeats = currentTime * beatsPerSecond;
  const bar = Math.floor(currentBeats / 4) + 1;
  const beat = Math.floor(currentBeats % 4) + 1;
  const sixteenth = Math.floor((currentBeats % 1) * 4) + 1;

  // Format MM:SS.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordTake(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      if (!isPlaying) {
        onPlayPause();
      }
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Por favor permite el acceso al micrófono en el navegador para grabar tu voz.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full border-b border-zinc-800 bg-zinc-950 px-4 py-2.5 sm:px-6 shadow-inner">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Left: Transport Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Return to Zero */}
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Detener y volver al inicio"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={onPlayPause}
            className={`flex h-10 px-4 items-center justify-center gap-2 rounded-xl font-bold text-xs shadow-md transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>Reproducir</span>
              </>
            )}
          </button>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              isLooping
                ? 'bg-cyan-950 text-cyan-400 border-cyan-700/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Bucle / Repetición continua"
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>

          {/* Record Microphone Button */}
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-semibold transition-all ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
            }`}
            title="Grabar toma vocal con micrófono"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{isRecording ? 'Grabando...' : 'Grabar Mic'}</span>
          </button>

          {/* Undo / Redo in Transport */}
          <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                canUndo
                  ? 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:bg-zinc-800 hover:text-white'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-50'
              }`}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                canRedo
                  ? 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:bg-zinc-800 hover:text-white'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-50'
              }`}
              title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Timeline Display & Musical Bar Counter */}
        <div className="flex items-center gap-3">
          {/* Musical Bar:Beat counter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">COMPÁS:</span>
            <span className="font-bold text-cyan-300 text-sm">{bar}</span>
            <span className="text-zinc-600">:</span>
            <span className="font-bold text-cyan-400">{beat}</span>
            <span className="text-zinc-600">:</span>
            <span className="text-zinc-400">{sixteenth}</span>
          </div>

          {/* Timecode display */}
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-bold text-zinc-100">{formatTime(currentTime)}</span>
            <span className="text-zinc-500">/ {formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Timeline Position Scrubber */}
        <div className="flex flex-1 items-center gap-2 max-w-md w-full">
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
