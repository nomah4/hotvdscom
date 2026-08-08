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
        expect(Object.keys(column.links).length).toBeGreaterThan(0);
      }
    }
  });
});

/**
 * Several pages ship their structure with the text still missing, marked by a
 * placeholder token. That is the intended state for a *body* — it tells whoever
 * fills it in what belongs where. It is never the intended state for a title or
 * for meta, which is what a search engine prints and a browser tab shows.
 */
describe('page copy', () => {
  const PLACEHOLDER = /__[A-ZА-Я_]+__/;

  function walk(value: unknown, path: string, visit: (key: string, text: string, path: string) => void) {
    if (typeof value === 'string') return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`, visit));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') visit(key, val, `${path}.${key}`);
        else walk(val, `${path}.${key}`, visit);
      }
    }
  }

  it.each(['ru', 'en'] as const)('[%s] gives every meta block a hotvds title and a real description', (lang) => {
    walk(dictionaries[lang], lang, (key, text, path) => {
      if (key !== 'title' || !path.endsWith('.meta.title')) return;

      // Brand in every tab title. Sub-pages suffix it ("Контакты — hotvds"); the
      // landing page leads with it instead, which is why this checks for the
      // name rather than the suffix.
      expect(text, path).toMatch(/hotvds/i);
    });

    walk(dictionaries[lang], lang, (key, text, path) => {
      if (key !== 'description' || !path.endsWith('.meta.description')) return;

      expect(text, path).not.toBe('');
      expect(text, path).not.toMatch(PLACEHOLDER);
    });
  });

  it.each(['ru', 'en'] as const)('[%s] keeps placeholder markers out of headings and lead copy', (lang) => {
    walk(dictionaries[lang], lang, (key, text, path) => {
      if (!['title', 'heading', 'intro', 'subtitle'].includes(key)) return;

      expect(text, path).not.toMatch(PLACEHOLDER);
    });
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
