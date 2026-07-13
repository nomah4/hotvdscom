import styled from 'styled-components';
import { Badge } from './Badge';

const Wrap = styled.div<{ $align: 'left' | 'center' }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-start')};
  text-align: ${({ $align }) => $align};
  max-width: 640px;
  margin: ${({ $align }) => ($align === 'center' ? '0 auto' : '0')};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h2};
  line-height: ${({ theme }) => theme.lineHeights.h2};
`;

const Subtitle = styled.p`
  font-size: 1.0625rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: SectionHeadingProps) {
  return (
    <Wrap $align={align}>
      {eyebrow && <Badge $tone="accent">{eyebrow}</Badge>}
      <Title>{title}</Title>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Wrap>
  );
}
