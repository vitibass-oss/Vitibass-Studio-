import React, { useRef, useEffect, useState } from 'react';
import {
  Sliders,
  Activity,
  Power,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  Gauge,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { VocalTrack, TrackEq, EqBand, TrackCompressor } from '../../types/audio';
import {
  createDefaultTrackEq,
  createDefaultTrackCompressor,
  freqToX,
  xToFreq,
  gainToY,
  yToGain,
  calculateEqResponseCurve,
  VOCAL_EQ_PRESETS,
  VOCAL_COMPRESSOR_PRESETS,
  EqPreset,
  CompressorPreset,
} from '../../utils/eqCalculations';

interface ParametricEqPanelProps {
  track: VocalTrack | null;
  onUpdateTrack: (updates: Partial<VocalTrack>) => void;
  initialTab?: 'eq' | 'compressor' | 'both';
}

const BAND_COLORS = [
  '#06b6d4', // Band 1: Cyan (Highpass)
  '#10b981', // Band 2: Emerald (Low/Body)
  '#f59e0b', // Band 3: Amber (Mid/Claridad)
  '#ec4899', // Band 4: Pink (Presence)
  '#8b5cf6', // Band 5: Purple (Air/High Shelf)
];

const FREQ_GRID_LINES = [
  { f: 50, label: '50Hz' },
  { f: 100, label: '100Hz' },
  { f: 200, label: '200Hz' },
  { f: 500, label: '500Hz' },
  { f: 1000, label: '1kHz' },
  { f: 2000, label: '2kHz' },
  { f: 5000, label: '5kHz' },
  { f: 10000, label: '10kHz' },
  { f: 20000, label: '20kHz' },
];

const GAIN_GRID_LINES = [
  { db: 18, label: '+18' },
  { db: 12, label: '+12' },
  { db: 6, label: '+6' },
  { db: 0, label: '0 dB' },
  { db: -6, label: '-6' },
  { db: -12, label: '-12' },
  { db: -18, label: '-18' },
];

export const ParametricEqPanel: React.FC<ParametricEqPanelProps> = ({
  track,
  onUpdateTrack,
  initialTab = 'both',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBandId, setSelectedBandId] = useState<number>(3);
  const [isDraggingNode, setIsDraggingNode] = useState<number | null>(null);
  const [panelSectionTab, setPanelSectionTab] = useState<'eq' | 'compressor' | 'both'>(initialTab);

  // Ensure track has valid EQ and Compressor objects (safe fallback if null)
  const currentEq: TrackEq = track?.eq || createDefaultTrackEq();
  const currentComp: TrackCompressor = track?.compressor || createDefaultTrackCompressor();

  const handleUpdateEq = (newEq: TrackEq) => {
    onUpdateTrack({ eq: newEq });
  };

  const handleUpdateCompressor = (newComp: TrackCompressor) => {
    onUpdateTrack({ compressor: newComp });
  };

  const handleToggleEqMaster = () => {
    handleUpdateEq({
      ...currentEq,
      enabled: !currentEq.enabled,
    });
  };

  const handleToggleCompMaster = () => {
    handleUpdateCompressor({
      ...currentComp,
      enabled: !currentComp.enabled,
    });
  };

  const handleUpdateBand = (bandId: number, updates: Partial<EqBand>) => {
    const newBands = currentEq.bands.map((b) => (b.id === bandId ? { ...b, ...updates } : b));
    handleUpdateEq({
      ...currentEq,
      bands: newBands,
    });
  };

  const handleApplyPreset = (preset: EqPreset) => {
    const updatedBands = currentEq.bands.map((b) => {
      const match = preset.bands.find((p) => p.id === b.id);
      return match ? { ...b, ...match } : b;
    });
    handleUpdateEq({
      ...currentEq,
      enabled: true,
      bands: updatedBands,
    });
  };

  const handleApplyCompPreset = (preset: CompressorPreset) => {
    handleUpdateCompressor({
      ...currentComp,
      ...preset.settings,
      enabled: true,
    });
  };

  // Draw EQ Curve on Canvas
  useEffect(() => {
    if (!track || panelSectionTab === 'compressor') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines & Decibel labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical Frequency lines
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';

    FREQ_GRID_LINES.forEach(({ f, label }) => {
      const x = freqToX(f, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillText(label, x, height - 6);
    });

    // Horizontal dB lines
    GAIN_GRID_LINES.forEach(({ db, label }) => {
      const y = gainToY(db, height, 18);
      ctx.beginPath();
      if (db === 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)'; // 0dB Cyan guide
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
      }
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = db === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(255, 255, 255, 0.25)';
      ctx.textAlign = 'left';
      ctx.fillText(label, 6, y - 2);
    });

    // 2. If EQ is disabled, draw flat faint line
    if (!currentEq.enabled) {
      const zeroY = gainToY(0, height, 18);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // 3. Compute and draw Composite Frequency Response Curve
    const curvePoints = calculateEqResponseCurve(currentEq.bands, 240);
    const zeroY = gainToY(0, height, 18);

    // Gradient fill under the curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, zeroY);

    curvePoints.forEach((pt, i) => {
      const x = freqToX(pt.freq, width);
      const y = gainToY(pt.db, height, 18);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo(width, zeroY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke the composite curve line
    ctx.beginPath();
    curvePoints.forEach((pt, i) => {
      const x = freqToX(pt.freq, width);
      const y = gainToY(pt.db, height, 18);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#22d3ee'; // bright cyan
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Draw interactive node handles for each of the 5 bands
    currentEq.bands.forEach((band, idx) => {
      if (!band.enabled) return;
      const x = freqToX(band.frequency, width);
      const y = gainToY(band.type === 'highpass' ? 0 : band.gain, height, 18);
      const isSelected = band.id === selectedBandId;
      const color = BAND_COLORS[idx % BAND_COLORS.length];

      ctx.save();

      // Outer glow if selected
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      // Handle circle
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Band number label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(`${band.id}`, x, y - (isSelected ? 18 : 15));

      ctx.restore();
    });
  }, [currentEq, selectedBandId, panelSectionTab]);

  // Draw Compressor Transfer Characteristic Curve
  useEffect(() => {
    if (!track || panelSectionTab === 'eq') return;
    const canvas = compCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Range: -60 dB to 0 dB on both input (X) and output (Y)
    const minDb = -60;
    const maxDb = 0;
    const dbToX = (db: number) => ((db - minDb) / (maxDb - minDb)) * width;
    const dbToY = (db: number) => height - ((db - minDb) / (maxDb - minDb)) * height;

    // Draw background grid lines every 12 dB
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';

    for (let db = minDb; db <= maxDb; db += 12) {
      const x = dbToX(db);
      const y = dbToY(db);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      if (db !== minDb) ctx.fillText(`${db}dB`, x, height - 4);

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1:1 Uncompressed Reference Line (dotted)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dbToX(minDb), dbToY(minDb));
    ctx.lineTo(dbToX(maxDb), dbToY(maxDb));
    ctx.stroke();
    ctx.setLineDash([]);

    if (!currentComp.enabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COMPRESOR EN BYPASS (1:1 LINEAL)', width / 2, height / 2);
      return;
    }

    // Threshold point
    const threshX = dbToX(currentComp.threshold);
    const threshY = dbToY(currentComp.threshold);

    // Draw vertical threshold marker line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; // Amber
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(threshX, 0);
    ctx.lineTo(threshX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Compute Transfer Function with Knee
    const points: { x: number; y: number }[] = [];
    const numPoints = 120;
    const makeup = currentComp.makeupGain || 0;

    for (let i = 0; i <= numPoints; i++) {
      const inputDb = minDb + (i / numPoints) * (maxDb - minDb);
      let outputDb = inputDb;

      const knee = Math.max(0, currentComp.knee);
      const halfKnee = knee / 2;

      if (knee > 0 && inputDb > currentComp.threshold - halfKnee && inputDb < currentComp.threshold + halfKnee) {
        // Soft knee quadratic interpolation
        const delta = inputDb - currentComp.threshold + halfKnee;
        outputDb = inputDb + ((1 / currentComp.ratio - 1) * Math.pow(delta, 2)) / (2 * knee);
      } else if (inputDb >= currentComp.threshold) {
        outputDb = currentComp.threshold + (inputDb - currentComp.threshold) / currentComp.ratio;
      }

      // Add makeup gain
      outputDb = Math.min(6, outputDb + makeup);

      points.push({ x: dbToX(inputDb), y: dbToY(outputDb) });
    }

    // Draw compressed curve
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#f59e0b'; // Amber curve
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Threshold Marker Node
    ctx.beginPath();
    ctx.arc(threshX, threshY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Umbral: ${currentComp.threshold} dB`, threshX - 10, threshY - 10);
    ctx.fillText(`Ratio: ${currentComp.ratio.toFixed(1)}:1`, threshX - 10, threshY + 6);
  }, [currentComp, panelSectionTab]);

  // Mouse interaction on canvas: dragging EQ nodes
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentEq.enabled) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    for (const band of currentEq.bands) {
      if (!band.enabled) continue;
      const nx = freqToX(band.frequency, canvas.width);
      const ny = gainToY(band.type === 'highpass' ? 0 : band.gain, canvas.height, 18);
      const dist = Math.hypot(clickX - nx, clickY - ny);

      if (dist <= 22) {
        setSelectedBandId(band.id);
        setIsDraggingNode(band.id);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingNode || !canvasRef.current || !currentEq.enabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const newFreq = Math.round(xToFreq(x, canvas.width));
    const newGain = Math.round(yToGain(y, canvas.height, 18) * 10) / 10;

    const band = currentEq.bands.find((b) => b.id === isDraggingNode);
    if (!band) return;

    if (band.type === 'highpass') {
      handleUpdateBand(isDraggingNode, {
        frequency: Math.max(20, Math.min(600, newFreq)),
      });
    } else {
      handleUpdateBand(isDraggingNode, {
        frequency: Math.max(20, Math.min(20000, newFreq)),
        gain: newGain,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNode(null);
  };

  // Adjust Q with mouse wheel over node or canvas
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!selectedBandId || !currentEq.enabled) return;
    const band = currentEq.bands.find((b) => b.id === selectedBandId);
    if (!band) return;

    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    const newQ = Math.max(0.2, Math.min(10, Math.round((band.q + delta) * 10) / 10));
    handleUpdateBand(selectedBandId, { q: newQ });
  };

  const selectedBand = currentEq.bands.find((b) => b.id === selectedBandId) || currentEq.bands[2];

  // Estimated gain reduction calculation for visual VU meter
  const simulatedPeakInput = -12; // Typical vocal dialogue level in dBFS
  const overThreshold = Math.max(0, simulatedPeakInput - currentComp.threshold);
  const estimatedGainReduction = currentComp.enabled
    ? Math.min(18, overThreshold * (1 - 1 / currentComp.ratio))
    : 0;

  if (!track) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-500">
        Selecciona una pista vocal en la lista para acceder a la ecualización paramétrica de 5 bandas y compresión dinámica.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Top Main Navigation Bar for the Channel Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-lg"
            style={{ backgroundColor: `${track.color}25`, color: track.color, border: `1px solid ${track.color}60` }}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                EQ Paramétrico & Compresor Dinámico
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
                style={{ backgroundColor: `${track.color}20`, color: track.color }}
              >
                {track.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Cadena de procesado vocal: <strong className="text-amber-400">1º Compresión Dinámica (Pre-EQ)</strong> <ArrowRight className="inline h-3 w-3 mx-1 text-zinc-500" /> <strong className="text-cyan-400">2º Ecualizador 5 Bandas</strong>
            </p>
          </div>
        </div>

        {/* Sub-Tabs: EQ, Compressor, or Both */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1">
          <button
            type="button"
            onClick={() => setPanelSectionTab('both')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              panelSectionTab === 'both'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Cadena Completa</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelSectionTab('compressor')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              panelSectionTab === 'compressor'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gauge className="h-3.5 w-3.5 text-amber-400" />
            <span>Compresor (Pre-EQ)</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelSectionTab('eq')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              panelSectionTab === 'eq'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>EQ 5 Bandas</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: DYNAMIC COMPRESSION MODULE (PRE-EQ)            */}
      {/* ======================================================== */}
      {(panelSectionTab === 'compressor' || panelSectionTab === 'both') && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 sm:p-5 space-y-4 shadow-lg">
          {/* Compressor Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Módulo de Compresión Dinámica Vocal</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                    PRE-EQ
                  </span>
                </span>
                <p className="text-[11px] text-zinc-400">
                  Controla la energía y dinámica de la voz (picos, transitorios, susurros) antes de ecualizar.
                </p>
              </div>
            </div>

            {/* Compressor Controls Right */}
            <div className="flex items-center gap-3">
              {/* Presets Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-zinc-400 font-mono">Preset:</span>
                <select
                  onChange={(e) => {
                    const preset = VOCAL_COMPRESSOR_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) handleApplyCompPreset(preset);
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-amber-400"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar preset...</option>
                  {VOCAL_COMPRESSOR_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Master Compressor Bypass Toggle */}
              <button
                type="button"
                onClick={handleToggleCompMaster}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  currentComp.enabled
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{currentComp.enabled ? 'COMP ACTIVO' : 'BYPASS'}</span>
              </button>
            </div>
          </div>

          {/* Compressor Main Grid: Visual Curve & Meter + Knobs/Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Visual Transfer Characteristic Curve */}
            <div className="lg:col-span-4 space-y-2">
              <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 overflow-hidden shadow-inner">
                <canvas
                  ref={compCanvasRef}
                  width={340}
                  height={190}
                  className="w-full h-auto block rounded"
                />
              </div>

              {/* Gain Reduction Meter Bar */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">Reducción de Ganancia (GR):</span>
                  <span className="font-bold text-amber-400">
                    {currentComp.enabled ? `-${estimatedGainReduction.toFixed(1)} dB` : '0.0 dB'}
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-zinc-800 overflow-hidden flex justify-end">
                  <div
                    className="h-full bg-gradient-to-l from-amber-400 to-red-500 transition-all duration-150"
                    style={{
                      width: `${Math.min(100, (estimatedGainReduction / 18) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 6 Compressor Parameters (Threshold, Ratio, Attack, Release, Knee, Makeup) */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* 1. Threshold */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Umbral (Threshold)</span>
                  <span className="font-bold text-amber-400">{currentComp.threshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  step="0.5"
                  value={currentComp.threshold}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, threshold: Number(e.target.value) })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Nivel de disparo de compresión</span>
              </div>

              {/* 2. Ratio */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Relación (Ratio)</span>
                  <span className="font-bold text-amber-400">{currentComp.ratio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={currentComp.ratio}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, ratio: Number(e.target.value) })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Intensidad de compresión</span>
              </div>

              {/* 3. Attack */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Ataque (Attack)</span>
                  <span className="font-bold text-cyan-400">
                    {Math.round(currentComp.attack * 1000)} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={Math.round(currentComp.attack * 1000)}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, attack: Number(e.target.value) / 1000 })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Tiempo de reacción a transitorios</span>
              </div>

              {/* 4. Release */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Relajación (Release)</span>
                  <span className="font-bold text-cyan-400">
                    {Math.round(currentComp.release * 1000)} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={Math.round(currentComp.release * 1000)}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, release: Number(e.target.value) / 1000 })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Recuperación del nivel natural</span>
              </div>

              {/* 5. Knee */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Codo (Knee)</span>
                  <span className="font-bold text-purple-400">{currentComp.knee} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={currentComp.knee}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, knee: Number(e.target.value) })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-purple-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">0dB duro · &gt;6dB suave/orgánico</span>
              </div>

              {/* 6. Makeup Gain */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">Ganancia (Makeup)</span>
                  <span className="font-bold text-emerald-400">+{currentComp.makeupGain || 0} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.5"
                  value={currentComp.makeupGain || 0}
                  onChange={(e) => handleUpdateCompressor({ ...currentComp, makeupGain: Number(e.target.value) })}
                  className="w-full h-1.5 rounded bg-zinc-800 accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Compensa la pérdida de volumen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: 5-BAND PARAMETRIC EQUALIZER MODULE             */}
      {/* ======================================================== */}
      {(panelSectionTab === 'eq' || panelSectionTab === 'both') && (
        <div className="space-y-4">
          {/* EQ Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Ecualizador Paramétrico de 5 Bandas</span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                    POST-COMPRESIÓN
                  </span>
                </span>
                <p className="text-[11px] text-zinc-400">
                  Ajusta visualmente la curva espectral arrastrando los puntos del gráfico o con los potenciómetros.
                </p>
              </div>
            </div>

            {/* EQ Presets & Master Toggle */}
            <div className="flex items-center gap-3">
              {/* Presets Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-zinc-400 font-mono">Preset:</span>
                <select
                  onChange={(e) => {
                    const preset = VOCAL_EQ_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) handleApplyPreset(preset);
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyan-400"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar preset...</option>
                  {VOCAL_EQ_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Master EQ Power Toggle */}
              <button
                type="button"
                onClick={handleToggleEqMaster}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  currentEq.enabled
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{currentEq.enabled ? 'EQ ACTIVO' : 'BYPASS'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Visual EQ Canvas */}
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={900}
              height={260}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`w-full h-auto block rounded-xl ${
                currentEq.enabled ? 'cursor-crosshair' : 'cursor-not-allowed opacity-50'
              }`}
            />

            {/* Instruction tooltip overlay */}
            <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800/80">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>Arrastra los nodos para Freq y Ganancia · Rueda del ratón para Factor Q</span>
            </div>
          </div>

          {/* 5-Band Channel Strips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>Control Paramétrico de las 5 Bandas</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Banda seleccionada: <strong className="text-cyan-300">{selectedBand.name}</strong>
              </span>
            </div>

            {/* 5 Band Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {currentEq.bands.map((band, idx) => {
                const isSelected = band.id === selectedBandId;
                const color = BAND_COLORS[idx % BAND_COLORS.length];

                return (
                  <div
                    key={band.id}
                    onClick={() => setSelectedBandId(band.id)}
                    className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all space-y-2.5 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-md ring-1 ring-cyan-500/40'
                        : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    {/* Band Top Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black"
                          style={{ backgroundColor: color }}
                        >
                          {band.id}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[80px]">
                          {band.id === 1 ? 'Low Cut' : band.id === 5 ? 'Air' : `Banda ${band.id}`}
                        </span>
                      </div>

                      {/* Band Enable toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateBand(band.id, { enabled: !band.enabled });
                        }}
                        className={`h-4 w-4 rounded-full border transition-all ${
                          band.enabled ? 'bg-cyan-500 border-cyan-400' : 'bg-zinc-800 border-zinc-700'
                        }`}
                        title={band.enabled ? 'Desactivar esta banda' : 'Activar esta banda'}
                      />
                    </div>

                    {/* Filter Type */}
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-mono block">Tipo</label>
                      <select
                        value={band.type}
                        onChange={(e) => handleUpdateBand(band.id, { type: e.target.value as any })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="highpass">Highpass (Corte)</option>
                        <option value="peaking">Campana (Bell)</option>
                        <option value="lowshelf">Low Shelf</option>
                        <option value="highshelf">High Shelf</option>
                      </select>
                    </div>

                    {/* Frequency Control */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Freq</span>
                        <span className="font-bold text-white">
                          {band.frequency >= 1000 ? `${(band.frequency / 1000).toFixed(1)}k` : `${band.frequency}`} Hz
                        </span>
                      </div>
                      <input
                        type="range"
                        min={band.id === 1 ? 20 : 60}
                        max={band.id === 5 ? 20000 : 16000}
                        step={10}
                        value={band.frequency}
                        onChange={(e) => handleUpdateBand(band.id, { frequency: Number(e.target.value) })}
                        className="w-full h-1.5 rounded bg-zinc-800 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Gain Control */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Ganancia</span>
                        <span className="font-bold text-amber-300">
                          {band.type === 'highpass' ? 'Corte' : `${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)} dB`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-18"
                        max="18"
                        step="0.5"
                        disabled={band.type === 'highpass'}
                        value={band.gain}
                        onChange={(e) => handleUpdateBand(band.id, { gain: Number(e.target.value) })}
                        className="w-full h-1.5 rounded bg-zinc-800 accent-amber-400 cursor-pointer disabled:opacity-30"
                      />
                    </div>

                    {/* Q Factor */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Factor Q</span>
                        <span className="font-bold text-cyan-300">{band.q.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="10"
                        step="0.1"
                        value={band.q}
                        onChange={(e) => handleUpdateBand(band.id, { q: Number(e.target.value) })}
                        className="w-full h-1.5 rounded bg-zinc-800 accent-purple-400 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
