import React, { useRef, useState } from 'react';
import {
  Mic,
  Plus,
  Download,
  Sparkles,
  Music,
  Clock,
  Layers,
  Wand2,
  FolderArchive,
  ChevronDown,
} from 'lucide-react';
import { MusicalKey, ScaleType, VocalStylePreset } from '../../types/audio';
import { NOTE_NAMES } from '../../utils/audioDsp';

interface AudioStudioHeaderProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  masterKey: MusicalKey;
  setMasterKey: (key: MusicalKey) => void;
  masterScale: ScaleType;
  setMasterScale: (scale: ScaleType) => void;
  metronomeActive: boolean;
  setMetronomeActive: (active: boolean) => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  onAddTrack: (file?: File) => void;
  onLoadPresets: () => void;
  onExportMixdown: () => void;
  onExportStemsZip: () => void;
  onOpenExportModal: () => void;
  onOpenAiAdvisor: () => void;
  onApplyVocalStyle?: (style: VocalStylePreset) => void;
  trackCount: number;
}

const SCALE_LABELS: Record<ScaleType, string> = {
  chromatic: 'Cromática (Cualquier tono)',
  major: 'Mayor (Natural / Brillante)',
  minor: 'Menor (Melancólica / Épica)',
  dorian: 'Dórica (Vocal Jazz / R&B)',
  pentatonic_major: 'Pentatónica Mayor',
  pentatonic_minor: 'Pentatónica Menor (Blues / Rock)',
};

