import styled from 'styled-components';
import type { AppTheme } from '../../theme/theme';

export type SectionBackground = 'primary' | 'secondary' | 'tertiary' | 'indigo' | 'accent';

const bgMap: Record<SectionBackground, (theme: AppTheme) => string> = {
  primary: (theme) => theme.colors.background.primary,
  secondary: (theme) => theme.colors.background.secondary,
  tertiary: (theme) => theme.colors.background.tertiary,
  indigo: (theme) => theme.colors.indigo[900],
  accent: (theme) => theme.colors.accent[500],
};

export const Section = styled.section<{ $background?: SectionBackground }>`
  padding-block: ${({ theme }) => theme.space[7]};
  background: ${({ theme, $background = 'primary' }) => bgMap[$background](theme)};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    padding-block: ${({ theme }) => theme.space[8]};
  }
`;
