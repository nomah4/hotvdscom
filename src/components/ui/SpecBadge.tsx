import styled from 'styled-components';

const Wrap = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.indigo[900]};
  color: ${({ theme }) => theme.colors.neutral[0]};
  white-space: nowrap;
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[200]};
`;

const Value = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.specMono};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

interface SpecBadgeProps {
  label: string;
  value: string;
}

export function SpecBadge({ label, value }: SpecBadgeProps) {
  return (
    <Wrap>
      <Label>{label}</Label>
      <Value>{value}</Value>
    </Wrap>
  );
}
