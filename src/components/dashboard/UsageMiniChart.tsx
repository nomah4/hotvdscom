import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 32px;
`;

const Bar = styled.div<{ $height: number }>`
  width: 5px;
  height: ${({ $height }) => $height}%;
  min-height: 3px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.mint[400]};
`;

interface UsageMiniChartProps {
  data: number[];
}

export function UsageMiniChart({ data }: UsageMiniChartProps) {
  const max = Math.max(...data, 1);

  return (
    <Wrap>
      {data.map((value, i) => (
        <Bar key={i} $height={(value / max) * 100} />
      ))}
    </Wrap>
  );
}
