import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { StatusPage } from './StatusPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { datacenters } from '../data/datacenters';
import { dictionaries } from '../i18n/dictionaries';
import type { Lang } from '../i18n/dictionaries';

/**
 * A status page is where invented numbers do the most damage: a customer reads
 * "99.98%" as a commitment and will hold us to it later. Nothing here measures
 * availability — there is no monitoring backend — so these tests exist to keep
 * the page from quietly growing figures it cannot back.
 */
describe('StatusPage', () => {
  const langs: Lang[] = ['ru', 'en'];

  it.each(langs)('[%s] states no percentage anywhere', (lang) => {
    renderWithProviders(<StatusPage />, { lang });

    expect(screen.queryByText(/\d+([.,]\d+)?\s*%/)).toBeNull();
  });

  it.each(langs)('[%s] says plainly that monitoring is not connected', (lang) => {
    renderWithProviders(<StatusPage />, { lang });
    const t = dictionaries[lang].network.status;

    // Without this the readiness list below reads as live availability data.
    expect(screen.getByText(t.noMonitoringTitle)).toBeInTheDocument();
    expect(screen.getByText(t.noMonitoringBody)).toBeInTheDocument();
  });

  it.each(langs)('[%s] marks each location live or coming soon per the data', (lang) => {
    renderWithProviders(<StatusPage />, { lang });
    const status = dictionaries[lang].common.datacenterStatus;
    const live = datacenters.filter((dc) => dc.status === 'live').length;
    const comingSoon = datacenters.filter((dc) => dc.status === 'comingSoon').length;

    expect(screen.getAllByText(status.live)).toHaveLength(live);
    expect(screen.getAllByText(status.comingSoon)).toHaveLength(comingSoon);
  });

  it('shows which build is serving the page', () => {
    renderWithProviders(<StatusPage />, { lang: 'ru' });

    expect(screen.getByText(/^build [0-9a-f]{7}$/)).toBeInTheDocument();
  });
});
