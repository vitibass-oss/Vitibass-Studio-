import React from 'react';
import { X, Target, ArrowRight, Sparkles } from 'lucide-react';
import { SocialPlatform } from '../types';

interface HookVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hooks: string[];
  isLoading: boolean;
  platform: SocialPlatform;
  onSelectHook: (hook: string) => void;
}

export const HookVariationsModal: React.FC<HookVariationsModalProps> = ({
  isOpen,
  onClose,
  hooks,
  isLoading,
  platform,
  onSelectHook,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                5 Ganchos Alternativos para {platform.toUpperCase()}
              </h3>
              <p className="text-xs text-zinc-400">
                Generados con Gemini Flash Lite para pruebas rápidas de alta conversión
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

        <div className="py-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              <p className="text-xs">Generando variaciones de apertura magnética...</p>
            </div>
          ) : hooks.length > 0 ? (
            <div className="space-y-2.5">
              {hooks.map((hook, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all"
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-mono font-bold text-zinc-400 group-hover:bg-emerald-950 group-hover:text-emerald-300">
                      {index + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-200 leading-snug">
                      "{hook}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectHook(hook);
                      onClose();
                    }}
                    className="flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Usar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              No hay ganchos generados aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
