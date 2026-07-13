import styled from 'styled-components';
import { media } from '../../theme/breakpoints';

export const PageContainer = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding-inline: 20px;

  ${media.tablet`
    padding-inline: 32px;
  `}

  ${media.desktop`
    padding-inline: 40px;
  `}
`;
