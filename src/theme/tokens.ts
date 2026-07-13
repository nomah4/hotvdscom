export const colors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F5F2',
    tertiary: '#FDF3EC',
  },
  accent: {
    50: '#FFF3EC',
    100: '#FFE1D0',
    200: '#FFC4A1',
    300: '#FFA06B',
    400: '#FF7A45',
    500: '#FF5A1F',
    600: '#E64A12',
    700: '#C23D0D',
  },
  indigo: {
    50: '#EEF0FA',
    100: '#D7DBF2',
    200: '#AFB6E4',
    400: '#4B4FA8',
    500: '#383C9E',
    600: '#2E3192',
    700: '#242570',
    800: '#1C1E5C',
    900: '#12143D',
  },
  mint: {
    100: '#DFFAEF',
    200: '#B7F1DA',
    400: '#3DDC97',
    500: '#22C486',
    600: '#1BA571',
    700: '#16915F',
  },
  neutral: {
    0: '#FFFFFF',
    100: '#F4F3F1',
    200: '#E7E5E1',
    300: '#D3D0C9',
    400: '#B4B1AA',
    500: '#948F85',
    600: '#746F66',
    700: '#544F47',
    800: '#3A362F',
    900: '#211E19',
  },
  semantic: {
    success: '#22C486',
    warning: '#FFB020',
    error: '#E5484D',
    info: '#4B4FA8',
  },
} as const;

export const fonts = {
  heading: "'Manrope', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const fontSizes = {
  h1: 'clamp(2.5rem, 5vw, 3.5rem)',
  h2: '2.25rem',
  h3: '1.5rem',
  h4: '1.25rem',
  h5: '1.0625rem',
  h6: '0.875rem',
  body: '1rem',
  small: '0.875rem',
  specMono: '0.9375rem',
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const lineHeights = {
  h1: 1.1,
  h2: 1.15,
  h3: 1.25,
  h4: 1.3,
  body: 1.6,
  tight: 1,
};

export const space = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
  10: '128px',
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px',
};

export const shadows = {
  sm: '0 1px 2px rgba(33, 30, 25, 0.06)',
  md: '0 4px 12px rgba(33, 30, 25, 0.08)',
  lg: '0 12px 32px rgba(33, 30, 25, 0.10)',
  accentGlow: '0 8px 24px rgba(255, 90, 31, 0.25)',
};

export const breakpointValues = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
};

export const zIndices = {
  header: 100,
  mobileNav: 200,
  overlay: 300,
};
