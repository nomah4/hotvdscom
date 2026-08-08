import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DatacentersPage } from './DatacentersPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { datacenters } from '../data/datacenters';
import type { Lang } from '../i18n/dictionaries';

/**
 * The page and the configurator read the same datacenters array, so the risk
 * here is not that a location is missing from the data — it is that the page
 * says something the data does not, most likely a count typed into the copy and
 * left behind when a location opens. Every assertion below is derived from the
 * data module for that reason.
 */
describe('DatacentersPage', () => {
  const langs: Lang[] = ['ru', 'en'];

  it.each(langs)('[%s] lists every location in the right language', (lang) => {
    renderWithProviders(<DatacentersPage />, { lang });

    for (const dc of datacenters) {
      expect(screen.getByText(lang === 'ru' ? dc.city : dc.cityEn)).toBeInTheDocument();
    }
  });

  it.each(langs)('[%s] takes the group counts from the data, not the copy', (lang) => {
    renderWithProviders(<DatacentersPage />, { lang });
    const live = datacenters.filter((dc) => dc.status === 'live').length;
    const comingSoon = datacenters.filter((dc) => dc.status === 'comingSoon').length;

    expect(screen.getByRole('heading', { name: new RegExp(`\\(${live}\\)`) })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: new RegExp(`\\(${comingSoon}\\)`) })).toBeInTheDocument();
  });

  it.each(langs)('[%s] promises no uptime figure', (lang) => {
    renderWithProviders(<DatacentersPage />, { lang });

    // Facility specifics — SLA, transit, power — are not ours to state yet, and
    // a percentage is the form a visitor would take as a commitment.
    expect(screen.queryByText(/\d+([.,]\d+)?\s*%/)).toBeNull();
  });
});
