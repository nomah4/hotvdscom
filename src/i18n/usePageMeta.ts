import { useEffect } from 'react';
import { useLang } from './LanguageContext';

// Keeps document.title, the meta description, and <html lang> in sync with the
// current page and language — index.html only carries the default (EN home) meta.
export function usePageMeta(title: string, description: string) {
  const { lang } = useLang();

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = lang;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description, lang]);
}
