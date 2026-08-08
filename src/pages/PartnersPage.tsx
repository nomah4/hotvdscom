import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { PlaceholderSections } from '../components/content/PlaceholderSections';
import { useTranslation } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

/**
 * Scaffold for the partner programme.
 *
 * Commission rates and joining terms are commercial commitments — a partner who
 * signs up against invented numbers has been misled, and the numbers are not
 * ours to invent. Structure now, terms from Victor.
 */
export function PartnersPage() {
  const t = useTranslation('company');

  usePageMeta(t.partners.meta.title, t.partners.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.partners.title} lead={t.partners.intro} />
          <PlaceholderSections sections={t.partners.sections} />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
