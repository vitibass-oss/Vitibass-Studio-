import JSZip from 'jszip';
import { VocalTrack } from '../types/audio';
import { renderProcessedVocalBuffer, encodeAudioBufferToWav } from './audioDsp';

export interface StemExportOptions {
  includeSessionNotes?: boolean;
  normalizeAlignment?: boolean; // Ensure all stems have identical start 00:00 and length
}

/**
 * Renders each vocal track with its pitch & time settings and packages them into a ZIP archive
 */
export async function exportStemsZip(
  audioContext: AudioContext,
  tracks: VocalTrack[],
  masterBpm: number,
  masterKey: string,
  masterScale: string,
  onProgress?: (message: string, percent: number) => void,
  options: StemExportOptions = { includeSessionNotes: true, normalizeAlignment: true }
): Promise<Blob> {
  const zip = new JSZip();
  const activeTracks = tracks.filter((t) => t.audioBuffer !== null);

  if (activeTracks.length === 0) {
    throw new Error('No hay pistas con audio para exportar.');
  }

  // Calculate project overall duration for alignment
  const maxProjectDuration = tracks.reduce((max, t) => Math.max(max, t.duration), 6.0);

  const totalSteps = activeTracks.length + 1; // Tracks + zip packing
  let currentStep = 0;

  // Track session details for documentation
  const trackSummaries: string[] = [];

  for (let i = 0; i < activeTracks.length; i++) {
    const track = activeTracks[i];
    currentStep++;
    const percent = Math.round((currentStep / totalSteps) * 80);

    if (onProgress) {
      onProgress(`Renderizando stem ${i + 1}/${activeTracks.length}: "${track.name}"...`, percent);
    }

    // Render audio buffer with exact pitch, fine-tune, BPM ratio, and alignment offset
    const timeStretchRatio = masterBpm / (track.sourceBpm || masterBpm);
    const rendered = await renderProcessedVocalBuffer(audioContext, track.audioBuffer!, {
      pitchShiftSemitones: track.pitchShiftSemitones,
      fineTuneCents: track.fineTuneCents,
      timeStretchRatio,
      tuningMode: track.tuningMode,
      retuneSpeedMs: track.retuneSpeedMs,
      key: track.musicalKey,
      scale: track.scaleType,
      timeOffsetMs: track.timeOffsetMs || 0,
      volume: track.volume,
      pan: track.pan,
      fullProjectDuration: options.normalizeAlignment ? maxProjectDuration : undefined,
      eq: track.eq,
      compressor: track.compressor,
    });

    // Encode to 16-bit PCM WAV
    const wavBlob = encodeAudioBufferToWav(rendered);
    const arrayBuffer = await wavBlob.arrayBuffer();

    // Clean sanitize filename
    const slotNum = (tracks.indexOf(track) + 1).toString().padStart(2, '0');
    const safeName = track.name.replace(/[^a-zA-Z0-9_\-\sáéíóúÁÉÍÓÚñÑ]/g, '').trim().replace(/\s+/g, '_');
    const tuningTag =
      track.tuningMode === 'autotune_hard'
        ? 'AutoTune_0ms'
        : track.tuningMode === 'melodyne_natural'
        ? `Melodyne_${track.retuneSpeedMs}ms`
        : 'Bypass';
    const filename = `${slotNum}_${safeName}_${masterBpm}BPM_${masterKey}_${masterScale}_${tuningTag}.wav`;

    zip.file(filename, arrayBuffer);

    trackSummaries.push(
      `Pista ${slotNum}: ${track.name}
  - Archivo WAV: ${filename}
  - Rol: ${track.role}
  - Afinación: ${tuningTag}
  - Transposición: ${track.pitchShiftSemitones >= 0 ? '+' : ''}${track.pitchShiftSemitones} st (${track.fineTuneCents} ct)
  - Formantes: ${track.formantShift >= 0 ? '+' : ''}${track.formantShift}
  - Paneo: ${track.pan === 0 ? 'Centro (0.0)' : track.pan < 0 ? `L ${Math.abs(track.pan)}` : `R ${track.pan}`}
  - Desfase Temporal: ${track.timeOffsetMs || 0} ms
  - BPM Origen: ${track.sourceBpm} BPM -> Destino: ${masterBpm} BPM`
    );
  }

  // Add documentation README for professional DAW engineers
  if (options.includeSessionNotes) {
    const sessionInfo = `================================================================================
VOCALFORGE STUDIO - PAQUETE PROFESIONAL DE STEMS VOCALES
================================================================================
Fecha de Exportación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}
BPM de la Sesión: ${masterBpm} BPM
Tonalidad Raíz: ${masterKey}
Escala Musical: ${masterScale}
Formato de Stems: WAV Estéreo 44.1 kHz, 16-bit PCM lineal sin pérdidas
Alineación Temporal: Normalizada desde el segundo 00:00.000 (Alineación Absoluta)
Total de Pistas en este paquete: ${activeTracks.length}

DETALLE INDIVIDUAL DE LAS PISTAS:
--------------------------------------------------------------------------------
${trackSummaries.join('\n\n')}

INSTRUCCIONES PARA PRO TOOLS / LOGIC PRO / ABLETON LIVE / FL STUDIO / REAPER / CUBASE:
--------------------------------------------------------------------------------
1. Crea una nueva sesión en tu DAW a ${masterBpm} BPM (frecuencia de muestreo 44.1 kHz).
2. Selecciona todos los archivos .wav de esta carpeta y arrástralos directamente a la línea de tiempo.
3. Asegúrate de soltar todas las pistas alineadas en el Compás 1, Tiempo 1 (00:00:00).
4. Todas las pistas han sido procesadas con corrección de tono (Melodyne/Auto-Tune) y estiramiento rítmico, por lo que sonarán perfectamente sincronizadas y afinadas.
================================================================================
Generado por VocalForge Studio · DAW de Corrección de Tono y Tiempo Musical
`;
    zip.file('LEEME_SESION_DAW.txt', sessionInfo);
  }

  if (onProgress) {
    onProgress('Comprimiendo paquete ZIP de stems...', 90);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(`Comprimiendo ZIP: ${metadata.percent.toFixed(0)}%`, 85 + Math.round(metadata.percent * 0.14));
      }
    }
  );

  if (onProgress) {
    onProgress('¡Paquete ZIP completado!', 100);
  }

  return zipBlob;
}
