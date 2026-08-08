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
 * Scaffold for the contact details.
 *
 * The single page behind BOTH footer entrances — "Контакты" under Company and
 * "Связаться с нами" under Support. Two links, one address: a second route would
 * be two sets of contact details to keep in step, and they would not stay in
 * step.
 *
 * An invented support address or phone number is worse than a marked gap: a
 * customer would write to it and hear nothing back. The real ones are Victor's.
 */
export function ContactsPage() {
  const t = useTranslation('company');

  usePageMeta(t.contacts.meta.title, t.contacts.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.contacts.title} lead={t.contacts.intro} />
          <PlaceholderSections sections={t.contacts.sections} />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
