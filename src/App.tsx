import React, { useState, useEffect, useRef } from 'react';
import { AudioStudioHeader } from './components/audio/AudioStudioHeader';
import { TransportBar } from './components/audio/TransportBar';
import {
  StudioNavigationTabs,
  StudioViewMode,
  StudioModuleTab,
} from './components/audio/StudioNavigationTabs';
import { AudioImportExportCenter } from './components/audio/AudioImportExportCenter';
import { AudioWaveformEditor } from './components/audio/AudioWaveformEditor';
import { UnisonControlsBar } from './components/audio/UnisonControlsBar';
import { VocalTrackList } from './components/audio/VocalTrackList';
import { MelodynePianoRoll } from './components/audio/MelodynePianoRoll';
import { AutoTunePanel } from './components/audio/AutoTunePanel';
import { ParametricEqPanel } from './components/audio/ParametricEqPanel';
import { AiVocalAdvisorModal } from './components/audio/AiVocalAdvisorModal';
import { ExportModal } from './components/audio/ExportModal';
import {
  VocalTrack,
  MusicalKey,
  ScaleType,
  QuantizeDivision,
  TuningMode,
  VocalStylePreset,
  PitchNote,
  TrackEq,
  TrackCompressor,
} from './types/audio';
import {
  analyzePitchSegments,
  encodeAudioBufferToWav,
  renderProcessedVocalBuffer,
  normalizeAudioBuffer,
} from './utils/audioDsp';
import { createPresetVocalTracks } from './utils/presetAudio';
import { exportStemsZip } from './utils/stemExporter';
import { createDefaultTrackEq, createDefaultTrackCompressor } from './utils/eqCalculations';
import {
  CheckCircle2,
  AlertCircle,
  Sliders,
  Activity,
  Layers,
  Gauge,
  Music2,
  Upload,
  Scissors,
  Download,
  FolderArchive,
} from 'lucide-react';

const MAX_TRACKS = 8;

interface ActiveTrackNode {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: StereoPannerNode | null;
  filters?: BiquadFilterNode[];
  compressor?: DynamicsCompressorNode;
  makeupGain?: GainNode;
}

function cloneTrack(t: VocalTrack): VocalTrack {
  return {
    ...t,
    detectedNotes: t.detectedNotes ? t.detectedNotes.map((n) => ({ ...n })) : [],
    eq: t.eq ? { enabled: t.eq.enabled, bands: t.eq.bands.map((b) => ({ ...b })) } : undefined,
    compressor: t.compressor ? { ...t.compressor } : undefined,
  };
}

