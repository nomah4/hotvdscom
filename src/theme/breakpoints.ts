import { css } from 'styled-components';
import { breakpointValues } from './tokens';

type MediaFn = typeof css;

function makeMedia(minWidth: number) {
  return (strings: TemplateStringsArray, ...interpolations: Parameters<MediaFn>[1][]) => css`
    @media (min-width: ${minWidth}px) {
      ${css(strings, ...interpolations)}
    }
  `;
}

export const media = {
  mobile: makeMedia(breakpointValues.mobile),
  tablet: makeMedia(breakpointValues.tablet),
  laptop: makeMedia(breakpointValues.laptop),
  desktop: makeMedia(breakpointValues.desktop),
};
