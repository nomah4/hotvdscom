import { describe, expect, it } from 'vitest';
import { dictionaries } from './index';

/**
 * The EN dictionaries are typed `satisfies DeepWiden<typeof ru*>`, so a missing
 * or extra *key* is already a compile error. Array *lengths* are not: dropping
 * one FAQ item or footer label from a single language type-checks fine and ships
 * a page that says different things in RU and EN.
 */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return { length: value.length, items: value.map(shape) };
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, shape(val)]),
    );
  }
  return typeof value;
}

describe('dictionaries', () => {
  it('keeps RU and EN structurally identical, arrays included', () => {
    expect(shape(dictionaries.en)).toEqual(shape(dictionaries.ru));
  });

  it('gives every footer column a title and at least one link', () => {
    for (const lang of ['ru', 'en'] as const) {
      for (const column of Object.values(dictionaries[lang].common.footer.columns)) {
        expect(column.title).not.toBe('');
        expect(column.links.length).toBeGreaterThan(0);
      }
    }
  });
});

/**
 * Claims the backend cannot honour. Billing charges on checkout — there is no
 * trial — and no package carries a GPU, so neither may reappear in copy without
 * a deliberate change here.
 */
describe('marketing copy', () => {
  const FORBIDDEN = [
    { label: 'free trial', pattern: /бесплатн|free trial|пробный период|7 дней бесплатно|days free/i },
    { label: 'GPU', pattern: /\bgpu\b|nvidia|cuda|видеокарт/i },
  ];

  it.each(FORBIDDEN)('makes no $label promise anywhere in the dictionaries', ({ pattern }) => {
    const copy = JSON.stringify(dictionaries);

    expect(copy).not.toMatch(pattern);
  });
});
