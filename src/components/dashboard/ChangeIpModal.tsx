import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { requestIpChangeOffer, type IpChangeOffer } from '../../api/subscriptions';

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
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.neutral[900]};
  text-align: right;
`;

// Старый адрес зачёркнут: строкой ниже стоит новый, и без разметки две почти
// одинаковые строки цифр читаются как опечатка, а не как «было — стало».
const OldValue = styled(Value)`
  color: ${({ theme }) => theme.colors.neutral[500]};
  text-decoration: line-through;
`;

// То, ради чего окно открыто. Единственное место на экране, где адрес набран
// крупно: его переписывают в DNS и в белые списки, и прочитать его надо с
// первого раза.
const NextRow = styled(Row)`
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  font-size: ${({ theme }) => theme.fontSizes.body};
`;

const NextValue = styled(Value)`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  user-select: all;
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// Перезагрузка и недельный лимит — не мелкий шрифт под кнопкой: оба меняют
// решение, и узнать о них после нажатия поздно.
const Warning = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.warning};
`;

const ErrorNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

interface ChangeIpModalProps {
  subscriptionId: string;
  /** Текущий адрес с карточки. Показывается, пока предложение в пути. */
  currentIp?: string | null;
  onClose: () => void;
  onConfirm: (address: string) => void;
  /** True с момента, когда родитель отправил смену. */
  isSubmitting: boolean;
  /** Отказ от попытки родителя, уже переведённый. */
  submitError: string | null;
}

/**
 * Подтверждение смены белого адреса.
 *
 * Окно, а не второе нажатие на кнопке, как у удаления: подтверждать нужно не
 * намерение, а конкретный адрес. Смена ломает всё, что указывает на старый —
 * записи DNS, белые списки, чужие фаерволы, — и клиент должен увидеть новый
 * адрес до нажатия, а не искать его потом на карточке.
 *
 * Адрес приходит от движка, которому принадлежит пул, и придержан там до
 * подтверждения. Витрина его не выбирает и не проверяет: свободен адрес или
 * нет — знание локации, а не браузера.
 */
export function ChangeIpModal({
  subscriptionId,
  currentIp = null,
  onClose,
  onConfirm,
  isSubmitting,
  submitError,
}: ChangeIpModalProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken } = useAuth();

  const [offer, setOffer] = useState<IpChangeOffer | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Escape закрывает, как и в остальных окнах кабинета. Не во время отправки:
  // машина в этот момент уже перенастраивается, и закрытое окно оставило бы
  // клиента в неведении, случилась смена или нет.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isSubmitting]);

  // Адрес спрашивается при открытии окна, а не вместе со списком серверов:
  // движок придерживает названный адрес, и запрошенный впрок на каждую карточку
  // вычитал бы из пула по адресу за каждое открытие кабинета.
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setOfferError(null);
    requestIpChangeOffer(accessToken, subscriptionId)
      .then((result) => {
        if (active) setOffer(result);
      })
      .catch((err: unknown) => {
        if (active) setOfferError(err instanceof Error ? err.message : 'ip_offer_failed');
      });
    return () => {
      active = false;
    };
  }, [accessToken, subscriptionId]);

  /**
   * Отказ в подборе адреса, разобранный по причинам.
   *
   * Три причины стоят своего текста: кончившийся пул — не вина клиента и
   * лечится не повтором; лимит называет дату; всё остальное — обычное «не
   * вышло». Общее сообщение на все три отправило бы клиента нажимать ту же
   * кнопку.
   */
  const offerMessage = !offerError
    ? null
    : offerError.startsWith('ip_change_rate_limited')
      ? t.changeIp.rateLimited
      : offerError.startsWith('no_public_ip')
        ? t.changeIp.poolExhausted
        : t.changeIp.offerFailed;

  const expiresAt = offer?.expires_at
    ? new Date(offer.expires_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
    : null;

  const canConfirm = offer !== null && !isSubmitting;

  return (
    <Backdrop
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={t.changeIp.title}>
        <CloseButton type="button" aria-label={t.changeIp.cancel} onClick={onClose} disabled={isSubmitting}>
          ✕
        </CloseButton>

        <Title>{t.changeIp.title}</Title>

        <Rows>
          <Row>
            <Key>{t.changeIp.currentIp}</Key>
            <OldValue>{offer?.current_ip ?? currentIp ?? '—'}</OldValue>
          </Row>
          <NextRow>
            <Key>{t.changeIp.nextIp}</Key>
            <NextValue>{offer ? offer.next_ip : offerMessage ? '—' : t.changeIp.picking}</NextValue>
          </NextRow>
        </Rows>

        {/* Обе строки — про последствия, а не про порядок действий: машина
            уйдёт в перезагрузку, и следующей смены не будет неделю. */}
        <Warning>{t.changeIp.rebootWarning}</Warning>
        <Note>{t.changeIp.limitNote}</Note>
        {expiresAt && <Note>{t.changeIp.offerExpires.replace('{time}', expiresAt)}</Note>}

        {offerMessage && <ErrorNote>{offerMessage}</ErrorNote>}
        {submitError && <ErrorNote>{submitError}</ErrorNote>}

        <Actions>
          <Button type="button" $variant="secondary" $fullWidth onClick={onClose} disabled={isSubmitting}>
            {t.changeIp.cancel}
          </Button>
          <Button
            type="button"
            $fullWidth
            disabled={!canConfirm}
            onClick={() => offer && onConfirm(offer.next_ip)}
          >
            {isSubmitting ? t.changeIp.changing : t.changeIp.confirm}
          </Button>
        </Actions>
      </Card>
    </Backdrop>
  );
}
