import { describe, expect, it } from 'vitest';
import { renewalErrorMessage } from './renewalErrors';
import { dictionaries } from '../../i18n/dictionaries';

describe('renewalErrorMessage', () => {
  for (const lang of ['en', 'ru'] as const) {
    const text = dictionaries[lang].dashboard.subscriptions;

    it(`maps upgrade_in_progress to its own text (${lang})`, () => {
      expect(renewalErrorMessage('upgrade_in_progress: busy', text)).toBe(text.renewUpgradeInProgress);
    });

    it(`keeps the general text for anything else (${lang})`, () => {
      expect(renewalErrorMessage('boom', text)).toBe(text.renewError);
      expect(renewalErrorMessage(null, text)).toBe(text.renewError);
    });
  }
});
