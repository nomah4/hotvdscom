import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  /* Anchor targets (e.g. #configurator) must clear the 72px sticky header. */
  section[id] {
    scroll-margin-top: 88px;
  }

  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.body};
    line-height: ${({ theme }) => theme.lineHeights.body};
    color: ${({ theme }) => theme.colors.neutral[900]};
    background: ${({ theme }) => theme.colors.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    color: ${({ theme }) => theme.colors.indigo[600]};
  }

  p {
    margin: 0;
  }

  ul, ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-size: inherit;
  }

  img, svg {
    display: block;
    max-width: 100%;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent[500]};
    outline-offset: 2px;
  }
`;
