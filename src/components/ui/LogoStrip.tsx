import styled from 'styled-components';

const Strip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 32px;
  opacity: 0.6;
`;

const LogoText = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
  letter-spacing: -0.02em;
`;

const names = ['Fintra', 'ShopEasy', 'Nordwind', 'Cloudora', 'Beryllium'];

export function LogoStrip() {
  return (
    <Strip>
      {names.map((name) => (
        <LogoText key={name}>{name}</LogoText>
      ))}
    </Strip>
  );
}
