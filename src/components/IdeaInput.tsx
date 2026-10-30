import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Zap,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { PostTone, AspectRatio, ImageSize, ImageModel } from '../types';

interface IdeaInputProps {
  onGenerate: (data: {
    idea: string;
    tone: PostTone;
    targetAudience: string;
    imageSettings: {
      model: ImageModel;
      size: ImageSize;
      linkedinAspectRatio: AspectRatio;
      twitterAspectRatio: AspectRatio;
      instagramAspectRatio: AspectRatio;
    };
  }) => void;
  isGenerating: boolean;
  idea: string;
  setIdea: (val: string) => void;
  tone: PostTone;
  setTone: (val: PostTone) => void;
}

const SAMPLE_IDEAS = [
  {
    title: 'Lanzamiento de Producto',
    tone: 'urgent' as PostTone,
    text: 'Acabamos de lanzar OmniReview: un agente autónomo de IA que revisa pull requests en 30 segundos, detecta condiciones de carrera complejas que pasan desapercibidas y reduce el tiempo de revisión de código en un 72%. Los primeros 500 equipos obtienen acceso vitalicio gratuito.',
    audience: 'Ingenieros de Software, Directores de Tecnología, Fundadores de Startups',
  },
  {
    title: 'Lección Aprendida',
    tone: 'witty' as PostTone,
    text: 'Pasé 6 meses perfeccionando un algoritmo que nadie pidió, mientras nuestra página de registro tenía el botón roto. Trabajar encerrado en tu cueva es cómodo; lanzar a usuarios reales asusta. Por esto las funcionalidades de vanidad matan más startups que el mal código.',
    audience: 'Fundadores de Startups, Creadores Solitarios, Product Managers',
  },
  {
    title: 'Hito y Retención',
    tone: 'professional' as PostTone,
    text: 'Hoy superamos los 2.5 millones de dólares en ingresos recurrentes anuales con un equipo remoto de 6 personas y cero financiación externa. En un mercado saturado de ruido, nuestra mayor ventaja competitiva no fueron más funciones, sino obsesionarnos con la retención durante los primeros 7 minutos.',
    audience: 'Líderes de SaaS, Inversores, Responsables de Crecimiento',
  },
  {
    title: 'Opinión Disruptiva',
    tone: 'urgent' as PostTone,
    text: 'El 90% de las empresas que adoptan IA lo hacen al revés: automatizan artículos de marketing que nadie lee, en lugar de automatizar la fricción interna que agota a sus mejores ingenieros. Si tu estrategia de IA es solo generar posts de blog, te estás quedando atrás.',
    audience: 'Directores de Empresa, CTOs, Estrategas Digitales',
  },
];

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; desc: string }[] = [
  { value: '1:1', label: '1:1 Cuadrado', desc: 'Óptimo para feed de Instagram y LinkedIn' },
  { value: '16:9', label: '16:9 Horizontal', desc: 'Óptimo para tarjetas de Twitter/X y LinkedIn' },
  { value: '9:16', label: '9:16 Vertical', desc: 'Óptimo para Stories y Reels de Instagram' },
  { value: '4:3', label: '4:3 Clásico', desc: 'Presentación tradicional de escritorio' },
  { value: '3:4', label: '3:4 Retrato Alto', desc: 'Alto impacto visual en feed móvil' },
  { value: '3:2', label: '3:2 Foto Clásica', desc: 'Formato estándar fotográfico 35mm' },
  { value: '2:3', label: '2:3 Vertical', desc: 'Estilo póster móvil / Pinterest' },
  { value: '21:9', label: '21:9 Cinemático', desc: 'Banner panorámico ultra-ancho' },
];

