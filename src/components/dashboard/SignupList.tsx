import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../auth/AuthContext';
import { useLang, useTranslation, interpolate } from '../../i18n/LanguageContext';
import { fetchSignups, SignupsPermissionError, type Signup } from '../../api/signups';
import { BILLING_API_BASE, PROJECT_CODE, TENANT_ID } from '../../api/config';

// Billing has no login/session tied to ZITADEL — this just deep-links into
// bl's own separate admin panel (its own login, its own credentials) with the
// user's ZITADEL id pre-filled, instead of making the viewer copy it by hand
// from the ZITADEL console. Billing's admin search returns subscription
// status/history only, no money fields, so the link itself carries no
// financial data.
function billingLookupUrl(userId: string): string {
  const params = new URLSearchParams({
    external_user_id: userId,
    tenant_id: TENANT_ID,
    project_code: PROJECT_CODE,
  });
  return `${BILLING_API_BASE}/admin/ui/subscriptions?${params.toString()}`;
}

const Card = styled.section`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 24px;
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Subtitle = styled.p`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const Note = styled.p`
  margin-top: 16px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// Wide content must scroll inside its own container rather than pushing the
// dashboard layout sideways on a phone.
const TableScroll = styled.div`
  margin-top: 16px;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.small};
  white-space: nowrap;

  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  }

  th {
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.neutral[700]};
  }

  td {
    color: ${({ theme }) => theme.colors.neutral[900]};
  }
`;

const Count = styled.p`
  margin-top: 12px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

type State =
  | { status: 'loading' }
  | { status: 'ready'; signups: Signup[] }
  | { status: 'forbidden' }
  | { status: 'error' };

export function SignupList() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();

    fetchSignups(accessToken, controller.signal)
      .then((signups) => setState({ status: 'ready', signups }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: err instanceof SignupsPermissionError ? 'forbidden' : 'error' });
      });

    return () => controller.abort();
  }, [accessToken]);

  return (
    <Card>
      <Title>{t.admin.title}</Title>
      <Subtitle>{t.admin.subtitle}</Subtitle>

      {state.status === 'loading' && <Note>{t.admin.loading}</Note>}
      {state.status === 'forbidden' && <Note>{t.admin.forbidden}</Note>}
      {state.status === 'error' && <Note>{t.admin.error}</Note>}
      {state.status === 'ready' && state.signups.length === 0 && <Note>{t.admin.empty}</Note>}

      {state.status === 'ready' && state.signups.length > 0 && (
        <>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>{t.admin.columns.user}</th>
                  <th>{t.admin.columns.login}</th>
                  <th>{t.admin.columns.roles}</th>
                  <th>{t.admin.columns.granted}</th>
                  <th>{t.admin.columns.billing}</th>
                </tr>
              </thead>
              <tbody>
                {state.signups.map((signup) => (
                  <tr key={signup.id}>
                    <td>{signup.displayName}</td>
                    <td>{signup.loginName}</td>
                    <td>{signup.roles.length > 0 ? signup.roles.join(', ') : '—'}</td>
                    <td>
                      {signup.grantedAt
                        ? new Date(signup.grantedAt).toLocaleDateString(lang, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      {signup.userId && (
                        <a href={billingLookupUrl(signup.userId)} target="_blank" rel="noopener noreferrer">
                          {t.admin.viewBilling}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
          <Count>{interpolate(t.admin.count, { count: state.signups.length })}</Count>
        </>
      )}
    </Card>
  );
}
