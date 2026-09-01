// Dynamic backend host configuration for local development, custom domains, or split Netlify/Render deployment
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || '';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!BACKEND_URL) return cleanPath;
  const cleanBackend = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBackend}${cleanPath}`;
}
