import styled from 'styled-components';
import { Link, useLocation } from 'react-router';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { localizePath, routePaths } from '../../i18n/paths';
import { media } from '../../theme/breakpoints';

const Wrap = styled.aside`
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.indigo[900]};
  overflow-x: auto;

  ${media.laptop`
    flex-direction: column;
    width: 240px;
    flex-shrink: 0;
    height: fit-content;
    padding: 16px;
  `}
`;

const Item = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : theme.colors.indigo[200])};
  background: ${({ theme, $active }) => ($active ? theme.colors.indigo[700] : 'transparent')};
  white-space: nowrap;
`;

// An entry with no `to` has no page behind it yet. It stays rendered but
// visibly inert rather than silently doing nothing when clicked — Billing and
// Settings are in that state, tracked separately from this component.
const InertItem = styled(Item)`
  opacity: 0.45;
  cursor: not-allowed;
`;

export function Sidebar() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();

  const items: { label: string; icon: string; to?: string }[] = [
    { label: t.sidebar.instances, icon: '🖥️', to: localizePath(lang, routePaths.dashboard) },
    { label: t.sidebar.billing, icon: '💳' },
    { label: t.sidebar.settings, icon: '⚙️' },
  ];

  if (isAdmin) {
    items.push({ label: t.sidebar.admin, icon: '👥', to: localizePath(lang, routePaths.admin) });
  }

  return (
    <Wrap>
      {items.map((item) =>
        item.to ? (
          <Item key={item.label} as={Link} to={item.to} $active={pathname === item.to}>
            <span>{item.icon}</span>
            {item.label}
          </Item>
        ) : (
          <InertItem key={item.label} type="button" disabled>
            <span>{item.icon}</span>
            {item.label}
          </InertItem>
        ),
      )}
    </Wrap>
  );
}
