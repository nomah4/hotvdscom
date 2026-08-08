import styled from 'styled-components';
import { PlaceholderSections } from '../content/PlaceholderSections';
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
 * h1 title, the modal an h2. That is PlaceholderSections' default, which renders
 * the clauses here — the banner is what stays local, because it is calibrated to
 * a document the customer formally accepts and does not belong on an ordinary
 * unfinished page.
 */
export function TermsContent() {
  const t = useTranslation('legal');

  return (
    <Wrap>
      <DraftBanner>{t.terms.draftWarning}</DraftBanner>
      <PlaceholderSections sections={t.terms.sections} />
    </Wrap>
  );
}
