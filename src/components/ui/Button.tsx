import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: 10px 18px;
    font-size: ${({ theme }) => theme.fontSizes.small};
  `,
  md: css`
    padding: 14px 24px;
    font-size: ${({ theme }) => theme.fontSizes.body};
  `,
  lg: css`
    padding: 18px 32px;
    font-size: 1.0625rem;
  `,
};

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.accent[500]};
    color: ${({ theme }) => theme.colors.neutral[0]};
    box-shadow: ${({ theme }) => theme.shadows.accentGlow};
    border: 1px solid transparent;

    &:hover {
      background: ${({ theme }) => theme.colors.accent[600]};
    }
  `,
  secondary: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.indigo[600]};
    border: 1.5px solid ${({ theme }) => theme.colors.indigo[200]};

    &:hover {
      background: ${({ theme }) => theme.colors.indigo[50]};
      border-color: ${({ theme }) => theme.colors.indigo[400]};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.indigo[600]};
    border: 1px solid transparent;

    &:hover {
      background: ${({ theme }) => theme.colors.neutral[100]};
    }
  `,
};

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  border-radius: ${({ theme }) => theme.radii.pill};
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  white-space: nowrap;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  ${({ $size = 'md' }) => sizeStyles[$size]}
  ${({ $variant = 'primary' }) => variantStyles[$variant]}

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
