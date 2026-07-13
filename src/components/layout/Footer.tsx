import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { PageContainer } from './PageContainer';
import { Logo } from '../ui/Logo';
import { useLang, useTranslation, interpolate } from '../../i18n/LanguageContext';
import { localizePath, routePaths } from '../../i18n/paths';
import { media } from '../../theme/breakpoints';

const footerLinkPaths: Record<string, (string | undefined)[]> = {
  product: [routePaths.pricing, routePaths.gpuServers, undefined, undefined],
  company: [undefined, undefined, undefined, undefined],
  support: [undefined, undefined, undefined],
};

const Wrap = styled.footer`
  background: ${({ theme }) => theme.colors.indigo[900]};
  color: ${({ theme }) => theme.colors.indigo[100]};
  padding-block: ${({ theme }) => theme.space[7]};
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;

  ${media.tablet`
    flex-direction: row;
    justify-content: space-between;
  `}
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
`;

const Tagline = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[200]};
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;

  ${media.tablet`
    grid-template-columns: repeat(3, 1fr);
    gap: 48px;
  `}
`;

const ColumnTitle = styled.h6`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[0]};
  margin-bottom: 16px;
`;

const ColumnLink = styled(Link)`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[200]};
  margin-bottom: 10px;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral[0]};
  }
`;

const Bottom = styled.div`
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.indigo[700]};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[200]};
`;

export function Footer() {
  const t = useTranslation('common');
  const { lang } = useLang();
  const columns = Object.entries(t.footer.columns) as [string, { title: string; links: readonly string[] }][];

  return (
    <Wrap>
      <PageContainer>
        <Top>
          <Brand>
            <Logo light />
            <Tagline>{t.footer.tagline}</Tagline>
          </Brand>
          <Columns>
            {columns.map(([key, col]) => (
              <div key={key}>
                <ColumnTitle>{col.title}</ColumnTitle>
                <ul>
                  {col.links.map((link, i) => {
                    const relPath = footerLinkPaths[key]?.[i];
                    return (
                      <li key={link}>
                        <ColumnLink to={relPath !== undefined ? localizePath(lang, relPath) : '#'}>{link}</ColumnLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Columns>
        </Top>
        <Bottom>{interpolate(t.footer.copyright, { year: new Date().getFullYear() })}</Bottom>
      </PageContainer>
    </Wrap>
  );
}
