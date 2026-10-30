import React from 'react';
import { X, CheckCircle2, AlertTriangle, TrendingUp, Clock, Sparkles, BarChart2 } from 'lucide-react';
import { PostAnalysis, SocialPlatform } from '../types';

interface PostAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: PostAnalysis | null;
  isLoading: boolean;
  platform: SocialPlatform;
  onApplyHook: (hook: string) => void;
}

export const PostAnalysisModal: React.FC<PostAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  platform,
  onApplyHook,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Auditoría Estratégica de Viralidad para {platform.toUpperCase()}
              </h3>
              <p className="text-xs text-zinc-400">
                Auditado con la inteligencia estratégica de Gemini 3.1 Pro
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <p className="text-xs font-medium">
              Simulando el algoritmo de la plataforma y psicología del gancho con Gemini 3.1 Pro...
            </p>
          </div>
        ) : analysis ? (
          <div className="py-5 space-y-6">
            {/* Top Score Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">
                  Puntuación de Interacción
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {analysis.engagementScore}
                  </span>
                  <span className="text-xs text-zinc-500">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                    style={{ width: `${analysis.engagementScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">
                  Potencial de Viralidad
                </span>
                <span
                  className={`mt-2 text-xl font-bold ${
                    analysis.viralityPotential === 'Very High' ||
                    analysis.viralityPotential === 'High' ||
                    analysis.viralityPotential === 'Alta' ||
                    analysis.viralityPotential === 'Muy Alta'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {analysis.viralityPotential}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">Factor de retención algorítmica</span>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">
                  Fuerza del Gancho
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {analysis.hookAnalysis.score}
                  </span>
                  <span className="text-xs text-zinc-500">/10</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">Poder de detención del scroll</span>
              </div>
            </div>

            {/* Hook Analysis Breakdown */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Análisis y Optimización del Gancho
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Fortalezas:
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-zinc-300">
                    {analysis.hookAnalysis.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Puntos a Mejorar:
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-zinc-300">
                    {analysis.hookAnalysis.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {analysis.hookAnalysis.suggestedHook && (
                <div className="mt-2 rounded-lg border border-sky-900/40 bg-sky-950/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                      Gancho Mejorado Sugerido
                    </span>
                    <button
                      type="button"
                      onClick={() => onApplyHook(analysis.hookAnalysis.suggestedHook)}
                      className="text-xs px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
                    >
                      Aplicar Gancho
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-200 italic font-medium">
                    "{analysis.hookAnalysis.suggestedHook}"
                  </p>
                </div>
              )}
            </div>

            {/* Readability & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1.5">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                  Ritmo y Facilidad de Lectura:
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  {analysis.pacingAndReadability}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1.5">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Ventana Óptima de Publicación:
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  {analysis.recommendedPostTime}
                </p>
              </div>
            </div>

            {/* Algorithm Tips */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Manual de Crecimiento Algorítmico
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {analysis.algorithmTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-zinc-400">
            No hay análisis disponible. Por favor solicita una auditoría.
          </div>
        )}
      </div>
    </div>
  );
};
