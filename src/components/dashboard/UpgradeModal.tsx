import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';
import { ResourceSliders } from '../pricing/ResourceSliders';
import { resourceRangesFromSchema } from '../pricing/resourceRanges';
import { upgradeErrorMessage } from './upgradeErrors';
import { useAuth } from '../../auth/AuthContext';
import { interpolate, useLang, useTranslation } from '../../i18n/LanguageContext';
import { fetchUpgradePreview, type UpgradePreview, type UpgradeResources } from '../../api/checkout';
import { useConfigurableVds } from '../../api/catalogue';
import { DEFAULT_CURRENCY } from '../../api/config';
import type { Subscription } from '../../api/subscriptions';
import { useBalance } from '../../api/balance';
import { displayPrice, formatMoneyMinor } from '../../utils/money';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 15, 12, 0.5);
  overflow-y: auto;
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 460px;
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

const Sliders = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const TotalSecondary = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.neutral[500]};
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

const OkNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.mint[700]};
`;

const ErrorNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

function currentResources(subscription: Subscription): UpgradeResources | null {
  const configuration = subscription.configuration;
  if (
    configuration?.cpu === undefined ||
    configuration.ram_gb === undefined ||
    configuration.ssd_gb === undefined
  ) {
    return null;
  }
  return { cpu: configuration.cpu, ram_gb: configuration.ram_gb, ssd_gb: configuration.ssd_gb };
}

interface UpgradeModalProps {
  subscription: Subscription;
  /** Название тарифа, отдельной строкой: окно подтверждает списание денег. */
  planName: string;
  /** Имя, которое клиент дал серверу; строка не рисуется, если его нет. */
  serverTitle?: string | null;
  onClose: () => void;
  onConfirm: (customerEmail: string, resources: UpgradeResources, displayedAmountMinor: number) => void;
  isSubmitting: boolean;
  /** Отказ попытки оплаты как есть (код биллинга или код хука); окно переводит его само. */
  submitError: string | null;
}

/**
 * Окно «Увеличить ресурсы».
 *
 * Ползунки не опускаются ниже того, что уже есть у сервера: апгрейд только вверх.
 * Доплату окно не считает — спрашивает у биллинга при каждом движении ползунка,
 * потому что она зависит от остатка оплаченного срока и от правила цены. Пока
 * ответа нет или он отказ, оплатить нельзя: кнопка не должна брать деньги за
 * сумму, которую клиент не видел.
 *
 * Получатель чека подставляется из подтверждённого профиля и редактируется, как
 * в окне продления; личность при этом определяет токен, а не этот адрес.
 */
export function UpgradeModal({
  subscription,
  planName,
  serverTitle = null,
  onClose,
  onConfirm,
  isSubmitting,
  submitError,
}: UpgradeModalProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken, user } = useAuth();
  const { balance } = useBalance();
  const { customPackage } = useConfigurableVds();

  const current = useMemo(() => currentResources(subscription), [subscription]);
  const ranges = useMemo(
    () => resourceRangesFromSchema(customPackage?.schema.dimensions),
    [customPackage],
  );
  const [resources, setResources] = useState<UpgradeResources | null>(current);
  const [preview, setPreview] = useState<UpgradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.profile?.email ?? '');
  // Bumped when the hook reports the price moved while the window was open, so
  // the amount on screen is re-quoted instead of staying the one that was refused.
  const [quoteNonce, setQuoteNonce] = useState(0);

  const changed =
    current !== null &&
    resources !== null &&
    (resources.cpu !== current.cpu ||
      resources.ram_gb !== current.ram_gb ||
      resources.ssd_gb !== current.ssd_gb);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isSubmitting]);

  useEffect(() => {
    if (submitError === 'price_changed') setQuoteNonce((n) => n + 1);
  }, [submitError]);

  // Доплата — у биллинга. Дребезг убран: ползунок отдаёт десятки значений в
  // секунду, и каждое было бы запросом.
  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    if (!accessToken || !changed || !resources) {
      setPreviewLoading(false);
      return;
    }
    let active = true;
    setPreviewLoading(true);
    const timer = window.setTimeout(() => {
      fetchUpgradePreview(accessToken, subscription.subscription_id, resources, DEFAULT_CURRENCY, current)
        .then((result) => {
          if (active) setPreview(result);
        })
        .catch((err: unknown) => {
          if (active) setPreviewError(err instanceof Error ? err.message : 'preview_failed');
        })
        .finally(() => {
          if (active) setPreviewLoading(false);
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accessToken, subscription.subscription_id, resources, changed, current, quoteNonce]);

  const trimmedEmail = email.trim();
  const emailLooksValid = trimmedEmail.includes('@') && !trimmedEmail.includes(' ');
  const balanceCovers =
    balance !== null && preview !== null && balance.amount_minor >= preview.amount_minor;
  const canConfirm =
    changed &&
    preview !== null &&
    !previewLoading &&
    previewError === null &&
    emailLooksValid &&
    !isSubmitting;

  const surcharge = preview ? displayPrice(preview.amount_minor, preview.currency, lang, 'charge') : null;
  const validUntil = subscription.valid_until
    ? new Date(subscription.valid_until).toLocaleDateString(lang, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';
  const diskGrows = changed && current !== null && resources !== null && resources.ssd_gb > current.ssd_gb;

  return (
    <Backdrop
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={t.upgrade.title}>
        <CloseButton type="button" aria-label={t.upgrade.cancel} onClick={onClose} disabled={isSubmitting}>
          ✕
        </CloseButton>

        <Title>{t.upgrade.title}</Title>

        <Rows>
          {serverTitle && serverTitle !== planName && (
            <Row>
              <Key>{t.upgrade.server}</Key>
              <Value>{serverTitle}</Value>
            </Row>
          )}
          <Row>
            <Key>{serverTitle && serverTitle !== planName ? t.upgrade.plan : t.upgrade.server}</Key>
            <Value>{planName}</Value>
          </Row>
          <Row>
            <Key>{t.upgrade.validUntil}</Key>
            <Value>{validUntil}</Value>
          </Row>
        </Rows>

        {current && resources ? (
          <Sliders>
            <ResourceSliders
              value={resources}
              floor={current}
              ranges={ranges}
              labels={{ cpu: t.upgrade.cpu, ram_gb: t.upgrade.ram, ssd_gb: t.upgrade.ssd }}
              nowLabel={(value) => interpolate(t.upgrade.now, { value: String(value) })}
              disabled={isSubmitting}
              onChange={setResources}
            />
          </Sliders>
        ) : null}

        {!changed && <Note>{t.upgrade.pickMore}</Note>}

        {changed && (
          <Rows>
            <TotalRow>
              <Key>{t.upgrade.surcharge}</Key>
              <TotalValue>
                {previewError ? (
                  t.upgrade.amountUnavailable
                ) : surcharge ? (
                  <>
                    <span>{surcharge.primary}</span>
                    {surcharge.secondary && <TotalSecondary>{surcharge.secondary}</TotalSecondary>}
                  </>
                ) : (
                  t.upgrade.amountLoading
                )}
              </TotalValue>
            </TotalRow>
            {preview && (
              <>
                <Row>
                  <Key>{t.upgrade.renewalNow}</Key>
                  <Value>
                    {formatMoneyMinor(preview.current_renewal_amount_minor, preview.currency, lang)}
                  </Value>
                </Row>
                <Row>
                  <Key>{t.upgrade.renewalAfter}</Key>
                  <Value>{formatMoneyMinor(preview.renewal_amount_minor, preview.currency, lang)}</Value>
                </Row>
              </>
            )}
          </Rows>
        )}
        {changed && <Note>{t.upgrade.surchargeHint}</Note>}

        <Note>{t.upgrade.rebootWarning}</Note>
        {diskGrows && <Note>{t.upgrade.diskNote}</Note>}

        <Field>
          {t.upgrade.emailLabel}
          <EmailInput
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Note>{t.upgrade.emailHint}</Note>

        {balanceCovers && balance && (
          <OkNote>
            {interpolate(t.upgrade.fromBalance, {
              amount: formatMoneyMinor(balance.amount_minor, balance.currency, lang),
            })}
          </OkNote>
        )}

        {previewError && <ErrorNote>{upgradeErrorMessage(previewError, t.upgrade)}</ErrorNote>}
        {submitError && <ErrorNote>{upgradeErrorMessage(submitError, t.upgrade)}</ErrorNote>}

        <Actions>
          <Button type="button" $variant="secondary" $fullWidth onClick={onClose} disabled={isSubmitting}>
            {t.upgrade.cancel}
          </Button>
          <Button
            type="button"
            $fullWidth
            disabled={!canConfirm}
            onClick={() => {
              if (resources && preview) onConfirm(trimmedEmail, resources, preview.amount_minor);
            }}
          >
            {isSubmitting
              ? t.subscriptions.renewing
              : balanceCovers
                ? t.upgrade.confirmFromBalance
                : t.upgrade.confirm}
          </Button>
        </Actions>
      </Card>
    </Backdrop>
  );
}
