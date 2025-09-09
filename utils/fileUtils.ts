import { ProjectFile } from './types';

export function getFileIcon(mimeType: string, url?: string): string {
  if (url) {
    if (url.includes('docs.google.com/document')) return '📄';
    if (url.includes('docs.google.com/spreadsheets')) return '📊';
    if (url.includes('docs.google.com/presentation')) return '🖼️';
    return '🔗';
  }
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType === 'text/plain') return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return '📊';
  return '📁';
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
}

export function parseGoogleUrl(url: string) {
    if (url.includes('docs.google.com/document')) return { type: 'Google Doc', name: 'Google Document' };
    if (url.includes('docs.google.com/spreadsheets')) return { type: 'Google Sheet', name: 'Google Spreadsheet' };
    if (url.includes('docs.google.com/presentation')) return { type: 'Google Slides', name: 'Google Slides Presentation' };
    try {
        const urlObj = new URL(url);
        return { type: 'Web Link', name: urlObj.hostname };
    } catch {
        return { type: 'Web Link', name: 'Web Link' };
    }
}
