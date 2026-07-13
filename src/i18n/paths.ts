import type { Lang } from './dictionaries';

export const SUPPORTED_LANGS: Lang[] = ['en', 'ru'];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string | undefined): value is Lang {
  return value === 'en' || value === 'ru';
}

// Relative route segments shared by routes.tsx and every internal link.
export const routePaths = {
  home: '',
  pricing: 'pricing',
  gpuServers: 'products/gpu-servers',
  dashboard: 'dashboard',
};

export function localizePath(lang: Lang, path: string) {
  const clean = path.replace(/^\//, '');
  return clean ? `/${lang}/${clean}` : `/${lang}`;
}
