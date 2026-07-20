import { Navigate, Route, Routes } from 'react-router-dom';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { LangGate } from './components/layout/LangGate';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { ProductPage } from './pages/ProductPage';
import { DashboardPage } from './pages/DashboardPage';
import { CallbackPage } from './pages/CallbackPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutReturnPage } from './pages/CheckoutReturnPage';
import { TermsPage } from './pages/TermsPage';
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
          <Route path={routePaths.gpuServers} element={<ProductPage />} />
          <Route path={routePaths.terms} element={<TermsPage />} />
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
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
    </Routes>
  );
}
