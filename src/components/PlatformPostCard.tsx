import React, { useState } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Download,
  RefreshCw,
  Scissors,
  Zap,
  Target,
  BarChart3,
  Maximize2,
  ChevronDown,
  Edit3,
  Sliders,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { PostDraft, SocialPlatform, AspectRatio, ImageSize, ImageModel } from '../types';
import { copyToClipboard } from '../utils/formatters';
import { generateBrandedCanvasImage } from '../utils/canvasGenerator';

interface PlatformPostCardProps {
  draft: PostDraft;
  topicIdea: string;
  tone: string;
  onUpdateContent: (newContent: string) => void;
  onRefine: (action: string) => Promise<void>;
  onGenerateImage: (config: {
    prompt: string;
    model: ImageModel;
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
  }) => Promise<void>;
  onOpenAnalysis: () => void;
  onOpenHooks: () => void;
  isRefining: boolean;
}

const PLATFORM_CONFIG = {
  linkedin: {
    name: 'LinkedIn',
    subtitle: 'Formato Largo y Liderazgo de Opinión',
    badgeColor: 'text-[#0a66c2]',
    borderColor: 'border-[#0a66c2]/40',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    userName: 'Alejandro Chen',
    userHandle: 'VP de IA & Ingeniería de Producto · 18k seguidores',
    time: '1h · 🌐',
    maxRecommendedChars: 3000,
  },
  twitter: {
    name: 'Twitter / X',
    subtitle: 'Despacho Directo y Contundente',
    badgeColor: 'text-zinc-100',
    borderColor: 'border-zinc-700',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    userName: 'Alejandro Chen',
    userHandle: '@alexchen_tech',
    time: '2m',
    maxRecommendedChars: 280,
  },
  instagram: {
    name: 'Instagram',
    subtitle: 'Narrativa Visual y Hashtags',
    badgeColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    userName: 'alexchen.crea',
    userHandle: 'Audio original · Tecnología & IA',
    time: '32m',
    maxRecommendedChars: 2200,
  },
};

const ASPECT_RATIO_OPTIONS: AspectRatio[] = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
];

