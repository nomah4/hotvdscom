import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useLang, useTranslation, interpolate } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';
import { localizePath, routePaths } from '../i18n/paths';
import { clearPendingTopUp, fetchTopUp, readPendingTopUp, type TopUp } from '../api/balance';
import { formatMoneyMinor } from '../utils/money';

const Panel = styled.div`
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Body = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

// The gateway returns the customer as soon as they finish, but the capture
// reaches Billing over a separate webhook, so `pending` right after the redirect
// is normal rather than a failure. Same figures as CheckoutReturnPage.
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

type Outcome = 'checking' | 'captured' | 'pending' | 'failed' | 'unknown';

function outcomeOf(topUp: TopUp): Outcome {
  if (topUp.status === 'captured') return 'captured';
  if (topUp.status === 'pending') return 'pending';
  return 'failed'; // failed / expired
}

/**
 * Where the gateway returns a customer who was topping up their balance.
 *
 * Reads the top-up back from Billing rather than trusting the query string —
 * the gateway can only say "they came back", not whether money moved.
 */
export function BalanceReturnPage() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [params] = useSearchParams();
  usePageMeta(t.balance.return.meta.title, t.balance.return.meta.description);

  // Captured once via the lazy initializer, not re-derived on every render.
  // readPendingTopUp() and clearPendingTopUp() share a sessionStorage slot and
  // the poll clears it the moment it resolves; re-reading on a later render
  // would then see nothing, flip this to null and re-run the effect's
  // early-exit branch, overwriting a correct "captured" with "unknown". That is
  // exactly the bug CheckoutReturnPage's comment of 2026-07-21 records, found
  // in a real end-to-end payment.
  const [topUpId] = useState(
    () => params.get('top_up_id') ?? params.get('top_up') ?? readPendingTopUp(),
  );

  const [outcome, setOutcome] = useState<Outcome>('checking');
  const [topUp, setTopUp] = useState<TopUp | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (authLoading) return;
    if (!topUpId || !accessToken) {
      setOutcome('unknown');
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const result = await fetchTopUp(accessToken, topUpId);
        if (!active) return;
        setTopUp(result);
        const next = outcomeOf(result);
        setOutcome(next);
        if (next === 'pending' && pollCount.current < MAX_POLLS) {
          pollCount.current += 1;
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (next !== 'pending') {
          // Settled — drop the stash so a later visit does not replay it.
          clearPendingTopUp();
        }
      } catch {
        // Includes the 404 for an id that is not this customer's. Nothing here
        // can say whether the money arrived, so say that and send them to the
        // balance page, where it would be visible if it did.
        if (active) setOutcome('unknown');
      }
    };

    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [topUpId, accessToken, authLoading]);

  const amount = topUp ? formatMoneyMinor(topUp.amount_minor, 'RUB', lang) : '';
  const hasIntent = (topUp?.intent?.length ?? 0) > 0;

  const copy: Record<Outcome, { title: string; body: string }> = {
    checking: { title: t.balance.return.checking, body: '' },
    captured: {
      title: interpolate(t.balance.return.capturedTitle, { amount }),
      // Deliberately not a list of renewed servers: Billing renews from the
      // intent after the capture, asynchronously, so at this moment the honest
      // statement is that it is happening — not that it is done.
      body: hasIntent ? t.balance.return.renewingBody : t.balance.return.capturedBody,
    },
    pending: { title: t.balance.return.pendingTitle, body: t.balance.return.pendingBody },
    failed: { title: t.balance.return.failedTitle, body: t.balance.return.failedBody },
    unknown: { title: t.balance.return.unknownTitle, body: t.balance.return.unknownBody },
  };

  return (
    <DashboardShell>
      <Panel>
        <Title>{copy[outcome].title}</Title>
        {copy[outcome].body && <Body>{copy[outcome].body}</Body>}
        {outcome !== 'checking' && (
          <Actions>
            <Button as={Link} to={localizePath(lang, routePaths.balance)}>
              {t.balance.return.toBalance}
            </Button>
            <Button as={Link} to={localizePath(lang, routePaths.dashboard)} $variant="secondary">
              {t.balance.return.toDashboard}
            </Button>
          </Actions>
        )}
      </Panel>
    </DashboardShell>
  );
}
