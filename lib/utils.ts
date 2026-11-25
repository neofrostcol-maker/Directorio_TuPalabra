import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resuelve la URL pública base de la aplicación de forma compatible con:
 * - Vercel Production (VERCEL_PROJECT_PRODUCTION_URL)
 * - Vercel Preview / Branch Deploys (VERCEL_URL)
 * - Variable explícita APP_URL (si no es localhost en Vercel)
 * - Desarrollo local (http://localhost:3000)
 */
export function getBaseUrl(): string {
  const configured = process.env.APP_URL?.trim();
  const isLocalDefault =
    !configured ||
    configured === 'http://localhost:3000' ||
    configured === 'http://localhost:3000/';

  if (configured && !(process.env.VERCEL === '1' && isLocalDefault)) {
    return configured.replace(/\/+$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '')}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }

  return 'http://localhost:3000';
}

/**
 * Normaliza y valida enlaces externos para evitar links rotos relativos
 * o esquemas peligrosos (javascript:, data:, vbscript:).
 */
export function normalizarUrlExterna(
  valor?: string | null,
  redSocial?: 'instagram' | 'facebook' | 'tiktok'
): string | null {
  if (!valor) return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return null;
  }

  let candidate = trimmed;

  if (!/^https?:\/\//i.test(candidate)) {
    if (redSocial === 'instagram') {
      const handle = candidate.replace(/^@/, '').replace(/^\/+/, '');
      candidate = `https://www.instagram.com/${handle}`;
    } else if (redSocial === 'facebook') {
      const handle = candidate.replace(/^@/, '').replace(/^\/+/, '');
      candidate = `https://www.facebook.com/${handle}`;
    } else if (redSocial === 'tiktok') {
      const handle = candidate.replace(/^@/, '').replace(/^\/+/, '');
      candidate = `https://www.tiktok.com/@${handle}`;
    } else {
      candidate = `https://${candidate.replace(/^\/+/, '')}`;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