export const IdeaInput: React.FC<IdeaInputProps> = ({
  onGenerate,
  isGenerating,
  idea,
  setIdea,
  tone,
  setTone,
}) => {
  const [targetAudience, setTargetAudience] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Image generation settings affordances
  const [imageModel, setImageModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [linkedinRatio, setLinkedinRatio] = useState<AspectRatio>('16:9');
  const [twitterRatio, setTwitterRatio] = useState<AspectRatio>('16:9');
  const [instagramRatio, setInstagramRatio] = useState<AspectRatio>('1:1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isGenerating) return;
    onGenerate({
      idea: idea.trim(),
      tone,
      targetAudience: targetAudience.trim(),
      imageSettings: {
        model: imageModel,
        size: imageSize,
        linkedinAspectRatio: linkedinRatio,
        twitterAspectRatio: twitterRatio,
        instagramAspectRatio: instagramRatio,
      },
    });
  };

  const handleApplySample = (sample: (typeof SAMPLE_IDEAS)[0]) => {
    setIdea(sample.text);
    setTone(sample.tone);
    setTargetAudience(sample.audience);
  };

  return (
    <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 lg:p-7 shadow-xl shadow-black/40 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span>Ingresa tu Idea Central o Ángulo de Campaña</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Genera borradores simultáneos para LinkedIn (formato largo), Twitter/X (directo y conciso) e Instagram (visual con hashtags).
            </p>
          </div>

          {/* Quick Idea Starters */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mr-1">
              Ejemplos:
            </span>
            {SAMPLE_IDEAS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Idea Textarea */}
        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            placeholder="Describe tu anuncio, lección, metodología, historia o punto de vista... (ej. Acabamos de lanzar nuestro motor de diseño con IA; aquí explicamos cómo resolvimos el renderizado en tiempo real con 3 decisiones clave de arquitectura...)"
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="absolute bottom-3 right-3 text-[11px] text-zinc-500">
            {idea.length} caracteres
          </div>
        </div>

        {/* Tone Selection (Mandatory: professional, witty, urgent + bonus) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Voz y Tono Deseado
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              {
                id: 'professional' as PostTone,
                label: 'Profesional',
                desc: 'Autoritario, riguroso, liderazgo de opinión',
                color: 'hover:border-sky-500/60',
                activeColor: 'border-sky-500 bg-sky-950/30 text-sky-300',
              },
              {
                id: 'witty' as PostTone,
                label: 'Ingenioso',
                desc: 'Perspicaz, con chispa, humor inteligente',
                color: 'hover:border-amber-500/60',
                activeColor: 'border-amber-500 bg-amber-950/30 text-amber-300',
              },
              {
                id: 'urgent' as PostTone,
                label: 'Urgente',
                desc: 'Alto impacto, llamada a la acción, oportunidad/FOMO',
                color: 'hover:border-rose-500/60',
                activeColor: 'border-rose-500 bg-rose-950/30 text-rose-300',
              },
              {
                id: 'inspirational' as PostTone,
                label: 'Inspirador',
                desc: 'Visionario, motivador, resonancia emocional',
                color: 'hover:border-emerald-500/60',
                activeColor: 'border-emerald-500 bg-emerald-950/30 text-emerald-300',
              },
              {
                id: 'educational' as PostTone,
                label: 'Educativo',
                desc: 'Desglose paso a paso, guías prácticas',
                color: 'hover:border-indigo-500/60',
                activeColor: 'border-indigo-500 bg-indigo-950/30 text-indigo-300',
              },
            ].map((t) => {
              const isActive = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`flex flex-col items-start p-3 text-left rounded-xl border transition-all ${
                    isActive
                      ? t.activeColor
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 ' + t.color
                  }`}
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {t.label}
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-zinc-400">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Image Settings & Target Audience Affordances */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-sky-400" />
              <span>Modelo de Imagen, Resolución (1K/2K/4K) y Proporciones de Aspecto</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <span>{showAdvanced ? 'Ocultar ajustes' : 'Personalizar ajustes'}</span>
              {showAdvanced ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </div>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 pt-3 border-t border-zinc-800 text-xs">
              {/* Target Audience */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Audiencia Objetivo (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="ej. Fundadores de SaaS B2B, Directores de Ingeniería, Creadores, Marketers"
                    className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
                  />
                  <Target className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                </div>
              </div>

              {/* Model & Size Affordances */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Image Model Affordance */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Modelo de Imagen (Gemini Pro / Flash)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImageModel('gemini-3-pro-image-preview')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        imageModel === 'gemini-3-pro-image-preview'
                          ? 'border-sky-500 bg-sky-950/30 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">Gemini 3 Pro</div>
                      <div className="text-[10px] text-zinc-400">Calidad Estudio (1K-4K)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageModel('gemini-3.1-flash-image-preview')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        imageModel === 'gemini-3.1-flash-image-preview'
                          ? 'border-sky-500 bg-sky-950/30 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">Gemini 3.1 Flash</div>
                      <div className="text-[10px] text-zinc-400">Generación Rápida</div>
                    </button>
                  </div>
                </div>

                {/* Image Size Affordance (1K, 2K, 4K) */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Tamaño de Resolución (1K, 2K, 4K)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setImageSize(sz)}
                        className={`py-2 px-3 rounded-lg border text-center font-mono font-bold text-xs transition-all ${
                          imageSize === sz
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 shadow-sm'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {sz}
                        <span className="block text-[9px] font-sans font-normal text-zinc-500">
                          {sz === '1K' ? '1024px' : sz === '2K' ? '2048px' : '4096px'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Per-Platform Optimal Aspect Ratio Selectors */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Proporciones Óptimas por Plataforma
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* LinkedIn Ratio */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5">
                    <div className="text-[11px] font-semibold text-sky-400 mb-1">Aspecto LinkedIn</div>
                    <select
                      value={linkedinRatio}
                      onChange={(e) => setLinkedinRatio(e.target.value as AspectRatio)}
                      className="w-full rounded bg-zinc-950 border border-zinc-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.value === '16:9' ? '★ (Recomendado)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Twitter Ratio */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5">
                    <div className="text-[11px] font-semibold text-zinc-200 mb-1">Aspecto Twitter/X</div>
                    <select
                      value={twitterRatio}
                      onChange={(e) => setTwitterRatio(e.target.value as AspectRatio)}
                      className="w-full rounded bg-zinc-950 border border-zinc-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.value === '16:9' ? '★ (Recomendado)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Instagram Ratio */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5">
                    <div className="text-[11px] font-semibold text-rose-400 mb-1">Aspecto Instagram</div>
                    <select
                      value={instagramRatio}
                      onChange={(e) => setInstagramRatio(e.target.value as AspectRatio)}
                      className="w-full rounded bg-zinc-950 border border-zinc-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.value === '1:1' ? '★ (Estándar Feed)' : opt.value === '9:16' ? '★ (Story/Reel)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-zinc-500 hidden sm:block">
            Genera en paralelo publicaciones para LinkedIn, Twitter/X e Instagram con imágenes en proporción óptima.
          </div>
          <button
            type="submit"
            disabled={!idea.trim() || isGenerating}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all ${
              !idea.trim() || isGenerating
                ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] shadow-sky-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generando Campaña Multiplataforma...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generar Contenido Multiplataforma</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
