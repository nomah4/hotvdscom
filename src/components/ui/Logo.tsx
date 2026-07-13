import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { localizePath, routePaths } from '../../i18n/paths';

const Wrap = styled(Link)<{ $light?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-size: 1.25rem;
  color: ${({ theme, $light }) => ($light ? theme.colors.neutral[0] : theme.colors.indigo[600])};
`;

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent[500]}, ${({ theme }) => theme.colors.accent[300]});
  color: ${({ theme }) => theme.colors.neutral[0]};
  font-size: 1rem;
`;

export function Logo({ light }: { light?: boolean }) {
  const { lang } = useLang();

  return (
    <Wrap to={localizePath(lang, routePaths.home)} $light={light}>
      <Mark>⚡</Mark>
      hotvds
    </Wrap>
  );
}
