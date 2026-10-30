import React from 'react';
import { Sparkles, Download, Layers, ShieldCheck, Share2 } from 'lucide-react';

interface NavbarProps {
  onExportAll: () => void;
  hasCampaign: boolean;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onExportAll,
  hasCampaign,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Share2 className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                OmniPost Studio
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                PRO
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Motor Multiplataforma Simultáneo · LinkedIn · Twitter/X · Instagram
            </p>
          </div>
        </div>

        {/* Engine status & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-700 rounded-lg bg-zinc-900/60"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Probar idea de ejemplo</span>
            <span className="sm:hidden">Ejemplo</span>
          </button>

          {hasCampaign && (
            <button
              type="button"
              onClick={onExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 transition-colors rounded-lg shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar paquete</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500 pl-2 border-l border-zinc-800">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 3.5 & Pro Image Listo
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
