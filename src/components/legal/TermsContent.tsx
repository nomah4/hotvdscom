import styled from 'styled-components';
import { useTranslation } from '../../i18n/LanguageContext';

// Deliberately loud. These terms are not real yet, and nobody — customer,
// colleague, or a future session of ours — should be able to mistake this for a
// document that has been reviewed and is in force.
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

const ClauseTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const Placeholder = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * The terms themselves — draft banner plus one block per clause.
 *
 * Extracted from TermsPage so the checkout modal and the /terms route render the
 * *same* text from the same source. Two copies of a document the customer
 * formally accepts is exactly the kind of drift that ends with the modal saying
 * one thing and the page another.
 *
 * Headings are h3 so they nest correctly under either host: the page supplies an
 * h1 title, the modal an h2.
 */
export function TermsContent() {
  const t = useTranslation('legal');

  return (
    <Wrap>
      <DraftBanner>{t.terms.draftWarning}</DraftBanner>
      {t.terms.sections.map((section) => (
        <Clause key={section.heading}>
          <ClauseTitle>{section.heading}</ClauseTitle>
          <Placeholder>{section.placeholder}</Placeholder>
        </Clause>
      ))}
    </Wrap>
  );
}
