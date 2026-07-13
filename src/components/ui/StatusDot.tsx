import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Dot = styled.span<{ $status: InstanceStatus }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $status }) =>
    $status === 'online'
      ? theme.colors.mint[500]
      : $status === 'degraded'
        ? theme.colors.semantic.warning
        : theme.colors.neutral[400]};
  box-shadow: ${({ $status }) => ($status === 'online' ? '0 0 0 4px rgba(34, 196, 134, 0.15)' : 'none')};
`;

interface StatusDotProps {
  status: InstanceStatus;
  label: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <Wrap>
      <Dot $status={status} aria-hidden />
      {label}
    </Wrap>
  );
}
