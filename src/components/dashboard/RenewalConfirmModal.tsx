import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { fetchRenewalPreview, type RenewalPreview } from '../../api/checkout';
import { DEFAULT_CURRENCY } from '../../api/config';
import type { Subscription } from '../../api/subscriptions';
import { formatMoneyMinor } from '../../utils/money';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 15, 12, 0.5);
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 32px 28px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Rows = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const Key = styled.dt`
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Value = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral[900]};
  text-align: right;
`;

const TotalRow = styled(Row)`
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  font-size: ${({ theme }) => theme.fontSizes.body};
`;

const TotalValue = styled(Value)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const EmailInput = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[900]};
  font-size: ${({ theme }) => theme.fontSizes.body};

  &:disabled {
    background: ${({ theme }) => theme.colors.neutral[100]};
  }
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const ErrorNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

interface RenewalConfirmModalProps {
  subscription: Subscription;
  /**
   * Название тарифа. Всегда показывается отдельной строкой, даже когда сервер
   * назван клиентом: это окно подтверждает **списание денег**, и «prod-api-01»
   * в нём не отвечает на вопрос, за что платят.
   */
  planName: string;
  /** Имя клиента, если он его дал. Иначе строка не рисуется. */
  serverTitle?: string | null;
  onClose: () => void;
  onConfirm: (customerEmail: string) => void;
  /** True from the moment the parent starts opening the invoice. */
  isSubmitting: boolean;
  /** Failure from the parent's renew attempt, already translated. */
  submitError: string | null;
}

/**
 * Confirmation step for renewing one server.
 *
 * It exists for the same reason the first purchase has a confirmation page: the
 * renew control used to charge money straight off a click, with the customer
 * never shown a total. `SubscriptionListItem` makes the expiry date itself the
 * control, and its own comment names the problem — "a date that silently charges
 * money". This is the step that stops it being silent.
 *
 * It also carries the receipt address, which is not cosmetic: on a fiscalized
 * install (YooKassa, 54-FZ) the gateway refuses a payment that has nowhere to
 * send the receipt, and Billing surfaces that refusal as a 502. Renewal sent no
 * address at all until 2026-08-09, so every attempt failed.
 *
 * The address is prefilled from the ID token's verified profile and editable —
 * a customer may want the receipt to go to accounting rather than to themselves.
 * Editing it is safe: identity comes from the token subject, which Billing checks
 * itself, so a changed address can only redirect a receipt, never reach another
 * user's subscription. It is deliberately not persisted; the next renewal starts
 * from the verified profile again.
 */
export function RenewalConfirmModal({
  subscription,
  planName,
  serverTitle = null,
  onClose,
  onConfirm,
  isSubmitting,
  submitError,
}: RenewalConfirmModalProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken, user } = useAuth();

  const [preview, setPreview] = useState<RenewalPreview | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [email, setEmail] = useState(user?.profile?.email ?? '');

  // Escape closes, matching AuthPromptModal. Not while submitting: the customer
  // is about to be handed to the gateway and closing would leave them unsure
  // whether the payment was opened.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isSubmitting]);

  // The amount comes from Billing, never from the catalogue: a configurable
  // package has no catalogue price at all, and `GET /subscriptions` carries no
  // money data. Read-only — the preview creates nothing.
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setPreviewError(false);
    fetchRenewalPreview(accessToken, subscription.subscription_id, DEFAULT_CURRENCY)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch(() => {
        if (active) setPreviewError(true);
      });
    return () => {
      active = false;
    };
  }, [accessToken, subscription.subscription_id]);

  const trimmedEmail = email.trim();
  // Deliberately shallow: the gateway and the mail server are the real judges of
  // an address, and a stricter pattern here would reject valid ones. This only
  // catches an obviously unusable value before it costs a round trip.
  const emailLooksValid = trimmedEmail.includes('@') && !trimmedEmail.includes(' ');
  const canConfirm = preview !== null && emailLooksValid && !isSubmitting;

  const validUntil = subscription.valid_until
    ? new Date(subscription.valid_until).toLocaleDateString(lang, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <Backdrop
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={t.renewal.title}>
        <CloseButton type="button" aria-label={t.renewal.cancel} onClick={onClose} disabled={isSubmitting}>
          ✕
        </CloseButton>

        <Title>{t.renewal.title}</Title>

        <Rows>
          {serverTitle && serverTitle !== planName && (
            <Row>
              <Key>{t.renewal.server}</Key>
              <Value>{serverTitle}</Value>
            </Row>
          )}
          <Row>
            <Key>{serverTitle && serverTitle !== planName ? t.renewal.plan : t.renewal.server}</Key>
            <Value>{planName}</Value>
          </Row>
          <Row>
            <Key>{t.renewal.currentlyValidUntil}</Key>
            <Value>{validUntil}</Value>
          </Row>
          <TotalRow>
            <Key>{t.renewal.amount}</Key>
            <TotalValue>
              {previewError
                ? t.renewal.amountUnavailable
                : preview
                  ? formatMoneyMinor(preview.amount_minor, preview.currency, lang)
                  : t.renewal.amountLoading}
            </TotalValue>
          </TotalRow>
        </Rows>

        <Field>
          {t.renewal.emailLabel}
          <EmailInput
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Note>{t.renewal.emailHint}</Note>

        {previewError && <ErrorNote>{t.renewal.previewFailed}</ErrorNote>}
        {submitError && <ErrorNote>{submitError}</ErrorNote>}

        <Actions>
          <Button type="button" $variant="secondary" $fullWidth onClick={onClose} disabled={isSubmitting}>
            {t.renewal.cancel}
          </Button>
          <Button type="button" $fullWidth disabled={!canConfirm} onClick={() => onConfirm(trimmedEmail)}>
            {isSubmitting ? t.subscriptions.renewing : t.renewal.confirm}
          </Button>
        </Actions>
      </Card>
    </Backdrop>
  );
}
