import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';
import { fetchInvoice, type Invoice } from '../api/checkout';
import { clearPendingInvoice, readPendingInvoice } from '../api/useCheckout';

const Panel = styled.div`
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  justify-content: center;
  margin-top: 8px;
`;

// The gateway sends the customer back as soon as they finish, but the capture
// reaches Billing over a separate webhook, so `pending_payment` right after the
// redirect is normal rather than a failure. Poll briefly before giving up.
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

type Outcome = 'checking' | 'paid' | 'pending' | 'failed';

function outcomeOf(invoice: Invoice): Outcome {
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'pending_payment' || invoice.status === 'draft') return 'pending';
  return 'failed'; // expired / cancelled / voided
}

/**
 * Where the payment gateway returns the customer. Reads the invoice back from
 * Billing rather than trusting anything in the query string — the gateway can
 * only say "they came back", not whether money moved.
 */
export function CheckoutReturnPage() {
  const t = useTranslation('pricing');
  const { lang } = useLang();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [params] = useSearchParams();
  // Prefer the query string if a gateway ever echoes one back, but the reliable
  // source is what checkout stashed before handing the customer over.
  const invoiceId = params.get('invoice_id') ?? params.get('invoice') ?? readPendingInvoice();

  const [outcome, setOutcome] = useState<Outcome>('checking');
  const pollCount = useRef(0);

  useEffect(() => {
    if (authLoading) return;
    if (!invoiceId || !accessToken) {
      setOutcome('failed');
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const invoice = await fetchInvoice(accessToken, invoiceId);
        if (!active) return;
        const next = outcomeOf(invoice);
        setOutcome(next);
        // Keep asking only while the answer can still change.
        if (next === 'pending' && pollCount.current < MAX_POLLS) {
          pollCount.current += 1;
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (next !== 'pending') {
          // Settled — drop the stash so a later visit to this page does not
          // replay a finished purchase.
          clearPendingInvoice();
        }
      } catch {
        if (active) setOutcome('failed');
      }
    };

    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [invoiceId, accessToken, authLoading]);

  const copy = {
    checking: { title: t.checkout.checking, body: '' },
    paid: { title: t.checkout.paidTitle, body: t.checkout.paidBody },
    pending: { title: t.checkout.pendingTitle, body: t.checkout.pendingBody },
    failed: { title: t.checkout.failedTitle, body: t.checkout.failedBody },
  }[outcome];

  return (
    <Section $background="secondary">
      <PageContainer>
        <Panel>
          <Title>{copy.title}</Title>
          {copy.body && <Body>{copy.body}</Body>}
          {outcome !== 'checking' && (
            <Actions>
              {outcome === 'paid' ? (
                <Button as={Link} to={localizePath(lang, routePaths.dashboard)}>
                  {t.checkout.toDashboard}
                </Button>
              ) : (
                <Button as={Link} to={localizePath(lang, routePaths.pricing)} $variant="secondary">
                  {t.checkout.backToPricing}
                </Button>
              )}
            </Actions>
          )}
        </Panel>
      </PageContainer>
    </Section>
  );
}
