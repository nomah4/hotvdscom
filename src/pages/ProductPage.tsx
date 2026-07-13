import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Section } from '../components/layout/Section';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SpecBadge } from '../components/ui/SpecBadge';
import { DatacenterBadge } from '../components/ui/DatacenterBadge';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { orderPath } from '../i18n/paths';
import { usePageMeta } from '../i18n/usePageMeta';
import { gpuTiers } from '../data/productSpecs';
import { datacenters } from '../data/datacenters';
import { media } from '../theme/breakpoints';

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h1};
  line-height: ${({ theme }) => theme.lineHeights.h1};
  max-width: 800px;
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  max-width: 600px;
`;

const SpecsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 48px;

  ${media.tablet`
    grid-template-columns: repeat(2, 1fr);
  `}

  ${media.laptop`
    grid-template-columns: repeat(4, 1fr);
  `}
`;

const UseCaseCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const UseCaseTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const UseCaseText = styled.p`
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const TableWrap = styled.div`
  margin-top: 40px;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const MonoTd = styled(Td)`
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const WhyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 40px;

  ${media.tablet`
    grid-template-columns: repeat(3, 1fr);
  `}
`;

const WhyCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const AvailabilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
`;

const CtaBanner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  color: ${({ theme }) => theme.colors.neutral[0]};
`;

const CtaTitle = styled.h2`
  color: ${({ theme }) => theme.colors.neutral[0]};
  font-size: ${({ theme }) => theme.fontSizes.h2};
`;

const CtaSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.accent[50]};
  font-size: 1.0625rem;
`;

const useCaseIcons = ['🧠', '🎬', '🔬', '🎮'];
const whyIcons = ['⏱️', '💳', '📦'];

export function ProductPage() {
  const t = useTranslation('product');
  const { lang } = useLang();

  usePageMeta(t.meta.title, t.meta.description);

  return (
    <>
      <Section $background="tertiary">
        <PageContainer>
          <Hero>
            <Badge $tone="accent">{t.hero.eyebrow}</Badge>
            <HeroTitle>{t.hero.title}</HeroTitle>
            <HeroSubtitle>{t.hero.subtitle}</HeroSubtitle>
            <SpecsRow>
              <SpecBadge label="GPU" value="NVIDIA A100" />
              <SpecBadge label="VRAM" value="80 GB" />
              <SpecBadge label="CPU" value="16 vCPU" />
              <SpecBadge label="RAM" value="64 GB" />
            </SpecsRow>
            <Button as={Link} to={orderPath(lang)} $size="lg">
              {t.hero.cta}
            </Button>
          </Hero>
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.useCases.title} />
          <Grid>
            {t.useCases.items.map((item, i) => (
              <UseCaseCard key={item.title}>
                <div style={{ fontSize: '1.5rem' }}>{useCaseIcons[i]}</div>
                <UseCaseTitle>{item.title}</UseCaseTitle>
                <UseCaseText>{item.text}</UseCaseText>
              </UseCaseCard>
            ))}
          </Grid>
        </PageContainer>
      </Section>

      <Section $background="secondary">
        <PageContainer>
          <SectionHeading title={t.specsTable.title} />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  {t.specsTable.columns.map((col) => (
                    <Th key={col}>{col}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gpuTiers.map((tier) => (
                  <tr key={tier.id}>
                    <Td>{tier.name}</Td>
                    <MonoTd>{tier.gpu}</MonoTd>
                    <MonoTd>{tier.vram}</MonoTd>
                    <MonoTd>{tier.cpu}</MonoTd>
                    <MonoTd>{tier.ram}</MonoTd>
                    <MonoTd>{tier.storage}</MonoTd>
                    <Td>${tier.price}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.whyHotvds.title} />
          <WhyGrid>
            {t.whyHotvds.items.map((item, i) => (
              <WhyCard key={item.title}>
                <div style={{ fontSize: '1.5rem' }}>{whyIcons[i]}</div>
                <UseCaseTitle>{item.title}</UseCaseTitle>
                <UseCaseText>{item.text}</UseCaseText>
              </WhyCard>
            ))}
          </WhyGrid>
        </PageContainer>
      </Section>

      <Section $background="secondary">
        <PageContainer>
          <SectionHeading title={t.availability.title} subtitle={t.availability.subtitle} />
          <AvailabilityRow>
            {datacenters.map((dc) => (
              <DatacenterBadge key={dc.id} datacenter={dc} />
            ))}
          </AvailabilityRow>
        </PageContainer>
      </Section>

      <Section $background="accent">
        <PageContainer>
          <CtaBanner>
            <CtaTitle>{t.cta.title}</CtaTitle>
            <CtaSubtitle>{t.cta.subtitle}</CtaSubtitle>
            <Button as={Link} to={orderPath(lang)} $variant="secondary" $size="lg" style={{ background: '#fff' }}>
              {t.cta.button}
            </Button>
          </CtaBanner>
        </PageContainer>
      </Section>
    </>
  );
}
