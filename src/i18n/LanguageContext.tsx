import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dictionaries, type Lang, type Namespace } from './dictionaries';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  lang: Lang;
  children: ReactNode;
}

export function LanguageProvider({ lang, children }: LanguageProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const value = useMemo<LanguageContextValue>(() => {
    const setLang = (next: Lang) => {
      if (next === lang) return;
      const rest = location.pathname.split('/').slice(2).join('/');
      navigate(`/${next}${rest ? `/${rest}` : ''}${location.search}`);
    };

    return {
      lang,
      setLang,
      toggleLang: () => setLang(lang === 'ru' ? 'en' : 'ru'),
    };
  }, [lang, location.pathname, location.search, navigate]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
}

export function useTranslation<N extends Namespace>(namespace: N) {
  const { lang } = useLang();
  return dictionaries[lang][namespace];
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}
