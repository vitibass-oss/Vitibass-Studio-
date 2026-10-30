export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
}

export function getAspectDimensions(aspectRatio: string, baseWidth = 1200): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: baseWidth, height: baseWidth };
    case '16:9':
      return { width: baseWidth, height: Math.round((baseWidth * 9) / 16) };
    case '9:16':
      return { width: Math.round((baseWidth * 9) / 16), height: baseWidth };
    case '4:3':
      return { width: baseWidth, height: Math.round((baseWidth * 3) / 4) };
    case '3:4':
      return { width: Math.round((baseWidth * 3) / 4), height: baseWidth };
    case '3:2':
      return { width: baseWidth, height: Math.round((baseWidth * 2) / 3) };
    case '2:3':
      return { width: Math.round((baseWidth * 2) / 3), height: baseWidth };
    case '21:9':
      return { width: baseWidth, height: Math.round((baseWidth * 9) / 21) };
    default:
      return { width: baseWidth, height: baseWidth };
  }
}