export const AudioStudioHeader: React.FC<AudioStudioHeaderProps> = ({
  bpm,
  setBpm,
  masterKey,
  setMasterKey,
  masterScale,
  setMasterScale,
  metronomeActive,
  setMetronomeActive,
  masterVolume,
  setMasterVolume,
  onAddTrack,
  onLoadPresets,
  onExportMixdown,
  onExportStemsZip,
  onOpenExportModal,
  onOpenAiAdvisor,
  onApplyVocalStyle,
  trackCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Tap Tempo state
  const tapTimesRef = useRef<number[]>([]);
  const [tapActive, setTapActive] = useState(false);

  const handleTapTempo = () => {
    const now = performance.now();
    setTapActive(true);
    setTimeout(() => setTapActive(false), 200);

    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 4) {
      taps.shift();
    }

    if (taps.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < taps.length; i++) {
        totalDiff += taps[i] - taps[i - 1];
      }
      const avgInterval = totalDiff / (taps.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onAddTrack(files[i]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Mic className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                VocalForge Studio
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider rounded bg-cyan-950 px-1.5 py-0.5 text-cyan-400 border border-cyan-800/50 font-bold">
                8 PISTAS
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 md:block">
              Corrección de afinación (Melodyne & Auto-Tune) y tiempo musical (BPM) para voces y doblaje
            </p>
          </div>
        </div>

        {/* Global Musical Controls: Key, Scale & BPM */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1.5 text-xs">
          {/* Key selector */}
          <div className="flex items-center gap-1.5 pl-2 text-zinc-400">
            <Music className="h-3.5 w-3.5 text-cyan-400" />
            <select
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value as MusicalKey)}
              className="rounded bg-zinc-950 px-2 py-1 font-bold text-cyan-300 border border-zinc-800 focus:outline-none focus:border-cyan-500 text-xs"
              title="Tonalidad Raíz (C, C#, D...)"
            >
              {NOTE_NAMES.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            {/* Scale type */}
            <select
              value={masterScale}
              onChange={(e) => setMasterScale(e.target.value as ScaleType)}
              className="rounded bg-zinc-950 px-2 py-1 text-zinc-200 border border-zinc-800 focus:outline-none focus:border-cyan-500 text-xs"
              title="Escala musical para cuantización de afinación"
            >
              {Object.entries(SCALE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Master BPM & Tap Tempo */}
          <div className="flex items-center gap-1.5 px-2 text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono text-[11px] text-zinc-400">BPM:</span>
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 120)))}
              className="w-14 rounded bg-zinc-950 px-1.5 py-1 font-mono font-bold text-amber-300 border border-zinc-800 text-center focus:outline-none focus:border-amber-500"
            />
            {/* Tap Tempo Button */}
            <button
              type="button"
              onClick={handleTapTempo}
              className={`px-2 py-1 rounded font-mono text-[10px] font-bold border transition-all ${
                tapActive
                  ? 'bg-amber-400 text-black border-amber-300 scale-105'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-amber-400 border-zinc-700'
              }`}
              title="Haz clic a ritmo para calcular el tempo (BPM) de la pista de voz"
            >
              TAP
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Metronome button */}
          <button
            type="button"
            onClick={() => setMetronomeActive(!metronomeActive)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              metronomeActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Activar / Desactivar metrónomo"
          >
            <span>Metrónomo</span>
            {metronomeActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Vocal Style Presets Quick Select */}
          {onApplyVocalStyle && (
            <div className="hidden xl:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
              <Wand2 className="h-3.5 w-3.5 text-purple-400 ml-1.5" />
              <select
                onChange={(e) => onApplyVocalStyle(e.target.value as VocalStylePreset)}
                defaultValue=""
                className="bg-transparent text-zinc-300 hover:text-white px-2 py-0.5 focus:outline-none font-medium cursor-pointer"
                title="Aplica una plantilla de afinación y producción vocal al proyecto"
              >
                <option value="" disabled>Estilo Vocal...</option>
                <option value="pop_studio">Vocal Pop Studio (Melodyne 25ms)</option>
                <option value="autotune_trap">Auto-Tune Urbano (0ms Duro)</option>
                <option value="dubbing_pro">Doblaje Cine & Series (Formantes + Sincro)</option>
                <option value="choir_wall">Coro 8 Voces (Wall of Sound)</option>
                <option value="podcast_voice">Locución Limpia (Sin afinación forzada)</option>
              </select>
            </div>
          )}

          {/* AI Advisor Button */}
          <button
            type="button"
            onClick={onOpenAiAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 rounded-lg shadow-sm transition-all"
            title="Asesor Inteligente Gemini para Afinación y Sincronía"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Asesor IA Gemini</span>
          </button>

          {/* Load Presets */}
          <button
            type="button"
            onClick={onLoadPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            title="Cargar 8 pistas vocales de demostración (Principal, Armonías, Doblaje, Coros)"
          >
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">8 Pistas Demo</span>
          </button>

          {/* Upload Track File */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={trackCount >= 8}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg transition-all"
            title={trackCount >= 8 ? 'Límite máximo de 8 pistas alcanzado' : 'Subir hasta 8 pistas de audio'}
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Subir Audio ({trackCount}/8)</span>
          </button>

          {/* Export Menu Dropdown Group */}
          <div className="relative">
            <div className="flex items-center rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 shadow-md">
              {/* Primary Action: Open Full Export Dialog */}
              <button
                type="button"
                onClick={onOpenExportModal}
                disabled={trackCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Abrir menú de exportación de stems en ZIP o mezcla WAV"
              >
                <FolderArchive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar Stems ZIP / WAV</span>
                <span className="sm:hidden">Exportar</span>
              </button>

              {/* Dropdown Toggle Caret */}
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={trackCount === 0}
                className="border-l border-cyan-500/50 px-1.5 py-1.5 text-white hover:bg-cyan-500/20 rounded-r-lg disabled:opacity-50"
                title="Opciones rápidas de exportación"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Export Dropdown Menu */}
            {isExportMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl z-50 text-xs space-y-1 backdrop-blur-xl animate-fade-in"
                onClick={() => setIsExportMenuOpen(false)}
              >
                {/* 1. Stems ZIP option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportStemsZip();
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-cyan-950/60 text-cyan-200 transition-colors"
                >
                  <FolderArchive className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Stems Individuales (.ZIP)</span>
                    <span className="text-[10px] text-zinc-400">
                      Pistas procesadas por separado con el mismo BPM y afinación para DAWs
                    </span>
                  </div>
                </button>

                {/* 2. Full Mixdown WAV option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportMixdown();
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-zinc-850 text-zinc-300 transition-colors"
                >
                  <Download className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Mezcla Maestra (.WAV)</span>
                    <span className="text-[10px] text-zinc-400">
                      Audio consolidado de las 8 pistas mezcladas en estéreo
                    </span>
                  </div>
                </button>

                <div className="h-px bg-zinc-800 my-1" />

                {/* 3. Open Detailed Export Config */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onOpenExportModal();
                  }}
                  className="w-full text-center py-1.5 text-[11px] text-zinc-400 hover:text-white font-medium"
                >
                  Configuración avanzada de exportación...
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
