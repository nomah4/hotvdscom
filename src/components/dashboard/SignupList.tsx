import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../auth/AuthContext';
import { useLang, useTranslation, interpolate } from '../../i18n/LanguageContext';
import { fetchSignups, SignupsPermissionError, type Signup } from '../../api/signups';

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
                  <th>{t.admin.columns.granted}</th>
                </tr>
              </thead>
              <tbody>
                {state.signups.map((signup) => (
                  <tr key={signup.id}>
                    <td>{signup.displayName}</td>
                    <td>{signup.loginName}</td>
                    <td>
                      {signup.grantedAt
                        ? new Date(signup.grantedAt).toLocaleDateString(lang, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
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
