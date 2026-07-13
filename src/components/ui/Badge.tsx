import styled, { css } from 'styled-components';

export type BadgeTone = 'accent' | 'mint' | 'indigo' | 'neutral';

const toneStyles = {
  accent: css`
    background: ${({ theme }) => theme.colors.accent[50]};
    color: ${({ theme }) => theme.colors.accent[600]};
  `,
  mint: css`
    background: ${({ theme }) => theme.colors.mint[100]};
    color: ${({ theme }) => theme.colors.mint[700]};
  `,
  indigo: css`
    background: ${({ theme }) => theme.colors.indigo[50]};
    color: ${({ theme }) => theme.colors.indigo[600]};
  `,
  neutral: css`
    background: ${({ theme }) => theme.colors.neutral[100]};
    color: ${({ theme }) => theme.colors.neutral[700]};
  `,
};

export const Badge = styled.span<{ $tone?: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.h6};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.02em;
  ${({ $tone = 'accent' }) => toneStyles[$tone]}
`;
