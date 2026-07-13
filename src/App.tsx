import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme/theme';
import { GlobalStyle } from './theme/GlobalStyle';
import { AppRoutes } from './routes';
import { ScrollManager } from './components/layout/ScrollManager';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