export default function App() {
  const [tracks, setTracks] = useState<VocalTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [masterBpm, setMasterBpm] = useState(120);
  const [masterKey, setMasterKey] = useState<MusicalKey>('C');
  const [masterScale, setMasterScale] = useState<ScaleType>('major');
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUnisonModeActive, setIsUnisonModeActive] = useState(true);

  // View and Module navigation state
  const [viewMode, setViewMode] = useState<StudioViewMode>('all');
  const [activeModuleTab, setActiveModuleTab] = useState<StudioModuleTab>('both');

  // History Stack for Undo and Redo
  const historyRef = useRef<{ description: string; tracks: VocalTrack[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastActionDescription, setLastActionDescription] = useState<string>('Sesión cargada');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportProgressPercent, setExportProgressPercent] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Web Audio Context & Active Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const activeTrackNodesRef = useRef<Map<string, ActiveTrackNode>>(new Map());
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Get or initialize AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Push state snapshot to Undo/Redo stack
  const pushHistory = (description: string, newTracks: VocalTrack[]) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push({
      description,
      tracks: newTracks.map(cloneTrack),
    });
    if (nextHistory.length > 30) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setLastActionDescription(description);
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const target = historyRef.current[historyIndexRef.current];
    if (target) {
      setTracks(target.tracks.map(cloneTrack));
      showNotification(`Deshecho: ${target.description}`);
      setLastActionDescription(target.description);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const target = historyRef.current[historyIndexRef.current];
    if (target) {
      setTracks(target.tracks.map(cloneTrack));
      showNotification(`Rehecho: ${target.description}`);
      setLastActionDescription(target.description);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  // Global Keyboard Shortcuts for Undo & Redo (Ctrl+Z, Ctrl+Y, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Initial Demo Tracks on mount
  useEffect(() => {
    const initDemo = async () => {
      try {
        const ctx = getAudioContext();
        const demoTracks = await createPresetVocalTracks(ctx, 8);
        setTracks(demoTracks);
        if (demoTracks.length > 0) {
          setSelectedTrackId(demoTracks[0].id);
        }
        historyRef.current = [
          {
            description: 'Carga inicial de 8 pistas demo',
            tracks: demoTracks.map(cloneTrack),
          },
        ];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      } catch (err) {
        console.error('Failed to load demo tracks:', err);
      }
    };
    initDemo();

    return () => {
      stopPlayback();
    };
  }, []);

  // Calculate project max duration
  const projectDuration = tracks.reduce((max, t) => Math.max(max, t.duration), 6.0);

  // Stop active playback nodes
  const stopPlayback = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // already stopped
      }
    });
    activeSourcesRef.current = [];
    activeTrackNodesRef.current.clear();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
  };

  // Play / Pause handler
  const handlePlayPause = async () => {
    const ctx = getAudioContext();
    if (isPlaying) {
      stopPlayback();
      playbackStartOffsetRef.current = currentTime;
      setIsPlaying(false);
      return;
    }

    if (currentTime >= projectDuration) {
      playbackStartOffsetRef.current = 0;
      setCurrentTime(0);
    }

    stopPlayback();

    const startOffset = playbackStartOffsetRef.current;
    playbackStartTimeRef.current = ctx.currentTime;

    const hasSolo = tracks.some((t) => t.solo);

    // Start all active tracks
    tracks.forEach((track) => {
      if (!track.audioBuffer) return;

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = track.audioBuffer;

      // Pitch calculation
      const totalCents =
        (track.tuningMode === 'none' ? 0 : track.pitchShiftSemitones * 100) +
        (track.tuningMode === 'none' ? 0 : track.fineTuneCents);
      const pitchRatio = Math.pow(2, totalCents / 1200);

      // Time stretch
      const timeRatio = masterBpm / (track.sourceBpm || masterBpm);
      sourceNode.playbackRate.value = pitchRatio * timeRatio;

      let lastNode: AudioNode = sourceNode;

      // 1. Dynamic Compression (Pre-EQ)
      let compNode: DynamicsCompressorNode | undefined;
      let makeupGainNode: GainNode | undefined;
      const trackComp = track.compressor || createDefaultTrackCompressor();
      if (trackComp.enabled) {
        compNode = ctx.createDynamicsCompressor();
        compNode.threshold.setValueAtTime(trackComp.threshold, ctx.currentTime);
        compNode.ratio.setValueAtTime(trackComp.ratio, ctx.currentTime);
        compNode.attack.setValueAtTime(trackComp.attack, ctx.currentTime);
        compNode.release.setValueAtTime(trackComp.release, ctx.currentTime);
        compNode.knee.setValueAtTime(trackComp.knee, ctx.currentTime);

        lastNode.connect(compNode);
        lastNode = compNode;

        if (trackComp.makeupGain && trackComp.makeupGain > 0) {
          makeupGainNode = ctx.createGain();
          makeupGainNode.gain.setValueAtTime(Math.pow(10, trackComp.makeupGain / 20), ctx.currentTime);
          lastNode.connect(makeupGainNode);
          lastNode = makeupGainNode;
        }
      }

      // 2. 5-Band Parametric EQ (Post-Compression)
      const filterNodes: BiquadFilterNode[] = [];
      const trackEq = track.eq || createDefaultTrackEq();
      trackEq.bands.forEach((b) => {
        const filter = ctx.createBiquadFilter();
        filter.type = b.type;
        filter.frequency.setValueAtTime(b.frequency, ctx.currentTime);
        filter.Q.setValueAtTime(b.q, ctx.currentTime);
        filter.gain.setValueAtTime(
          trackEq.enabled && b.enabled ? (b.type === 'highpass' ? 0 : b.gain) : 0,
          ctx.currentTime
        );
        lastNode.connect(filter);
        lastNode = filter;
        filterNodes.push(filter);
      });

      // Gain node
      const isMuted = track.muted || (hasSolo && !track.solo);
      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : track.volume * masterVolume;

      // Panner node
      const pannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pannerNode) {
        pannerNode.pan.value = track.pan;
        lastNode.connect(pannerNode);
        pannerNode.connect(gainNode);
      } else {
        lastNode.connect(gainNode);
      }

      gainNode.connect(ctx.destination);

      const offsetSeconds = (track.timeOffsetMs || 0) / 1000;
      const effectiveStartOffset = Math.max(0, startOffset + offsetSeconds);
      const offsetInTrack = effectiveStartOffset % track.duration;

      sourceNode.start(0, offsetInTrack);
      activeSourcesRef.current.push(sourceNode);

      activeTrackNodesRef.current.set(track.id, {
        source: sourceNode,
        gain: gainNode,
        panner: pannerNode,
        filters: filterNodes,
        compressor: compNode,
        makeupGain: makeupGainNode,
      });
    });

    if (metronomeActive) {
      startMetronome(ctx);
    }

    setIsPlaying(true);

    const updatePlayhead = () => {
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      const newPos = startOffset + elapsed;

      if (newPos >= projectDuration) {
        if (isLooping) {
          playbackStartOffsetRef.current = 0;
          playbackStartTimeRef.current = ctx.currentTime;
          setCurrentTime(0);
          handlePlayPause();
          return;
        } else {
          stopPlayback();
          setCurrentTime(projectDuration);
          setIsPlaying(false);
          return;
        }
      }

      setCurrentTime(newPos);
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  };

  const startMetronome = (ctx: AudioContext) => {
    if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    const intervalMs = (60 / masterBpm) * 1000;

    const playClick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    };

    playClick();
    metronomeIntervalRef.current = window.setInterval(playClick, intervalMs);
  };

  const handleStop = () => {
    stopPlayback();
    playbackStartOffsetRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (newTime: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      stopPlayback();
    }
    playbackStartOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (wasPlaying) {
      handlePlayPause();
    }
  };

  // Add single audio file (supports WAV, MP3, FLAC, AIFF, OGG, PCM, etc.)
  const handleAddTrack = async (file: File) => {
    if (tracks.length >= MAX_TRACKS) {
      showNotification(`Límite alcanzado: máximo ${MAX_TRACKS} pistas vocales en el estudio.`, 'error');
      return;
    }

    try {
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const detectedNotes = analyzePitchSegments(audioBuffer, masterKey, masterScale);

      const trackColors = [
        '#0ea5e9',
        '#8b5cf6',
        '#10b981',
        '#f59e0b',
        '#ec4899',
        '#06b6d4',
        '#6366f1',
        '#f97316',
      ];
      const trackIndex = tracks.length;

      const newTrack: VocalTrack = {
        id: `track_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 26),
        role: trackIndex === 0 ? 'lead' : trackIndex < 4 ? 'harmony' : 'backing',
        color: trackColors[trackIndex % trackColors.length],
        audioBuffer,
        duration: audioBuffer.duration,
        muted: false,
        solo: false,
        volume: 0.85,
        pan: trackIndex % 2 === 1 ? -0.3 : trackIndex % 2 === 0 && trackIndex > 0 ? 0.3 : 0,
        tuningMode: 'melodyne_natural',
        musicalKey: masterKey,
        scaleType: masterScale,
        retuneSpeedMs: 25,
        pitchShiftSemitones: 0,
        fineTuneCents: 0,
        formantShift: 0,
        vibratoDepth: 15,
        sourceBpm: masterBpm,
        targetBpm: masterBpm,
        quantizeDivision: '1/8',
        timeStretchRatio: 1.0,
        detectedNotes,
        isProcessing: false,
        isSelectedForUnison: true,
        eq: createDefaultTrackEq(),
        compressor: createDefaultTrackCompressor(),
      };

      const updated = [...tracks, newTrack];
      setTracks(updated);
      setSelectedTrackId(newTrack.id);
      pushHistory(`Audio importado: "${newTrack.name}"`, updated);
      showNotification(`Pista importada: "${newTrack.name}" (${audioBuffer.duration.toFixed(1)}s, ${detectedNotes.length} notas analizadas)`);
    } catch (err) {
      console.error(err);
      showNotification('Error al decodificar archivo de audio. Verifica el formato.', 'error');
    }
  };

  // Batch import of multiple audio files
  const handleBatchAddFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const ctx = getAudioContext();
    const trackColors = [
      '#0ea5e9',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];

    const newTracks: VocalTrack[] = [];
    const maxToImport = Math.min(files.length, MAX_TRACKS - tracks.length);

    for (let i = 0; i < maxToImport; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const detectedNotes = analyzePitchSegments(audioBuffer, masterKey, masterScale);

        const trackIndex = (tracks.length + i) % MAX_TRACKS;
        const newTrack: VocalTrack = {
          id: `track_${Date.now()}_${i}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 26),
          role: trackIndex === 0 ? 'lead' : trackIndex < 4 ? 'harmony' : 'backing',
          color: trackColors[trackIndex % trackColors.length],
          audioBuffer,
          duration: audioBuffer.duration,
          muted: false,
          solo: false,
          volume: 0.85,
          pan: trackIndex % 2 === 1 ? -0.3 : trackIndex % 2 === 0 && trackIndex > 0 ? 0.3 : 0,
          tuningMode: 'melodyne_natural',
          musicalKey: masterKey,
          scaleType: masterScale,
          retuneSpeedMs: 25,
          pitchShiftSemitones: 0,
          fineTuneCents: 0,
          formantShift: 0,
          vibratoDepth: 15,
          sourceBpm: masterBpm,
          targetBpm: masterBpm,
          quantizeDivision: '1/8',
          timeStretchRatio: 1.0,
          detectedNotes,
          isProcessing: false,
          isSelectedForUnison: true,
          eq: createDefaultTrackEq(),
          compressor: createDefaultTrackCompressor(),
        };
        newTracks.push(newTrack);
      } catch (err) {
        console.error(`Error decoding file ${file.name}:`, err);
      }
    }

    if (newTracks.length > 0) {
      const updated = [...tracks, ...newTracks].slice(0, MAX_TRACKS);
      setTracks(updated);
      setSelectedTrackId(newTracks[0].id);
      pushHistory(`Importación por lotes (${newTracks.length} archivos)`, updated);
      showNotification(`¡${newTracks.length} pistas importadas y analizadas con éxito!`);
    }
  };

  // Add an empty track slot
  const handleAddEmptyTrack = () => {
    if (tracks.length >= MAX_TRACKS) {
      showNotification(`Límite alcanzado: máximo ${MAX_TRACKS} pistas vocales.`, 'error');
      return;
    }
    const trackColors = [
      '#0ea5e9',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];
    const newTrack: VocalTrack = {
      id: `track_${Date.now()}`,
      name: `Pista ${tracks.length + 1}: Toma Vocal`,
      role: 'backing',
      color: trackColors[tracks.length % trackColors.length],
      audioBuffer: null,
      duration: 6.0,
      muted: false,
      solo: false,
      volume: 0.85,
      pan: 0,
      tuningMode: 'none',
      musicalKey: masterKey,
      scaleType: masterScale,
      retuneSpeedMs: 25,
      pitchShiftSemitones: 0,
      fineTuneCents: 0,
      formantShift: 0,
      vibratoDepth: 10,
      sourceBpm: masterBpm,
      targetBpm: masterBpm,
      quantizeDivision: '1/8',
      timeStretchRatio: 1.0,
      detectedNotes: [],
      isProcessing: false,
      isSelectedForUnison: true,
      eq: createDefaultTrackEq(),
      compressor: createDefaultTrackCompressor(),
    };
    const updated = [...tracks, newTrack];
    setTracks(updated);
    setSelectedTrackId(newTrack.id);
    pushHistory('Pista vacía añadida', updated);
    showNotification(`Nueva pista vacía P${tracks.length + 1} añadida.`);
  };

  // Assign uploaded file to existing track
  const handleAssignAudioToTrack = async (trackId: string, file: File) => {
    try {
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const target = tracks.find((t) => t.id === trackId);
      const key = target?.musicalKey || masterKey;
      const scale = target?.scaleType || masterScale;
      const detected = analyzePitchSegments(audioBuffer, key, scale);

      const updated = tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              name: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
              audioBuffer,
              duration: audioBuffer.duration,
              detectedNotes: detected,
            }
          : t
      );
      setTracks(updated);
      pushHistory(`Audio cargado en pista "${file.name}"`, updated);
      showNotification(`Audio asignado a la pista: "${file.name}"`);
    } catch (err) {
      showNotification('Error al cargar archivo de audio en la pista', 'error');
    }
  };

  // Update track audio from Waveform Editor (Trim, Normalize, Fades, etc.)
  const handleUpdateTrackAudio = (newBuffer: AudioBuffer, actionDescription: string) => {
    if (!selectedTrack) return;
    const detectedNotes = analyzePitchSegments(
      newBuffer,
      selectedTrack.musicalKey,
      selectedTrack.scaleType
    );
    const updatedTracks = tracks.map((t) =>
      t.id === selectedTrack.id
        ? {
            ...t,
            audioBuffer: newBuffer,
            duration: newBuffer.duration,
            detectedNotes,
          }
        : t
    );
    setTracks(updatedTracks);
    pushHistory(actionDescription, updatedTracks);
    showNotification(`Edición aplicada: ${actionDescription}`);
  };

  // Normalize all tracks in session
  const handleNormalizeAllTracks = () => {
    const ctx = getAudioContext();
    const updated = tracks.map((t) => {
      if (!t.audioBuffer) return t;
      const normalized = normalizeAudioBuffer(ctx, t.audioBuffer, -0.2);
      return {
        ...t,
        audioBuffer: normalized,
      };
    });
    setTracks(updated);
    pushHistory('Normalizar todas las pistas a -0.2 dBFS', updated);
    showNotification('Todas las pistas han sido normalizadas sin saturación.');
  };

  // Delete Track
  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) {
      showNotification('Debe haber al menos 1 pista en el estudio.', 'error');
      return;
    }
    const updated = tracks.filter((t) => t.id !== trackId);
    setTracks(updated);
    if (selectedTrackId === trackId) {
      setSelectedTrackId(updated[0]?.id || null);
    }
    pushHistory('Pista eliminada', updated);
    showNotification('Pista eliminada del proyecto.');
  };

  // Duplicate Track
  const handleDuplicateTrack = (trackId: string) => {
    if (tracks.length >= MAX_TRACKS) {
      showNotification(`Límite alcanzado: máximo ${MAX_TRACKS} pistas vocales.`, 'error');
      return;
    }
    const source = tracks.find((t) => t.id === trackId);
    if (!source) return;

    const trackColors = [
      '#0ea5e9',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];
    const trackColor = trackColors[tracks.length % trackColors.length];

    const duplicated: VocalTrack = {
      ...source,
      id: `track_dup_${Date.now()}`,
      name: `${source.name} (Doble Estéreo)`,
      color: trackColor,
      pan: source.pan === 0 ? 0.45 : -source.pan,
      isSelectedForUnison: true,
      eq: source.eq ? JSON.parse(JSON.stringify(source.eq)) : createDefaultTrackEq(),
      compressor: source.compressor ? JSON.parse(JSON.stringify(source.compressor)) : createDefaultTrackCompressor(),
    };

    const updated = [...tracks, duplicated];
    setTracks(updated);
    setSelectedTrackId(duplicated.id);
    pushHistory(`Pista duplicada: "${duplicated.name}"`, updated);
    showNotification(`Pista duplicada (${tracks.length + 1}/${MAX_TRACKS}) con paneo estéreo opuesto.`);
  };

  const handleRecordTake = async (audioBlob: Blob) => {
    const file = new File([audioBlob], `Toma_Mic_${Date.now()}.wav`, { type: 'audio/wav' });
    await handleAddTrack(file);
  };

  // Update track parameters with immediate real-time node updates
  const handleUpdateTrack = (trackId: string, updates: Partial<VocalTrack>) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const updated = { ...t, ...updates };

        if (
          (updates.musicalKey && updates.musicalKey !== t.musicalKey) ||
          (updates.scaleType && updates.scaleType !== t.scaleType)
        ) {
          if (updated.audioBuffer) {
            updated.detectedNotes = analyzePitchSegments(
              updated.audioBuffer,
              updated.musicalKey,
              updated.scaleType
            );
          }
        }
        return updated;
      })
    );

    const activeNode = activeTrackNodesRef.current.get(trackId);
    if (activeNode) {
      const ctx = audioContextRef.current;
      if (ctx) {
        if (updates.volume !== undefined) {
          activeNode.gain.gain.setValueAtTime(updates.volume * masterVolume, ctx.currentTime);
        }
        if (updates.muted !== undefined) {
          activeNode.gain.gain.setValueAtTime(updates.muted ? 0 : 0.85 * masterVolume, ctx.currentTime);
        }
        if (updates.pan !== undefined && activeNode.panner) {
          activeNode.panner.pan.setValueAtTime(updates.pan, ctx.currentTime);
        }
        if (updates.pitchShiftSemitones !== undefined || updates.fineTuneCents !== undefined) {
          const targetTrack = tracks.find((t) => t.id === trackId);
          if (targetTrack) {
            const semitones = updates.pitchShiftSemitones ?? targetTrack.pitchShiftSemitones;
            const cents = updates.fineTuneCents ?? targetTrack.fineTuneCents;
            const totalCents = semitones * 100 + cents;
            const pitchRatio = Math.pow(2, totalCents / 1200);
            const timeRatio = masterBpm / (targetTrack.sourceBpm || masterBpm);
            activeNode.source.playbackRate.setValueAtTime(pitchRatio * timeRatio, ctx.currentTime);
          }
        }
        if (updates.compressor && activeNode.compressor) {
          const comp = updates.compressor;
          if (comp.threshold !== undefined) activeNode.compressor.threshold.setValueAtTime(comp.threshold, ctx.currentTime);
          if (comp.ratio !== undefined) activeNode.compressor.ratio.setValueAtTime(comp.ratio, ctx.currentTime);
          if (comp.attack !== undefined) activeNode.compressor.attack.setValueAtTime(comp.attack, ctx.currentTime);
          if (comp.release !== undefined) activeNode.compressor.release.setValueAtTime(comp.release, ctx.currentTime);
          if (comp.knee !== undefined) activeNode.compressor.knee.setValueAtTime(comp.knee, ctx.currentTime);
          if (comp.makeupGain !== undefined && activeNode.makeupGain) {
            activeNode.makeupGain.gain.setValueAtTime(Math.pow(10, comp.makeupGain / 20), ctx.currentTime);
          }
        }
        if (updates.eq && activeNode.filters) {
          const eq = updates.eq;
          eq.bands.forEach((b, idx) => {
            const filter = activeNode.filters![idx];
            if (filter) {
              filter.type = b.type;
              filter.frequency.setValueAtTime(b.frequency, ctx.currentTime);
              filter.Q.setValueAtTime(b.q, ctx.currentTime);
              filter.gain.setValueAtTime(
                eq.enabled && b.enabled ? (b.type === 'highpass' ? 0 : b.gain) : 0,
                ctx.currentTime
              );
            }
          });
        }
      }
    }
  };

  const handleUpdateTrackNotes = (trackId: string, updatedNotes: PitchNote[]) => {
    const updated = tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            detectedNotes: updatedNotes,
          }
        : t
    );
    setTracks(updated);
    pushHistory('Edición de notas en Melodyne Piano Roll', updated);
  };

  const handleSelectAllUnison = (selected: boolean) => {
    setTracks((prev) => prev.map((t) => ({ ...t, isSelectedForUnison: selected })));
  };

  const handleApplyUnisonTuningMode = (mode: TuningMode, speedMs: number = 25) => {
    const updated = tracks.map((t) =>
      t.isSelectedForUnison ? { ...t, tuningMode: mode, retuneSpeedMs: speedMs } : t
    );
    setTracks(updated);
    pushHistory(`Afinación al unísono: ${mode}`, updated);
    showNotification(`Afinación al unísono aplicada: ${mode} (${speedMs}ms)`);
  };

  const handleApplyUnisonKeyScale = (key: MusicalKey, scale: ScaleType) => {
    setMasterKey(key);
    setMasterScale(scale);
    const updated = tracks.map((t) => {
      if (!t.isSelectedForUnison) return t;
      let detected = t.detectedNotes;
      if (t.audioBuffer) {
        detected = analyzePitchSegments(t.audioBuffer, key, scale);
      }
      return {
        ...t,
        musicalKey: key,
        scaleType: scale,
        detectedNotes: detected,
      };
    });
    setTracks(updated);
    pushHistory(`Cambio de tonalidad a ${key} ${scale}`, updated);
    showNotification(`Tonalidad al unísono cambiada a ${key} ${scale}`);
  };

  const handleApplyUnisonQuantize = (quantize: QuantizeDivision) => {
    const updated = tracks.map((t) => (t.isSelectedForUnison ? { ...t, quantizeDivision: quantize } : t));
    setTracks(updated);
    pushHistory(`Cuantización al unísono: ${quantize}`, updated);
    showNotification(`Cuantización rítmica en unísono aplicada: ${quantize}`);
  };

  const handleApplyUnisonPitchShift = (deltaSemitones: number) => {
    const updated = tracks.map((t) => {
      if (!t.isSelectedForUnison) return t;
      const newShift = Math.max(-12, Math.min(12, t.pitchShiftSemitones + deltaSemitones));
      return {
        ...t,
        pitchShiftSemitones: newShift,
      };
    });
    setTracks(updated);
    pushHistory(`Transposición: ${deltaSemitones > 0 ? '+' : ''}${deltaSemitones} st`, updated);
    showNotification(`Transposición al unísono: ${deltaSemitones > 0 ? '+' : ''}${deltaSemitones} semitonos.`);
  };

  const handleApplyUnisonFormantSpread = () => {
    const selectedTracks = tracks.filter((t) => t.isSelectedForUnison);
    if (selectedTracks.length === 0) return;

    let idx = 0;
    const updated = tracks.map((t) => {
      if (!t.isSelectedForUnison) return t;
      const offset = idx % 2 === 0 ? idx * 1.5 : -idx * 1.5;
      const panOffset = idx === 0 ? 0 : idx % 2 === 1 ? -0.45 - (idx * 0.1) : 0.45 + (idx * 0.1);
      idx++;
      return {
        ...t,
        formantShift: Math.max(-8, Math.min(8, Math.round(offset))),
        pan: Math.max(-1, Math.min(1, Math.round(panOffset * 10) / 10)),
      };
    });
    setTracks(updated);
    pushHistory('Apertura estéreo y dispersión de formantes', updated);
    showNotification('Apertura estéreo y dispersión de formantes aplicada al unísono.');
  };

  const handleMacroCenteringPitch = () => {
    const updated = tracks.map((t) => {
      if (!t.isSelectedForUnison) return t;
      const centeredNotes = t.detectedNotes.map((note) => ({
        ...note,
        deviationCents: 0,
      }));
      return {
        ...t,
        fineTuneCents: 0,
        detectedNotes: centeredNotes,
      };
    });
    setTracks(updated);
    pushHistory('Macro centrado de afinación al 100%', updated);
    showNotification('Macro de afinación: 100% de desviaciones de tono centradas a la escala.');
  };

  const handleAlignToGuideTrack = () => {
    const guideTrack = tracks.find((t) => t.role === 'lead') || tracks[0];
    if (!guideTrack) return;

    const updated = tracks.map((t) => {
      if (t.id === guideTrack.id || !t.isSelectedForUnison) return t;
      return {
        ...t,
        timeOffsetMs: 0,
        sourceBpm: guideTrack.sourceBpm || masterBpm,
        targetBpm: masterBpm,
      };
    });
    setTracks(updated);
    pushHistory(`Alineación VocALign a guía "${guideTrack.name}"`, updated);
    showNotification(`Alineación temporal estilo VocALign completada usando "${guideTrack.name}" como guía.`);
  };

  const handleAlignSingleTrackToGuide = (trackId: string) => {
    const guideTrack = tracks.find((t) => t.role === 'lead') || tracks[0];
    if (!guideTrack || guideTrack.id === trackId) return;

    handleUpdateTrack(trackId, {
      timeOffsetMs: 0,
      sourceBpm: guideTrack.sourceBpm || masterBpm,
      targetBpm: masterBpm,
    });
    showNotification(`Pista alineada temporalmente con la voz guía "${guideTrack.name}".`);
  };

  const handleApplyVocalStyle = (style: VocalStylePreset) => {
    if (style === 'pop_studio') {
      const updated = tracks.map((t, idx) => ({
        ...t,
        tuningMode: 'melodyne_natural' as TuningMode,
        retuneSpeedMs: idx === 0 ? 25 : 15,
        vibratoDepth: 12,
      }));
      setTracks(updated);
      pushHistory('Plantilla: Vocal Pop Studio', updated);
      showNotification('Estilo Vocal Pop Studio aplicado');
    } else if (style === 'autotune_trap') {
      const updated = tracks.map((t) => ({
        ...t,
        tuningMode: 'autotune_hard' as TuningMode,
        retuneSpeedMs: 0,
        vibratoDepth: 0,
      }));
      setTracks(updated);
      pushHistory('Plantilla: Trap / Auto-Tune Snap', updated);
      showNotification('Estilo Trap / Urbano aplicado (0ms retune snap)');
    } else if (style === 'dubbing_pro') {
      const updated = tracks.map((t, idx) => ({
        ...t,
        tuningMode: 'melodyne_natural' as TuningMode,
        retuneSpeedMs: 45,
        formantShift: idx === 0 ? 0 : idx % 2 === 1 ? -2 : 3,
      }));
      setTracks(updated);
      pushHistory('Plantilla: Doblaje Profesional', updated);
      showNotification('Estilo Doblaje Profesional aplicado');
    } else if (style === 'choir_wall') {
      handleApplyUnisonFormantSpread();
      handleApplyUnisonTuningMode('melodyne_natural', 25);
    } else if (style === 'podcast_voice') {
      const updated = tracks.map((t) => ({
        ...t,
        tuningMode: 'none' as TuningMode,
        formantShift: 0,
        pitchShiftSemitones: 0,
      }));
      setTracks(updated);
      pushHistory('Plantilla: Locución Natural', updated);
      showNotification('Estilo Locución / Podcast aplicado');
    }
  };

  // Export single track
  const handleExportTrackWav = async (track: VocalTrack) => {
    if (!track.audioBuffer) return;
    const ctx = getAudioContext();
    showNotification(`Renderizando pista afinada "${track.name}" con EQ y compresor...`);

    const rendered = await renderProcessedVocalBuffer(ctx, track.audioBuffer, {
      pitchShiftSemitones: track.pitchShiftSemitones,
      fineTuneCents: track.fineTuneCents,
      timeStretchRatio: masterBpm / (track.sourceBpm || masterBpm),
      tuningMode: track.tuningMode,
      retuneSpeedMs: track.retuneSpeedMs,
      key: track.musicalKey,
      scale: track.scaleType,
      timeOffsetMs: track.timeOffsetMs || 0,
      volume: track.volume,
      pan: track.pan,
      eq: track.eq,
      compressor: track.compressor,
    });

    const wavBlob = encodeAudioBufferToWav(rendered);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(wavBlob);
    link.download = `${track.name}_procesada_${track.musicalKey}_${track.scaleType}.wav`;
    link.click();
    showNotification(`¡Pista descargada en formato WAV!`);
  };

  // Export full mixdown
  const handleExportMixdown = async () => {
    const ctx = getAudioContext();
    const activeTracks = tracks.filter((t) => !t.muted && t.audioBuffer);
    if (activeTracks.length === 0) {
      showNotification('No hay pistas activas con audio para exportar', 'error');
      return;
    }

    showNotification('Generando mezcla estéreo masterizada de hasta 8 pistas...');

    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * projectDuration), sampleRate);

    for (const track of activeTracks) {
      if (!track.audioBuffer) continue;
      const src = offlineCtx.createBufferSource();
      src.buffer = track.audioBuffer;

      const totalCents =
        (track.tuningMode === 'none' ? 0 : track.pitchShiftSemitones * 100) +
        (track.tuningMode === 'none' ? 0 : track.fineTuneCents);
      const pitchRatio = Math.pow(2, totalCents / 1200);
      const timeRatio = masterBpm / (track.sourceBpm || masterBpm);
      src.playbackRate.value = pitchRatio * timeRatio;

      let lastNode: AudioNode = src;

      // 1. Dynamic Compressor
      const trackComp = track.compressor;
      if (trackComp && trackComp.enabled) {
        const compNode = offlineCtx.createDynamicsCompressor();
        compNode.threshold.value = trackComp.threshold;
        compNode.ratio.value = trackComp.ratio;
        compNode.attack.value = trackComp.attack;
        compNode.release.value = trackComp.release;
        compNode.knee.value = trackComp.knee;
        lastNode.connect(compNode);
        lastNode = compNode;

        if (trackComp.makeupGain && trackComp.makeupGain > 0) {
          const makeupNode = offlineCtx.createGain();
          makeupNode.gain.value = Math.pow(10, trackComp.makeupGain / 20);
          lastNode.connect(makeupNode);
          lastNode = makeupNode;
        }
      }

      // 2. 5-band EQ
      const trackEq = track.eq;
      if (trackEq && trackEq.enabled) {
        trackEq.bands.forEach((b) => {
          if (b.enabled) {
            const filter = offlineCtx.createBiquadFilter();
            filter.type = b.type;
            filter.frequency.value = b.frequency;
            filter.Q.value = b.q;
            filter.gain.value = b.type === 'highpass' ? 0 : b.gain;
            lastNode.connect(filter);
            lastNode = filter;
          }
        });
      }

      const gain = offlineCtx.createGain();
      gain.gain.value = track.volume * masterVolume;

      const panner = offlineCtx.createStereoPanner ? offlineCtx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = track.pan;
        lastNode.connect(panner);
        panner.connect(gain);
      } else {
        lastNode.connect(gain);
      }
      gain.connect(offlineCtx.destination);
      src.start(0);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = encodeAudioBufferToWav(renderedBuffer);

    const link = document.createElement('a');
    link.href = URL.createObjectURL(wavBlob);
    link.download = `VocalForge_Master_8Pistas_${masterBpm}BPM_${masterKey}_${masterScale}.wav`;
    link.click();
    showNotification('¡Mezcla completa de 8 pistas descargada con éxito en WAV!');
  };

  // Export stems ZIP
  const handleExportStemsZip = async (selectedTrackIds?: string[]) => {
    const ctx = getAudioContext();
    const availableTracks = tracks.filter((t) => t.audioBuffer);

    if (availableTracks.length === 0) {
      showNotification('No hay pistas con audio para generar el paquete de stems ZIP.', 'error');
      return;
    }

    setIsExporting(true);
    setExportProgressPercent(5);
    setExportProgressText('Preparando stems multipista procesados para exportación...');

    const tracksToExport = selectedTrackIds
      ? availableTracks.filter((t) => selectedTrackIds.includes(t.id))
      : availableTracks;

    try {
      const zipBlob = await exportStemsZip(
        ctx,
        tracksToExport,
        masterBpm,
        masterKey,
        masterScale,
        (status: string, percent: number) => {
          setExportProgressText(status);
          setExportProgressPercent(percent);
        },
        { includeSessionNotes: true, normalizeAlignment: true }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VocalForge_Stems_${masterBpm}BPM_${masterKey}_${masterScale}.zip`;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showNotification(`¡Archivo ZIP con stems individuales descargado con éxito!`);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      showNotification('Hubo un error al empaquetar los stems en ZIP.', 'error');
    } finally {
      setIsExporting(false);
      setExportProgressPercent(0);
      setExportProgressText('');
    }
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification Alert */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border backdrop-blur-md transition-all animate-bounce ${
            notification.type === 'error'
              ? 'border-red-500/80 bg-red-950/90 text-red-200'
              : 'border-cyan-500/80 bg-zinc-900/90 text-cyan-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <AudioStudioHeader
        bpm={masterBpm}
        setBpm={(newBpm: number) => setMasterBpm(newBpm)}
        masterKey={masterKey}
        setMasterKey={(newKey: MusicalKey) => setMasterKey(newKey)}
        masterScale={masterScale}
        setMasterScale={(newScale: ScaleType) => setMasterScale(newScale)}
        metronomeActive={metronomeActive}
        setMetronomeActive={(active: boolean) => setMetronomeActive(active)}
        masterVolume={masterVolume}
        setMasterVolume={(vol: number) => setMasterVolume(vol)}
        onAddTrack={(file?: File) => {
          if (file) handleAddTrack(file);
          else handleAddEmptyTrack();
        }}
        onLoadPresets={async () => {
          const ctx = getAudioContext();
          const demoTracks = await createPresetVocalTracks(ctx, 8);
          setTracks(demoTracks);
          if (demoTracks.length > 0) setSelectedTrackId(demoTracks[0].id);
          pushHistory('8 pistas demo recargadas', demoTracks);
          showNotification('¡8 pistas de demostración cargadas (Principal, Armonías, Doblaje, Coros)!');
        }}
        onExportMixdown={handleExportMixdown}
        onExportStemsZip={() => handleExportStemsZip()}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        onApplyVocalStyle={handleApplyVocalStyle}
        trackCount={tracks.length}
      />

      {/* Transport Bar (Play/Pause, Seek, Timecode, Record, Undo/Redo) */}
      <TransportBar
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        currentTime={currentTime}
        duration={projectDuration}
        onSeek={handleSeek}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onRecordTake={handleRecordTake}
        bpm={masterBpm}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Sticky Upper Studio Navigation Tabs with Import/Export, Waveform Editor, and Undo/Redo */}
      <StudioNavigationTabs
        viewMode={viewMode}
        onSelectViewMode={(mode) => setViewMode(mode)}
        activeModuleTab={activeModuleTab}
        onSelectModuleTab={(tab) => setActiveModuleTab(tab)}
        tracks={tracks}
        selectedTrackId={selectedTrack?.id || null}
        onSelectTrack={(id) => setSelectedTrackId(id)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Studio Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================= */}
        {/* 1. VIEW MODE: CENTRO DE IMPORTACIÓN / EXPORTACIÓN         */}
        {/* ========================================================= */}
        {viewMode === 'import_export' && (
          <div className="space-y-6">
            <AudioImportExportCenter
              tracks={tracks}
              onAddTrackFile={handleAddTrack}
              onBatchAddFiles={handleBatchAddFiles}
              onSelectTrack={(id) => setSelectedTrackId(id)}
              selectedTrackId={selectedTrack?.id || null}
              onExportMixdown={handleExportMixdown}
              onExportStemsZip={() => handleExportStemsZip()}
              onExportSingleTrack={handleExportTrackWav}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onApplyUnisonTuning={handleApplyUnisonTuningMode}
              onAlignToGuide={handleAlignToGuideTrack}
              onNormalizeAllTracks={handleNormalizeAllTracks}
              masterBpm={masterBpm}
              masterKey={masterKey}
              masterScale={masterScale}
              maxTracks={MAX_TRACKS}
            />

            {/* Quick jump to editor */}
            {selectedTrack && selectedTrack.audioBuffer && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode('audio_editor')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-black shadow-md transition-all"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Abrir Editor de Onda para "{selectedTrack.name}" →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. VIEW MODE: EDITOR DE ONDA (Recorte, Fades, Undo/Redo)  */}
        {/* ========================================================= */}
        {viewMode === 'audio_editor' && (
          <div className="space-y-6">
            <AudioWaveformEditor
              track={selectedTrack}
              onUpdateTrackAudio={handleUpdateTrackAudio}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              lastActionDescription={lastActionDescription}
              currentTime={currentTime}
              onSeek={handleSeek}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              audioContext={getAudioContext()}
            />

            {/* Piano Roll directly below for immediate pitch blob feedback */}
            <MelodynePianoRoll
              track={selectedTrack}
              allTracks={tracks}
              currentTime={currentTime}
              duration={projectDuration}
              bpm={masterBpm}
              onSeek={handleSeek}
              onUpdateTrackNotes={handleUpdateTrackNotes}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. VIEW MODE: AFINACIÓN & AUTO-TUNE                       */}
        {/* ========================================================= */}
        {viewMode === 'tuning' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-bold text-white">
                  Módulo de Afinación & Auto-Tune · <strong className="text-cyan-300">{selectedTrack?.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('audio_editor')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <Scissors className="h-3.5 w-3.5 text-rose-400" />
                  <span>Editor de Onda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('import_export')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Importar Audios</span>
                </button>
              </div>
            </div>

            <AutoTunePanel
              track={selectedTrack}
              onUpdateTrack={(updates) => {
                if (selectedTrack) handleUpdateTrack(selectedTrack.id, updates);
              }}
              masterBpm={masterBpm}
            />

            <MelodynePianoRoll
              track={selectedTrack}
              allTracks={tracks}
              currentTime={currentTime}
              duration={projectDuration}
              bpm={masterBpm}
              onSeek={handleSeek}
              onUpdateTrackNotes={handleUpdateTrackNotes}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. VIEW MODE: EQ 5 BANDAS & COMPRESOR                     */}
        {/* ========================================================= */}
        {viewMode === 'eq' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-900/50 bg-purple-950/20 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-bold text-white">
                  Módulo de EQ Paramétrico (5 Bandas) & Compresor Dinámico · <strong className="text-purple-300">{selectedTrack?.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('audio_editor')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <Scissors className="h-3.5 w-3.5 text-rose-400" />
                  <span>Editor de Onda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('import_export')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Importar / Exportar</span>
                </button>
              </div>
            </div>

            <ParametricEqPanel
              track={selectedTrack}
              onUpdateTrack={(updates) => {
                if (selectedTrack) handleUpdateTrack(selectedTrack.id, updates);
              }}
            />

            <MelodynePianoRoll
              track={selectedTrack}
              allTracks={tracks}
              currentTime={currentTime}
              duration={projectDuration}
              bpm={masterBpm}
              onSeek={handleSeek}
              onUpdateTrackNotes={handleUpdateTrackNotes}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. VIEW MODE: MELODYNE PIANO ROLL                         */}
        {/* ========================================================= */}
        {viewMode === 'pianoroll' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  Melodyne Piano Roll · Edición Gráfica de Notas y Pitch Blobs · <strong className="text-emerald-300">{selectedTrack?.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('audio_editor')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <Scissors className="h-3.5 w-3.5 text-rose-400" />
                  <span>Editor de Onda</span>
                </button>
              </div>
            </div>

            <MelodynePianoRoll
              track={selectedTrack}
              allTracks={tracks}
              currentTime={currentTime}
              duration={projectDuration}
              bpm={masterBpm}
              onSeek={handleSeek}
              onUpdateTrackNotes={handleUpdateTrackNotes}
            />

            <AutoTunePanel
              track={selectedTrack}
              onUpdateTrack={(updates) => {
                if (selectedTrack) handleUpdateTrack(selectedTrack.id, updates);
              }}
              masterBpm={masterBpm}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. VIEW MODE: MEZCLADOR 8 PISTAS                          */}
        {/* ========================================================= */}
        {viewMode === 'mixer' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  Mezclador Multipista (Hasta 8 Voces) & Ajustes al Unísono
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('import_export')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Importar Audios</span>
                </button>
              </div>
            </div>

            <UnisonControlsBar
              tracks={tracks}
              onSelectAllUnison={handleSelectAllUnison}
              onApplyUnisonTuningMode={handleApplyUnisonTuningMode}
              onApplyUnisonKeyScale={handleApplyUnisonKeyScale}
              onApplyUnisonQuantize={handleApplyUnisonQuantize}
              onApplyUnisonPitchShift={handleApplyUnisonPitchShift}
              onApplyUnisonFormantSpread={handleApplyUnisonFormantSpread}
              onAlignToGuideTrack={handleAlignToGuideTrack}
              onMacroCenteringPitch={handleMacroCenteringPitch}
              isUnisonModeActive={isUnisonModeActive}
              setIsUnisonModeActive={setIsUnisonModeActive}
            />

            <VocalTrackList
              tracks={tracks}
              selectedTrackId={selectedTrack?.id || null}
              onSelectTrack={(id) => setSelectedTrackId(id)}
              onUpdateTrack={handleUpdateTrack}
              onDeleteTrack={handleDeleteTrack}
              onDuplicateTrack={handleDuplicateTrack}
              onExportTrackWav={handleExportTrackWav}
              onAddEmptyTrack={handleAddEmptyTrack}
              onAddTrackFile={(file) => handleAddTrack(file)}
              onAssignAudioToTrack={handleAssignAudioToTrack}
              onAlignSingleTrackToGuide={handleAlignSingleTrackToGuide}
              onOpenEqForTrack={(id) => {
                setSelectedTrackId(id);
                setActiveModuleTab('eq');
                setViewMode('eq');
              }}
              isPlaying={isPlaying}
              maxTracks={MAX_TRACKS}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. VIEW MODE: ALL (VISTA INTEGRAL DEL ESTUDIO)            */}
        {/* ========================================================= */}
        {viewMode === 'all' && (
          <div className="space-y-6">
            {/* Audio Import and Export Center visible at top of workspace */}
            <AudioImportExportCenter
              tracks={tracks}
              onAddTrackFile={handleAddTrack}
              onBatchAddFiles={handleBatchAddFiles}
              onSelectTrack={(id) => setSelectedTrackId(id)}
              selectedTrackId={selectedTrack?.id || null}
              onExportMixdown={handleExportMixdown}
              onExportStemsZip={() => handleExportStemsZip()}
              onExportSingleTrack={handleExportTrackWav}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onApplyUnisonTuning={handleApplyUnisonTuningMode}
              onAlignToGuide={handleAlignToGuideTrack}
              onNormalizeAllTracks={handleNormalizeAllTracks}
              masterBpm={masterBpm}
              masterKey={masterKey}
              masterScale={masterScale}
              maxTracks={MAX_TRACKS}
            />

            {/* Audio Waveform Editor */}
            {selectedTrack && selectedTrack.audioBuffer && (
              <AudioWaveformEditor
                track={selectedTrack}
                onUpdateTrackAudio={handleUpdateTrackAudio}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                lastActionDescription={lastActionDescription}
                currentTime={currentTime}
                onSeek={handleSeek}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                audioContext={getAudioContext()}
              />
            )}

            {/* Collective Unison Controls Bar */}
            <UnisonControlsBar
              tracks={tracks}
              onSelectAllUnison={handleSelectAllUnison}
              onApplyUnisonTuningMode={handleApplyUnisonTuningMode}
              onApplyUnisonKeyScale={handleApplyUnisonKeyScale}
              onApplyUnisonQuantize={handleApplyUnisonQuantize}
              onApplyUnisonPitchShift={handleApplyUnisonPitchShift}
              onApplyUnisonFormantSpread={handleApplyUnisonFormantSpread}
              onAlignToGuideTrack={handleAlignToGuideTrack}
              onMacroCenteringPitch={handleMacroCenteringPitch}
              isUnisonModeActive={isUnisonModeActive}
              setIsUnisonModeActive={setIsUnisonModeActive}
            />

            {/* Multi-Track Mixer List (Up to 8 Tracks) */}
            <VocalTrackList
              tracks={tracks}
              selectedTrackId={selectedTrack?.id || null}
              onSelectTrack={(id) => setSelectedTrackId(id)}
              onUpdateTrack={handleUpdateTrack}
              onDeleteTrack={handleDeleteTrack}
              onDuplicateTrack={handleDuplicateTrack}
              onExportTrackWav={handleExportTrackWav}
              onAddEmptyTrack={handleAddEmptyTrack}
              onAddTrackFile={(file) => handleAddTrack(file)}
              onAssignAudioToTrack={handleAssignAudioToTrack}
              onAlignSingleTrackToGuide={handleAlignSingleTrackToGuide}
              onOpenEqForTrack={(id) => {
                setSelectedTrackId(id);
                setActiveModuleTab('eq');
                setViewMode('eq');
              }}
              isPlaying={isPlaying}
              maxTracks={MAX_TRACKS}
            />

            {/* Melodyne Piano Roll Visualizer */}
            <MelodynePianoRoll
              track={selectedTrack}
              allTracks={tracks}
              currentTime={currentTime}
              duration={projectDuration}
              bpm={masterBpm}
              onSeek={handleSeek}
              onUpdateTrackNotes={handleUpdateTrackNotes}
            />

            {/* Module Switcher Tabs: Tuning vs Parametric EQ & Compressor */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModuleTab('tuning')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    activeModuleTab === 'tuning'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Afinación & Tiempo (Melodyne / Auto-Tune)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModuleTab('eq')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    activeModuleTab === 'eq'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span>EQ Paramétrico & Compresor Dinámico</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModuleTab('both')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    activeModuleTab === 'both'
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Ver Ambos Módulos</span>
                </button>
              </div>

              {selectedTrack && (
                <span className="text-xs font-mono text-zinc-400">
                  Canal Activo: <strong className="text-white">{selectedTrack.name}</strong>
                </span>
              )}
            </div>

            {/* Individual Track Auto-Tune, Melodyne & Time BPM Manipulation Panel */}
            {(activeModuleTab === 'tuning' || activeModuleTab === 'both') && (
              <AutoTunePanel
                track={selectedTrack}
                onUpdateTrack={(updates) => {
                  if (selectedTrack) {
                    handleUpdateTrack(selectedTrack.id, updates);
                  }
                }}
                masterBpm={masterBpm}
              />
            )}

            {/* 5-Band Visual Parametric EQ & Dynamics Compressor Panel */}
            {(activeModuleTab === 'eq' || activeModuleTab === 'both') && (
              <ParametricEqPanel
                track={selectedTrack}
                onUpdateTrack={(updates) => {
                  if (selectedTrack) {
                    handleUpdateTrack(selectedTrack.id, updates);
                  }
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-500 font-mono">
        <p>
          VocalForge Studio · DAW de 8 Pistas para Canto y Doblaje con importación/exportación multiformato (WAV, MP3, FLAC, AIFF, OGG), editor de onda con Deshacer (Undo) y Rehacer (Redo), afinación Melodyne/Auto-Tune, EQ de 5 bandas y compresión dinámica.
        </p>
      </footer>

      {/* AI Vocal Advisor Modal */}
      <AiVocalAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        tracks={tracks}
        onApplyRecommendation={(scale, key, bpm, retuneSpeed) => {
          setMasterKey(key as MusicalKey);
          setMasterScale(scale as ScaleType);
          setMasterBpm(bpm);
          const updated = tracks.map((t) => ({
            ...t,
            musicalKey: key as MusicalKey,
            scaleType: scale as ScaleType,
            targetBpm: bpm,
            retuneSpeedMs: retuneSpeed,
          }));
          setTracks(updated);
          pushHistory(`Recomendaciones IA: ${key} ${scale} a ${bpm} BPM`, updated);
          showNotification(`Ajustes recomendados aplicados a las 8 pistas: ${key} ${scale} a ${bpm} BPM`);
        }}
      />

      {/* Export Audio & Stems ZIP Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tracks={tracks}
        masterBpm={masterBpm}
        masterKey={masterKey}
        masterScale={masterScale}
        onExportMixdown={async () => {
          await handleExportMixdown();
          setIsExportModalOpen(false);
        }}
        onExportStemsZip={handleExportStemsZip}
        isExporting={isExporting}
        exportProgressText={exportProgressText}
        exportProgressPercent={exportProgressPercent}
      />
    </div>
  );
}
