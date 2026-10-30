import React, { useRef, useEffect, useState } from 'react';
import { VocalTrack, PitchNote, MusicalKey, ScaleType } from '../../types/audio';
import {
  NOTE_NAMES,
  getKeyRootIndex,
  SCALE_INTERVALS,
  midiToNoteName,
  midiToFrequency,
} from '../../utils/audioDsp';
import {
  Music,
  Eye,
  Sliders,
  Play,
  Layers,
  Sparkles,
  Check,
  ArrowUp,
  ArrowDown,
  Wand2,
} from 'lucide-react';

interface MelodynePianoRollProps {
  track: VocalTrack | null;
  allTracks: VocalTrack[];
  currentTime: number;
  duration: number;
  bpm: number;
  onSeek: (time: number) => void;
  onUpdateTrackNotes?: (trackId: string, notes: PitchNote[]) => void;
}

// Display range: from C3 (MIDI 48) to C6 (MIDI 84)
const MIN_MIDI = 48; // C3
const MAX_MIDI = 84; // C6
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1;
const NOTE_HEIGHT = 20;

export const MelodynePianoRoll: React.FC<MelodynePianoRollProps> = ({
  track,
  allTracks,
  currentTime,
  duration,
  bpm,
  onSeek,
  onUpdateTrackNotes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewAllOverlay, setViewAllOverlay] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Active scale note set (0 to 11)
  const rootIndex = track ? getKeyRootIndex(track.musicalKey) : 0;
  const intervals = track ? SCALE_INTERVALS[track.scaleType] : SCALE_INTERVALS.major;
  const inScalePitchClasses = new Set(intervals.map((int) => (rootIndex + int) % 12));

  const totalDuration = Math.max(6, duration || track?.duration || 6);

  const selectedNote = track?.detectedNotes?.find((n) => n.id === selectedNoteId) || null;

  // Single note pitch adjustments
  const handleSnapNoteToCenter = () => {
    if (!track || !selectedNote || !onUpdateTrackNotes) return;
    const updatedNotes = track.detectedNotes.map((n) => {
      if (n.id !== selectedNote.id) return n;
      return {
        ...n,
        deviationCents: 0,
        midiNote: n.targetMidiNote,
        frequency: midiToFrequency(n.targetMidiNote),
      };
    });
    onUpdateTrackNotes(track.id, updatedNotes);
  };

  const handleTransposeNote = (deltaSemitones: number) => {
    if (!track || !selectedNote || !onUpdateTrackNotes) return;
    const updatedNotes = track.detectedNotes.map((n) => {
      if (n.id !== selectedNote.id) return n;
      const newTarget = n.targetMidiNote + deltaSemitones;
      const newMidi = n.midiNote + deltaSemitones;
      return {
        ...n,
        targetMidiNote: newTarget,
        targetNoteName: midiToNoteName(newTarget),
        midiNote: newMidi,
        noteName: midiToNoteName(newMidi),
        frequency: midiToFrequency(newMidi),
      };
    });
    onUpdateTrackNotes(track.id, updatedNotes);
  };

  const handleFineTuneNote = (cents: number) => {
    if (!track || !selectedNote || !onUpdateTrackNotes) return;
    const updatedNotes = track.detectedNotes.map((n) => {
      if (n.id !== selectedNote.id) return n;
      return {
        ...n,
        deviationCents: cents,
      };
    });
    onUpdateTrackNotes(track.id, updatedNotes);
  };

  // Macro: Snap ALL notes of current track to 100% center
  const handleMacroCenterAllNotes = () => {
    if (!track || !onUpdateTrackNotes) return;
    const updatedNotes = track.detectedNotes.map((n) => ({
      ...n,
      deviationCents: 0,
      midiNote: n.targetMidiNote,
      frequency: midiToFrequency(n.targetMidiNote),
    }));
    onUpdateTrackNotes(track.id, updatedNotes);
  };

  // Draw Melodyne Canvas (Background Grid, Scale lanes, Notes & Pitch Blobs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Piano Key horizontal lanes
    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const y = (MAX_MIDI - midi) * NOTE_HEIGHT;
      const pitchClass = ((midi % 12) + 12) % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(pitchClass);
      const isInScale = inScalePitchClasses.has(pitchClass);

      // Background lane color
      if (isInScale) {
        ctx.fillStyle = isBlackKey ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.14)';
      } else {
        ctx.fillStyle = isBlackKey ? '#090d16' : '#10141e';
      }
      ctx.fillRect(0, y, width, NOTE_HEIGHT);

      // Subtle horizontal divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + NOTE_HEIGHT);
      ctx.lineTo(width, y + NOTE_HEIGHT);
      ctx.stroke();

      // Root note highlight line
      if (pitchClass === rootIndex) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y + NOTE_HEIGHT);
        ctx.lineTo(width, y + NOTE_HEIGHT);
        ctx.stroke();
      }
    }

    // 2. Draw Musical Time Grid (Beats & Bars)
    const beatsPerSec = bpm / 60;
    const totalBeats = totalDuration * beatsPerSec;
    const pixelsPerSec = width / totalDuration;

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat / beatsPerSec;
      const x = time * pixelsPerSec;
      const isBar = beat % 4 === 0;

      ctx.strokeStyle = isBar ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = isBar ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 3. Draw Waveform Shadow
    if (track?.audioBuffer) {
      const channel = track.audioBuffer.getChannelData(0);
      const step = Math.ceil(channel.length / width);
      const amp = NOTE_HEIGHT * 3.5;

      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      const centerY = height * 0.5;
      for (let x = 0; x < width; x++) {
        let min = 1.0;
        let max = -1.0;
        const start = x * step;
        for (let j = 0; j < step; j++) {
          const datum = channel[start + j] || 0;
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        ctx.moveTo(x, centerY + min * amp);
        ctx.lineTo(x, centerY + max * amp);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Melodyne Pitch Blobs
    const tracksToDraw = viewAllOverlay ? allTracks : track ? [track] : [];

    tracksToDraw.forEach((t) => {
      const isCurrentActive = t.id === track?.id;
      const opacity = viewAllOverlay && !isCurrentActive ? 0.45 : 1.0;

      if (!t.detectedNotes) return;

      for (const note of t.detectedNotes) {
        const x = (note.startTime / totalDuration) * width;
        const w = Math.max(16, (note.duration / totalDuration) * width);

        const originalY = (MAX_MIDI - note.midiNote) * NOTE_HEIGHT;
        const targetY = (MAX_MIDI - note.targetMidiNote) * NOTE_HEIGHT;

        const isHardAutotune = t.tuningMode === 'autotune_hard';
        const isBypass = t.tuningMode === 'none';

        // Display Y calculation based on tuning mode and cents
        let displayY = isBypass
          ? originalY
          : isHardAutotune
          ? targetY
          : originalY + (targetY - originalY) * 0.85;

        // If fine-tuned manually (cents deviation === 0), center perfectly
        if (note.deviationCents === 0 && !isBypass) {
          displayY = targetY;
        }

        const blobH = NOTE_HEIGHT - 3;
        const radius = blobH / 2;
        const isSelected = isCurrentActive && note.id === selectedNoteId;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.shadowColor = isSelected ? '#ffffff' : t.color;
        ctx.shadowBlur = isSelected ? 12 : isHardAutotune ? 8 : 4;

        // Gradient for Melodyne blob
        const grad = ctx.createLinearGradient(x, displayY, x + w, displayY + blobH);
        grad.addColorStop(0, isSelected ? '#38bdf8' : t.color || '#38bdf8');
        grad.addColorStop(1, isSelected ? '#0284c7' : '#0369a1');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, displayY + 1.5, w, blobH, radius);
        ctx.fill();

        // Selected note outline
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Target corrected pitch guide line
        if (!isBypass && Math.abs(originalY - targetY) > 2) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, targetY + NOTE_HEIGHT / 2);
          ctx.lineTo(x + w, targetY + NOTE_HEIGHT / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Note label text inside blob
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const label = `${note.targetNoteName} (${note.deviationCents > 0 ? '+' : ''}${note.deviationCents}c)`;
        ctx.fillText(label, x + 6, displayY + NOTE_HEIGHT / 2);

        ctx.restore();
      }
    });

    // 5. Draw Playhead Needle
    const playheadX = (currentTime / totalDuration) * width;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
  }, [track, allTracks, viewAllOverlay, currentTime, totalDuration, bpm, inScalePitchClasses, rootIndex, selectedNoteId]);

  // Handle clicking on canvas: check if clicking on a note blob or seeking time
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check if clicked inside a note blob of the active track
    if (track?.detectedNotes) {
      const width = canvas.width;
      let clickedNote: PitchNote | null = null;

      for (const note of track.detectedNotes) {
        const x = (note.startTime / totalDuration) * width;
        const w = Math.max(16, (note.duration / totalDuration) * width);
        const targetY = (MAX_MIDI - note.targetMidiNote) * NOTE_HEIGHT;

        if (
          clickX >= x - 4 &&
          clickX <= x + w + 4 &&
          clickY >= targetY - 4 &&
          clickY <= targetY + NOTE_HEIGHT + 4
        ) {
          clickedNote = note;
          break;
        }
      }

      if (clickedNote) {
        setSelectedNoteId(clickedNote.id);
        onSeek(clickedNote.startTime);
        return;
      }
    }

    // Default seek click
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const seekTime = clickRatio * totalDuration;
    onSeek(seekTime);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/70 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Music className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Editor Gráfico de Afinación (Melodyne & Auto-Tune Pitch Roll)</span>
              {track && (
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  · {track.name} ({track.detectedNotes?.length || 0} notas)
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Global Melodyne Actions & Overlay Toggle */}
        <div className="flex items-center gap-2 text-xs">
          {track && onUpdateTrackNotes && (
            <button
              type="button"
              onClick={handleMacroCenterAllNotes}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-semibold transition-all"
              title="Afinar al 100% todas las notas de esta pista centrando su desviación a 0 cents"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Afinar Pista al 100% (Melodyne Macro)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewAllOverlay(!viewAllOverlay)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition-all ${
              viewAllOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                : 'bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700'
            }`}
            title="Superpone las notas de todas las 8 pistas para ver el apilamiento coral en el piano roll"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>{viewAllOverlay ? 'Vista Superpuesta (8 Pistas)' : 'Superponer Coro Completo'}</span>
          </button>
        </div>
      </div>

      {/* Selected Note Inspector Toolbar (when a note is clicked) */}
      {selectedNote && track && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-cyan-950/40 border-b border-cyan-800/60 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
              Nota Seleccionada:
            </span>
            <span className="text-white font-bold bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-700">
              {selectedNote.targetNoteName}
            </span>
            <span className="text-zinc-400">
              ({selectedNote.frequency.toFixed(1)} Hz · Desv: {selectedNote.deviationCents > 0 ? '+' : ''}{selectedNote.deviationCents}c · {selectedNote.startTime.toFixed(2)}s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSnapNoteToCenter}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all"
              title="Centrar esta nota exactamente en su tono a 0 cents"
            >
              <Check className="h-3 w-3" />
              <span>Centrar Tono (0 cents)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTransposeNote(-1)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono"
              title="Bajar 1 semitono"
            >
              <ArrowDown className="h-3 w-3" />
              <span>-1st</span>
            </button>

            <button
              type="button"
              onClick={() => handleTransposeNote(1)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono"
              title="Subir 1 semitono"
            >
              <ArrowUp className="h-3 w-3" />
              <span>+1st</span>
            </button>

            {/* Fine tune cents slider */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-cyan-800/80">
              <span className="text-[10px] text-zinc-400 font-mono">Fino:</span>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={selectedNote.deviationCents}
                onChange={(e) => handleFineTuneNote(Number(e.target.value))}
                className="w-20 h-1.5 rounded bg-zinc-800 accent-cyan-400 cursor-pointer"
                title="Ajuste fino de afinación manual"
              />
              <span className="font-mono text-[10px] text-cyan-300 w-7 text-right">
                {selectedNote.deviationCents > 0 ? `+${selectedNote.deviationCents}` : selectedNote.deviationCents}c
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Roll Container */}
      <div className="flex flex-1 overflow-x-auto overflow-y-auto max-h-[460px] relative select-none">
        {/* Left Vertical Piano Keys */}
        <div className="sticky left-0 z-20 flex flex-col shrink-0 w-16 bg-zinc-950 border-r border-zinc-800 shadow-xl">
          {Array.from({ length: TOTAL_NOTES }).map((_, idx) => {
            const midi = MAX_MIDI - idx;
            const pitchClass = ((midi % 12) + 12) % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);
            const isC = pitchClass === 0;
            const isInScale = inScalePitchClasses.has(pitchClass);
            const noteName = midiToNoteName(midi);

            return (
              <div
                key={midi}
                style={{ height: `${NOTE_HEIGHT}px` }}
                className={`flex items-center justify-between px-1.5 text-[10px] font-mono border-b border-zinc-900 transition-colors ${
                  isBlack
                    ? 'bg-zinc-900 text-zinc-400'
                    : 'bg-zinc-800 text-zinc-200'
                } ${isInScale ? 'border-r-2 border-r-cyan-400 font-bold text-white' : ''}`}
              >
                <span>{isC || isBlack ? noteName : ''}</span>
                {isC && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Canvas with pitch curves & grid */}
        <div className="flex-1 relative cursor-crosshair min-w-[700px]">
          <canvas
            ref={canvasRef}
            width={1200}
            height={TOTAL_NOTES * NOTE_HEIGHT}
            onClick={handleCanvasClick}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Footer Info & Legend */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-3">
          <span>Rango: C3 a C6</span>
          <span>·</span>
          <span>Pistas en proyecto: {allTracks.length}/8</span>
          <span>·</span>
          <span>Haz clic en cualquier bloque de nota para afinarla o transponerla individualmente</span>
        </div>

        <div className="text-cyan-400 font-semibold">
          Resolución: Ventana YIN 512 samples
        </div>
      </div>
    </div>
  );
};
