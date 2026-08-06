import { Navigate } from 'react-router';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { SignupList } from '../components/dashboard/SignupList';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';

export function AdminPage() {
  const { isAdmin } = useAuth();
  const { lang } = useLang();

  // Routing convenience only, not access control: `isAdmin` comes from a claim
  // in the browser's own token and a determined visitor could reach this route
  // regardless. What actually protects the data is ZITADEL — it rejects the
  // ListAuthorizations call unless the caller's token carries the permission,
  // and SignupList renders that refusal plainly.
  if (!isAdmin) {
    return <Navigate to={localizePath(lang, routePaths.dashboard)} replace />;
  }

  return (
    <DashboardShell>
      <SignupList />
    </DashboardShell>
  );
}
