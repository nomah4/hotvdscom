import { Navigate, Route, Routes } from 'react-router';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { LangGate } from './components/layout/LangGate';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { NewServerPage } from './pages/NewServerPage';
import { CallbackPage } from './pages/CallbackPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutReturnPage } from './pages/CheckoutReturnPage';
import { TermsPage } from './pages/TermsPage';
import { DatacentersPage } from './pages/DatacentersPage';
import { ApiPage } from './pages/ApiPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { PartnersPage } from './pages/PartnersPage';
import { ContactsPage } from './pages/ContactsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { StatusPage } from './pages/StatusPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RequireAuth } from './auth/RequireAuth';
import { DEFAULT_LANG, routePaths } from './i18n/paths';

export { routePaths };

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
      {/* Deliberately NOT under /:lang — the redirect URI registered in ZITADEL has
          no locale segment, and the catch-all below would otherwise swallow it and
          strip the ?code= query. Must stay above that catch-all. */}
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/:lang" element={<LangGate />}>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
          <Route path={routePaths.pricing} element={<PricingPage />} />
          <Route path={routePaths.terms} element={<TermsPage />} />
          <Route path={routePaths.datacenters} element={<DatacentersPage />} />
          <Route path={routePaths.api} element={<ApiPage />} />
          <Route path={routePaths.about} element={<AboutPage />} />
          <Route path={routePaths.blog} element={<BlogPage />} />
          <Route path={routePaths.partners} element={<PartnersPage />} />
          {/* Both footer entrances — "Контакты" and "Связаться с нами" — land here. */}
          <Route path={routePaths.contacts} element={<ContactsPage />} />
          <Route path={routePaths.knowledgeBase} element={<KnowledgeBasePage />} />
          <Route path={routePaths.status} element={<StatusPage />} />
          {/* Localized not-found. Inside /:lang and inside the layout, so a
              mistyped URL keeps the visitor's language and still gets the footer —
              which is the site map, and the most useful thing to hand someone who
              did not find what they wanted. A splat scores lowest, so the real
              routes above and the authenticated ones below still win. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Order confirmation. Deliberately NOT behind RequireAuth: a visitor
            should see what they are about to buy, and at what price, before
            being asked to sign in — the sign-in step sits on the confirm button
            instead. */}
        <Route path={routePaths.checkout} element={<CheckoutPage />} />
        {/* Personal data (a customer's own instances/billing) — unlike the
            marketing routes above, this requires a signed-in ZITADEL session. */}
        <Route
          path={routePaths.dashboard}
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        {/* Ordering from inside the account. Behind RequireAuth like the rest of
            the cabinet — it is reached from the sidebar, and the customer is
            signed in by definition. Buys nothing here: it hands off to the
            shared /checkout, same as the public pricing page. */}
        <Route
          path={routePaths.newServer}
          element={
            <RequireAuth>
              <NewServerPage />
            </RequireAuth>
          }
        />
        {/* Staff-only view of who has been granted access to the storefront.
            RequireAuth gets a session; AdminPage itself redirects a non-admin
            away, and ZITADEL refuses the underlying query regardless. */}
        <Route
          path={routePaths.admin}
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        {/* Payment gateway return. Behind RequireAuth because reading the
            invoice needs the customer's own token — a session that lapsed while
            they were on the gateway gets sent to sign in rather than shown a
            bare error. */}
        <Route
          path={routePaths.checkoutReturn}
          element={
            <RequireAuth>
              <CheckoutReturnPage />
            </RequireAuth>
          }
        />
      </Route>
      {/* Only reachable by paths that never matched a language segment at all —
          /:lang swallows anything with one, and hands it to NotFoundPage above.
          Kept as the backstop for the shapes that slip past, e.g. a bare "/". */}
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
    </Routes>
  );
}
