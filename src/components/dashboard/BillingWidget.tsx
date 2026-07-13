import styled from 'styled-components';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n/LanguageContext';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.h5};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const RowLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Balance = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.75rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const NextInvoice = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

export function BillingWidget() {
  const t = useTranslation('dashboard');

  return (
    <Card>
      <Title>{t.billing.title}</Title>
      <Row>
        <RowLabel>{t.billing.balance}</RowLabel>
        <Balance>$48.20</Balance>
      </Row>
      <Row>
        <RowLabel>{t.billing.nextInvoice}</RowLabel>
        <NextInvoice>1 авг · $28.00</NextInvoice>
      </Row>
      <Button $fullWidth>{t.billing.topUp}</Button>
    </Card>
  );
}
