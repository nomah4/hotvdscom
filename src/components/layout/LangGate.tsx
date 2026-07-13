import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { DEFAULT_LANG, isLang } from '../../i18n/paths';

export function LangGate() {
  const { lang } = useParams<{ lang: string }>();

  if (!isLang(lang)) {
    return <Navigate to={`/${DEFAULT_LANG}`} replace />;
  }

  return (
    <LanguageProvider lang={lang}>
      <Outlet />
    </LanguageProvider>
  );
}
