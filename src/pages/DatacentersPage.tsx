import styled from 'styled-components';
import { Link } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { PlaceholderSections } from '../components/content/PlaceholderSections';
import { DatacenterRow } from '../components/ui/DatacenterRow';
import { Button } from '../components/ui/Button';
import { useLang, useTranslation, interpolate } from '../i18n/LanguageContext';
import { orderPath } from '../i18n/paths';
import { usePageMeta } from '../i18n/usePageMeta';
import { datacenters } from '../data/datacenters';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const GroupTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Note = styled.p`
  margin-top: 16px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Cta = styled.div`
  display: flex;
  justify-content: center;
`;

const live = datacenters.filter((dc) => dc.status === 'live');
const comingSoon = datacenters.filter((dc) => dc.status === 'comingSoon');

/**
 * The five locations, grouped by whether you can order in them.
 *
 * Real content — src/data/datacenters.ts is the same source the home page and
 * the configurator read, so the three cannot disagree about which sites are
 * open. The counts in the headings are derived from that array rather than
 * written into the copy: opening a location must not require remembering to
 * edit a number in two languages.
 *
 * What the page does NOT claim: uptime, SLA, hardware or transit specifics.
 * Those are facility facts we do not hold — they are placeholders below.
 */
export function DatacentersPage() {
  const t = useTranslation('network');
  const { lang } = useLang();

  usePageMeta(t.datacenters.meta.title, t.datacenters.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.datacenters.title} lead={t.datacenters.subtitle} />

          <div>
            <GroupTitle>{interpolate(t.datacenters.liveHeading, { count: live.length })}</GroupTitle>
            <DatacenterRow items={live} />
          </div>

          <div>
            <GroupTitle>{interpolate(t.datacenters.comingSoonHeading, { count: comingSoon.length })}</GroupTitle>
            <DatacenterRow items={comingSoon} />
            <Note>{t.datacenters.comingSoonNote}</Note>
          </div>

          <div>
            <GroupTitle>{t.datacenters.sectionsTitle}</GroupTitle>
            <PlaceholderSections sections={t.datacenters.sections} />
          </div>

          <Cta>
            <Button as={Link} to={orderPath(lang)}>
              {t.datacenters.cta}
            </Button>
          </Cta>
        </Wrap>
      </PageContainer>
    </Section>
  );
}
