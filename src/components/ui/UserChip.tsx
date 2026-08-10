import styled from 'styled-components';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { media } from '../../theme/breakpoints';

/**
 * "Welcome back, <name>" plus the avatar initial — who the visitor is signed in
 * as. Shared by the dashboard top bar and the marketing header so the signed-in
 * identity reads the same on both sides of the site instead of the storefront
 * looking logged-out to someone who isn't.
 *
 * Renders nothing when there is no session: the marketing header mounts for
 * anonymous visitors too, and an empty chip would leave a hole in the row.
 */

const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WelcomeText = styled.span`
  display: none;
  max-width: 24ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};

  ${media.mobile`
    display: inline-block;
  `}
`;

const AdminBadge = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.accent[600]};
  background: ${({ theme }) => theme.colors.accent[50]};
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent[500]};
  color: ${({ theme }) => theme.colors.neutral[0]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export function UserChip({ className }: { className?: string }) {
  const t = useTranslation('dashboard');
  // The dashboard reaches this behind RequireAuth, so `user` is always populated
  // there — the fallback is for the header, which also renders while signed out.
  const { isAuthenticated, displayName, isAdmin } = useAuth();

  if (!isAuthenticated) return null;

  const name = displayName || 'User';

  return (
    <Chip className={className}>
      <WelcomeText>
        {t.topbar.welcome}, {name}
      </WelcomeText>
      {isAdmin && <AdminBadge>{t.topbar.admin}</AdminBadge>}
      <Avatar>{name.charAt(0).toUpperCase()}</Avatar>
    </Chip>
  );
}
