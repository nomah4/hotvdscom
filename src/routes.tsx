import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { LangGate } from './components/layout/LangGate';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { CallbackPage } from './pages/CallbackPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RequireAuth } from './auth/RequireAuth';
import { DEFAULT_LANG, routePaths } from './i18n/paths';

// Everything except the landing, pricing and sign-in callback is split out: the
// marketing visitor should not download the cabinet, admin and billing code.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NewServerPage = lazy(() => import('./pages/NewServerPage').then((m) => ({ default: m.NewServerPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const BalancePage = lazy(() => import('./pages/BalancePage').then((m) => ({ default: m.BalancePage })));
const BalanceReturnPage = lazy(() => import('./pages/BalanceReturnPage').then((m) => ({ default: m.BalanceReturnPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CheckoutReturnPage = lazy(() => import('./pages/CheckoutReturnPage').then((m) => ({ default: m.CheckoutReturnPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const DatacentersPage = lazy(() => import('./pages/DatacentersPage').then((m) => ({ default: m.DatacentersPage })));
const ApiPage = lazy(() => import('./pages/ApiPage').then((m) => ({ default: m.ApiPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const PartnersPage = lazy(() => import('./pages/PartnersPage').then((m) => ({ default: m.PartnersPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const StatusPage = lazy(() => import('./pages/StatusPage').then((m) => ({ default: m.StatusPage })));

export { routePaths };

export function AppRoutes() {
  return (
    <Suspense fallback={null}>
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
        {/* Account balance. Behind RequireAuth because it reads and spends this
            customer's own money — every balance call is scoped to the token. */}
        <Route
          path={routePaths.balance}
          element={
            <RequireAuth>
              <BalancePage />
            </RequireAuth>
          }
        />
        {/* Gateway return for a top-up. Declared after `balance` but react-router
            ranks by specificity, not order, so the deeper path still wins.
            RequireAuth for the same reason as checkoutReturn: reading the
            top-up back needs the customer's own token. */}
        <Route
          path={routePaths.balanceReturn}
          element={
            <RequireAuth>
              <BalanceReturnPage />
            </RequireAuth>
          }
        />
        {/* Technical support. Behind RequireAuth like the rest of the cabinet:
            it is reached from the sidebar and the chat is about this customer's
            own servers. */}
        <Route
          path={routePaths.support}
          element={
            <RequireAuth>
              <SupportPage />
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
    </Suspense>
  );
}
