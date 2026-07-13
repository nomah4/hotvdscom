import styled from 'styled-components';
import { useTranslation } from '../../i18n/LanguageContext';
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

export function Sidebar() {
  const t = useTranslation('dashboard');

  const items = [
    { label: t.sidebar.instances, icon: '🖥️', active: true },
    { label: t.sidebar.billing, icon: '💳', active: false },
    { label: t.sidebar.settings, icon: '⚙️', active: false },
  ];

  return (
    <Wrap>
      {items.map((item) => (
        <Item key={item.label} type="button" $active={item.active}>
          <span>{item.icon}</span>
          {item.label}
        </Item>
      ))}
    </Wrap>
  );
}
