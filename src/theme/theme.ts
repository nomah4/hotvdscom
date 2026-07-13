import {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  space,
  radii,
  shadows,
  breakpointValues,
  zIndices,
} from './tokens';

export const theme = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  space,
  radii,
  shadows,
  breakpoints: breakpointValues,
  zIndices,
};

export type AppTheme = typeof theme;
