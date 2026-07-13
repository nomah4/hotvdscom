import { Navigate, Route, Routes } from 'react-router-dom';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { LangGate } from './components/layout/LangGate';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { ProductPage } from './pages/ProductPage';
import { DashboardPage } from './pages/DashboardPage';
import { DEFAULT_LANG, routePaths } from './i18n/paths';

export { routePaths };

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
      <Route path="/:lang" element={<LangGate />}>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
          <Route path={routePaths.pricing} element={<PricingPage />} />
          <Route path={routePaths.gpuServers} element={<ProductPage />} />
        </Route>
        <Route path={routePaths.dashboard} element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
    </Routes>
  );
}
