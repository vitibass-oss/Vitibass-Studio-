import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code2 } from 'lucide-react';
import { CampaignData } from '../types';
import { copyToClipboard } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignData | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !campaign) return null;

  const buildMarkdown = () => {
    return `# EXPORTACIÓN DE CAMPAÑA OMNIPOST
**Idea:** ${campaign.idea}  
**Tono:** ${campaign.tone.toUpperCase()}  
**Audiencia Objetivo:** ${campaign.targetAudience || 'Profesionales Generales'}  
**Fecha de Generación:** ${new Date(campaign.createdAt).toLocaleString()}  

---

## 1. LinkedIn (Formato Largo)
**Proporción de Aspecto:** ${campaign.posts.linkedin.imageConfig.aspectRatio}  
**Prompt Visual:** ${campaign.posts.linkedin.imagePrompt}  

\`\`\`
${campaign.posts.linkedin.content}
\`\`\`

---

## 2. Twitter / X (Corto y Contundente)
**Proporción de Aspecto:** ${campaign.posts.twitter.imageConfig.aspectRatio}  
**Prompt Visual:** ${campaign.posts.twitter.imagePrompt}  

\`\`\`
${campaign.posts.twitter.content}
\`\`\`

---

## 3. Instagram (Visual y Hashtags)
**Proporción de Aspecto:** ${campaign.posts.instagram.imageConfig.aspectRatio}  
**Prompt Visual:** ${campaign.posts.instagram.imagePrompt}  

\`\`\`
${campaign.posts.instagram.content}
\`\`\`
`;
  };

  const handleCopyMarkdown = async () => {
    const md = buildMarkdown();
    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnipost-campana-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(campaign, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnipost-campana-${campaign.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Exportar Paquete de Redes Sociales</h3>
            <p className="text-xs text-zinc-400">
              Descarga o copia las 3 publicaciones y los metadatos visuales de una sola vez
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-sky-500 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-all"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <Copy className="h-5 w-5 text-sky-400" />
              )}
              <span className="text-xs font-semibold">
                {copied ? '¡Paquete Copiado!' : 'Copiar Markdown'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-emerald-500 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-all"
            >
              <FileText className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-semibold">Descargar .MD</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-indigo-500 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-all"
            >
              <Code2 className="h-5 w-5 text-indigo-400" />
              <span className="text-xs font-semibold">Descargar .JSON</span>
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 max-h-48 overflow-y-auto text-xs font-mono text-zinc-400 whitespace-pre-wrap">
            {buildMarkdown().slice(0, 500)}...
          </div>
        </div>
      </div>
    </div>
  );
};
