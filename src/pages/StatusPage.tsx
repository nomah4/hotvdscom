import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { PlaceholderSections } from '../components/content/PlaceholderSections';
import { StatusDot } from '../components/ui/StatusDot';
import { BuildStamp } from '../components/ui/BuildStamp';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';
import { datacenters } from '../data/datacenters';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const GroupTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
  margin-bottom: 12px;
`;

// Warning-toned rather than error-toned: nothing is broken, we simply do not
// measure this yet. Loud enough that nobody reads the list below as uptime.
const Notice = styled.div`
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.warning};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoticeTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const NoticeBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const Rows = styled.ul`
  display: flex;
  flex-direction: column;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const Place = styled.span`
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const Note = styled.p`
  margin-top: 12px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

/**
 * Service status, limited to what we can actually stand behind.
 *
 * There is no monitoring backend, so this page measures nothing. It reports two
 * facts we genuinely hold — the rollout state of each location from
 * src/data/datacenters.ts, and the commit serving the page — and says plainly
 * that it is not availability data.
 *
 * A status page is the one page where invented numbers do real damage: "99.98%"
 * here is a number a customer would rely on and, later, hold us to. So there are
 * no percentages, no "all systems operational", and no incident history until
 * something actually measures them. StatusPage.test.tsx enforces that.
 */
export function StatusPage() {
  const t = useTranslation('network');
  const tc = useTranslation('common');
  const { lang } = useLang();

  usePageMeta(t.status.meta.title, t.status.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.status.title} />

          <Notice>
            <NoticeTitle>{t.status.noMonitoringTitle}</NoticeTitle>
            <NoticeBody>{t.status.noMonitoringBody}</NoticeBody>
          </Notice>

          <div>
            <GroupTitle>{t.status.readinessTitle}</GroupTitle>
            <Rows>
              {datacenters.map((dc) => (
                <Row key={dc.id}>
                  <Place>
                    {dc.flag} {lang === 'ru' ? dc.city : dc.cityEn}
                  </Place>
                  <StatusDot
                    status={dc.status === 'live' ? 'online' : 'stopped'}
                    label={dc.status === 'live' ? tc.datacenterStatus.live : tc.datacenterStatus.comingSoon}
                  />
                </Row>
              ))}
            </Rows>
            <Note>{t.status.readinessNote}</Note>
          </div>

          <div>
            <GroupTitle>{t.status.buildTitle}</GroupTitle>
            <BuildStamp />
            <Note>{t.status.buildNote}</Note>
          </div>

          <div>
            <GroupTitle>{t.status.sectionsTitle}</GroupTitle>
            <PlaceholderSections sections={t.status.sections} />
          </div>
        </Wrap>
      </PageContainer>
    </Section>
  );
}
