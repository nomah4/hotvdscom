import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { TermsContent } from '../components/legal/TermsContent';
import { useTranslation } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

/**
 * Scaffold for the Terms of Service.
 *
 * The checkout confirmation asks the customer to accept terms, so the link has
 * to lead somewhere real. The clause *text*, however, is a binding legal
 * document for a company selling VDS in Russia — оферта, 152-ФЗ (personal
 * data), 54-ФЗ (fiscal receipts), refund and SLA commitments — and is Victor's
 * to write. Plausible-looking invented clauses would be worse than none,
 * because they read as settled.
 *
 * So: real route, real structure, and a placeholder per section in the style of
 * deploy/prod.env.template's __SET__ markers. The RU heading beside each one is
 * there to help whoever fills this in.
 *
 * The clause list itself lives in TermsContent, shared with the checkout dialog —
 * this route remains the document's permanent address (linked from elsewhere,
 * bookmarkable, and what an offer that binds on acceptance needs).
 */
export function TermsPage() {
  const t = useTranslation('legal');

  usePageMeta(t.meta.title, t.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <Title>{t.terms.title}</Title>
          <TermsContent />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