export const PlatformPostCard: React.FC<PlatformPostCardProps> = ({
  draft,
  topicIdea,
  tone,
  onUpdateContent,
  onRefine,
  onGenerateImage,
  onOpenAnalysis,
  onOpenHooks,
  isRefining,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(draft.imagePrompt);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(
    draft.imageConfig.aspectRatio || (draft.platform === 'instagram' ? '1:1' : '16:9')
  );
  const [selectedSize, setSelectedSize] = useState<ImageSize>(draft.imageConfig.size || '1K');
  const [selectedModel, setSelectedModel] = useState<ImageModel>(
    draft.imageConfig.model || 'gemini-3-pro-image-preview'
  );
  const [showImageControls, setShowImageControls] = useState(false);

  const config = PLATFORM_CONFIG[draft.platform];

  const handleCopy = async () => {
    const success = await copyToClipboard(draft.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerImageGen = () => {
    onGenerateImage({
      prompt: customPrompt || draft.imagePrompt,
      model: selectedModel,
      aspectRatio: selectedRatio,
      imageSize: selectedSize,
    });
  };

  // Generate fallback canvas if not yet generated or quota hit
  const displayImageUrl =
    draft.imageConfig.imageUrl ||
    generateBrandedCanvasImage({
      platform: draft.platform,
      hook: draft.hook || draft.content.slice(0, 80),
      topic: topicIdea,
      tone,
      aspectRatio: selectedRatio,
      imageSize: selectedSize,
    });

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.download = `${draft.platform}-visual-${selectedRatio.replace(':', 'x')}-${selectedSize}.png`;
    link.href = displayImageUrl;
    link.click();
  };

  // Twitter 280 char calculation
  const isTwitter = draft.platform === 'twitter';
  const charCount = draft.content.length;
  const isOverTwitterLimit = isTwitter && charCount > 280;
  const twitterProgress = Math.min(100, Math.round((charCount / 280) * 100));

  return (
    <div className={`flex flex-col rounded-2xl border ${config.borderColor} bg-zinc-950/90 shadow-xl overflow-hidden backdrop-blur-md transition-all hover:border-opacity-80`}>
      {/* Platform Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/50">
        <div className="flex items-center gap-2.5">
          <div className={`font-bold text-sm ${config.badgeColor} flex items-center gap-1.5`}>
            {draft.platform === 'linkedin' && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0a66c2] text-[11px] font-black text-white">
                in
              </span>
            )}
            {draft.platform === 'twitter' && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-black border border-zinc-700 text-[11px] font-bold text-white">
                𝕏
              </span>
            )}
            {draft.platform === 'instagram' && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-[11px] font-bold text-white">
                IG
              </span>
            )}
            <span>{config.name}</span>
          </div>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs text-zinc-400 hidden sm:inline">{config.subtitle}</span>
        </div>

        {/* Copy & Audit Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAnalysis}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/50 rounded-md transition-colors"
            title="Auditoría Estratégica de Algoritmo y Viralidad"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Auditoría de Viralidad</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Platform Native Profile Mockup */}
      <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* User profile row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`relative rounded-full p-0.5 ${
                  draft.platform === 'instagram'
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                    : 'bg-zinc-800'
                }`}
              >
                <img
                  src={config.avatar}
                  alt={config.userName}
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{config.userName}</span>
                  {draft.platform === 'twitter' && (
                    <span className="text-sky-400 text-xs font-bold">✓</span>
                  )}
                  <span className="text-[11px] text-zinc-500">· {config.time}</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  {config.userHandle}
                </div>
              </div>
            </div>

            {/* Character meter */}
            <div className="flex items-center gap-2 text-xs">
              {isTwitter ? (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center justify-center h-5 w-5">
                    <svg className="h-5 w-5 -rotate-90 transform">
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-zinc-800"
                        fill="transparent"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={50}
                        strokeDashoffset={50 - (50 * twitterProgress) / 100}
                        className={
                          isOverTwitterLimit
                            ? 'text-rose-500'
                            : charCount > 240
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                        fill="transparent"
                      />
                    </svg>
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      isOverTwitterLimit
                        ? 'text-rose-400 font-bold'
                        : charCount > 240
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {charCount}/280
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500 font-mono text-[11px]">
                  {charCount} caracteres · {draft.wordCount} palabras
                </span>
              )}
            </div>
          </div>

          {/* Editable Post Content Textarea */}
          <div className="relative">
            <textarea
              value={draft.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              rows={draft.platform === 'linkedin' ? 8 : draft.platform === 'instagram' ? 7 : 4}
              className={`w-full rounded-xl border p-3.5 text-xs sm:text-sm text-zinc-100 bg-zinc-900/60 leading-relaxed transition-all focus:outline-none focus:ring-1 ${
                isOverTwitterLimit
                  ? 'border-rose-500/80 focus:ring-rose-500'
                  : 'border-zinc-800 focus:border-sky-500 focus:ring-sky-500'
              }`}
            />
            {isOverTwitterLimit && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Supera el límite de 280 caracteres de Twitter. Pulsa "Acortar" para ajustar automáticamente.</span>
              </div>
            )}
          </div>

          {/* Gemini Intelligence Fast Actions Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 flex items-center gap-1 mr-1">
              <Zap className="h-3 w-3 text-sky-400" />
              Gemini Flash:
            </span>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => onRefine('punchier')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Más contundente</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => onRefine('shorten')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <Scissors className="h-3 w-3 text-rose-400" />
              <span>Acortar</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={onOpenHooks}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <Target className="h-3 w-3 text-emerald-400" />
              <span>5 Ganchos</span>
            </button>

            <button
              type="button"
              disabled={isRefining}
              onClick={() => onRefine('cta')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span>Potenciar CTA</span>
            </button>
          </div>
        </div>

        {/* Visual Asset Container (Aspect Ratio & Resolution Aware) */}
        <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-3">
          {/* Visual header with aspect ratio badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                Visual Óptimo ({selectedRatio})
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedSize} · {selectedModel.includes('pro') ? 'Gemini 3 Pro' : 'Flash'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImageControls(!showImageControls)}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Sliders className="h-3 w-3" />
                <span>{showImageControls ? 'Ocultar ajustes' : 'Proporción y tamaño'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                title="Descargar imagen en alta resolución"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>

          {/* Collapsible Aspect Ratio & Resolution Affordances */}
          {showImageControls && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {/* Aspect Ratio Affordance */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Proporción de Aspecto
                  </label>
                  <select
                    value={selectedRatio}
                    onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)}
                    className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    {ASPECT_RATIO_OPTIONS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Size Affordance (1K, 2K, 4K) */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Resolución (1K, 2K, 4K)
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value as ImageSize)}
                    className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="1K">1K (1024px)</option>
                    <option value="2K">2K (2048px)</option>
                    <option value="4K">4K (4096px)</option>
                  </select>
                </div>
              </div>

              {/* Model Choice */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Modelo de Generación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3-pro-image-preview')}
                    className={`px-2 py-1.5 rounded text-left border ${
                      selectedModel === 'gemini-3-pro-image-preview'
                        ? 'border-sky-500 bg-sky-950/40 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <span className="font-semibold block text-[11px]">Gemini 3 Pro</span>
                    <span className="text-[9px] text-zinc-500">Calidad Estudio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3.1-flash-image-preview')}
                    className={`px-2 py-1.5 rounded text-left border ${
                      selectedModel === 'gemini-3.1-flash-image-preview'
                        ? 'border-sky-500 bg-sky-950/40 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <span className="font-semibold block text-[11px]">Gemini 3.1 Flash</span>
                    <span className="text-[9px] text-zinc-500">Renderizado Rápido</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview Canvas */}
          <div className="relative group overflow-hidden rounded-xl border border-zinc-800 bg-black flex items-center justify-center">
            <img
              src={displayImageUrl}
              alt={`Visual personalizado para ${draft.platform}`}
              className="w-full h-auto object-cover max-h-[360px] transition-transform duration-300 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />

            {draft.imageConfig.status === 'generating' && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                <span className="text-xs font-medium">Generando Visual en {selectedSize}...</span>
              </div>
            )}

            {/* Overlay Action Bar */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 transition-opacity">
              <button
                type="button"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md backdrop-blur-sm shadow-sm"
              >
                <Edit3 className="h-3 w-3" />
                <span>Prompt</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerImageGen}
                disabled={draft.imageConfig.status === 'generating'}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-sm"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    draft.imageConfig.status === 'generating' ? 'animate-spin' : ''
                  }`}
                />
                <span>Generar</span>
              </button>
            </div>
          </div>

          {/* Editable Prompt Drawer */}
          {isEditingPrompt && (
            <div className="mt-2 space-y-2 border-t border-zinc-800 pt-2 text-xs">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                Prompt Artístico Visual:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                className="w-full rounded bg-zinc-950 border border-zinc-700 p-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleTriggerImageGen}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                >
                  Regenerar con Prompt Personalizado
                </button>
              </div>
            </div>
          )}

          {/* Quota / Status Notice if any */}
          {draft.imageConfig.status === 'error' && draft.imageConfig.errorMessage && (
            <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded p-2">
              {draft.imageConfig.errorMessage} (Mostrando tarjeta visual de alta resolución del lienzo)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
