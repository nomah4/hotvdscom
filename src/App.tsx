import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme/theme';
import { GlobalStyle } from './theme/GlobalStyle';
import { AppRoutes } from './routes';
import { ScrollManager } from './components/layout/ScrollManager';
import { AuthProvider } from './auth/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        {/* Inside the router (login needs its navigation) but outside AppRoutes, so
            /callback — which sits above the :lang gate — shares the same session.
            The sign-in modal is mounted further down, inside LangGate, because it
            renders translated copy and useTranslation throws outside that provider. */}
        <AuthProvider>
          <ScrollManager />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
