import { AspectRatio, ImageSize, SocialPlatform } from '../types';
import { getAspectDimensions } from './formatters';

interface CanvasCardOptions {
  platform: SocialPlatform;
  hook: string;
  topic: string;
  tone: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export function generateBrandedCanvasImage(options: CanvasCardOptions): string {
  const canvas = document.createElement('canvas');
  
  // Base scale according to imageSize
  let multiplier = 1;
  if (options.imageSize === '2K') multiplier = 1.7;
  if (options.imageSize === '4K') multiplier = 3;

  const baseDim = getAspectDimensions(options.aspectRatio, Math.round(1080 * multiplier));
  canvas.width = baseDim.width;
  canvas.height = baseDim.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;

  // Background Gradients based on platform & tone
  let grad = ctx.createLinearGradient(0, 0, w, h);
  if (options.platform === 'linkedin') {
    // Elegant deep navy & corporate slate
    grad.addColorStop(0, '#0a192f');
    grad.addColorStop(0.5, '#0d254c');
    grad.addColorStop(1, '#001a35');
  } else if (options.platform === 'twitter') {
    // Ultra-clean high contrast onyx & obsidian with electric accents
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.6, '#111827');
    grad.addColorStop(1, '#090d16');
  } else {
    // Instagram sunset aurora (violet to crimson to amber)
    grad.addColorStop(0, '#4f145b');
    grad.addColorStop(0.4, '#833ab4');
    grad.addColorStop(0.8, '#fd1d1d');
    grad.addColorStop(1, '#fcb045');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Modern abstract geometric mesh / circles
  ctx.save();
  ctx.globalAlpha = 0.12;
  const circleGrad = ctx.createRadialGradient(w * 0.8, h * 0.2, 50, w * 0.8, h * 0.2, w * 0.6);
  circleGrad.addColorStop(0, '#ffffff');
  circleGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = circleGrad;
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.2, w * 0.6, 0, Math.PI * 2);
  ctx.fill();

  const circleGrad2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 20, w * 0.2, h * 0.8, w * 0.5);
  circleGrad2.addColorStop(0, options.platform === 'linkedin' ? '#0077b5' : options.platform === 'twitter' ? '#38bdf8' : '#ff007f');
  circleGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = circleGrad2;
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.8, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Fine architectural grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = Math.max(1, Math.round(multiplier));
  const step = Math.round(60 * multiplier);
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();

  // Subtle glass card container in center
  const pad = Math.round(48 * multiplier);
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = Math.max(1, Math.round(1.5 * multiplier));
  const r = Math.round(24 * multiplier);
  ctx.beginPath();
  ctx.roundRect(pad, pad, cardW, cardH, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Header platform tag & aspect ratio
  ctx.save();
  const fontSizeHeader = Math.round(18 * multiplier);
  ctx.font = `600 ${fontSizeHeader}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  
  const platformLabel = options.platform === 'linkedin' ? 'LINKEDIN INSIGHT' : options.platform === 'twitter' ? 'X / TWITTER DESPACHO' : 'DESTACADO INSTAGRAM';
  ctx.fillText(platformLabel, pad + Math.round(32 * multiplier), pad + Math.round(48 * multiplier));

  const ratioBadge = `${options.aspectRatio} · ${options.imageSize}`;
  ctx.textAlign = 'right';
  ctx.fillText(ratioBadge, pad + cardW - Math.round(32 * multiplier), pad + Math.round(48 * multiplier));
  ctx.restore();

  // Main Hook text in center
  ctx.save();
  const hookFontSize = Math.min(
    Math.round(42 * multiplier),
    Math.round((h * 0.12))
  );
  ctx.font = `bold ${hookFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12 * multiplier;

  const contentText = options.hook || options.topic || 'Estrategia Social Esencial';
  wrapText(ctx, contentText, pad + Math.round(32 * multiplier), h * 0.42, cardW - Math.round(64 * multiplier), hookFontSize * 1.35, 4);
  ctx.restore();

  // Footer metadata
  ctx.save();
  const footerFontSize = Math.round(16 * multiplier);
  ctx.font = `500 ${footerFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const toneLabel = `Tono: ${options.tone.toUpperCase()} · OMNIPOST STUDIO`;
  ctx.fillText(toneLabel, pad + Math.round(32 * multiplier), pad + cardH - Math.round(32 * multiplier));
  ctx.restore();

  return canvas.toDataURL('image/png');
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      if (linesDrawn === maxLines - 1 && n < words.length) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (linesDrawn < maxLines && line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
  }
}
