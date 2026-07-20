import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
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

// Deliberately loud. These terms are not real yet, and nobody — customer,
// colleague, or a future session of ours — should be able to mistake this page
// for a document that has been reviewed and is in force.
const DraftBanner = styled.div`
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const Clause = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ClauseTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const Placeholder = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
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
 */
export function TermsPage() {
  const t = useTranslation('legal');

  usePageMeta(t.meta.title, t.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <Title>{t.terms.title}</Title>
          <DraftBanner>{t.terms.draftWarning}</DraftBanner>
          {t.terms.sections.map((section) => (
            <Clause key={section.heading}>
              <ClauseTitle>{section.heading}</ClauseTitle>
              <Placeholder>{section.placeholder}</Placeholder>
            </Clause>
          ))}
        </Wrap>
      </PageContainer>
    </Section>
  );
}
