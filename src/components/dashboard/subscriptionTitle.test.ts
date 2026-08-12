import { describe, expect, it } from 'vitest';
import { resolvePlanName, resolveSubscriptionTitle } from './subscriptionTitle';
import type { Subscription } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';

const labels = { customPlan: 'Индивидуальный VDS', unknownPlan: 'Неизвестный план' };

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    subscription_id: 'sub_1',
    status: 'active',
    package_code: 'VDS_PRO_MONTHLY',
    scope_type: 'project',
    valid_from: null,
    valid_until: null,
    provisioning_status: 'succeeded',
    auto_renew: false,
    configuration: null,
    ...overrides,
  };
}

const tariff = { name: 'VDS Pro' } as Tariff;

/**
 * Эта цепочка была написана дважды — в карточке и на странице кабинета — с
 * комментарием в обоих местах, что копии не должны разойтись. Тесты живут здесь,
 * потому что теперь есть одно место, которому можно их адресовать.
 */
describe('resolvePlanName', () => {
  it('prefers the catalogue name', () => {
    expect(resolvePlanName(subscription(), tariff, labels)).toBe('VDS Pro');
  });

  it('calls a self-assembled plan custom rather than showing its code', () => {
    // У собранной клиентом конфигурации нет названия в каталоге, и код пакета
    // ему ничего не говорит.
    const s = subscription({ configuration: { cpu: 2 } });
    expect(resolvePlanName(s, undefined, labels)).toBe(labels.customPlan);
  });

  it('falls back to the raw code for a plan the catalogue no longer lists', () => {
    expect(resolvePlanName(subscription(), undefined, labels)).toBe('VDS_PRO_MONTHLY');
  });
});

describe('resolveSubscriptionTitle', () => {
  it('uses the customer name and keeps the plan for the second line', () => {
    const s = subscription({ display_name: 'prod-api-01' });

    expect(resolveSubscriptionTitle(s, tariff, labels)).toEqual({
      title: 'prod-api-01',
      planName: 'VDS Pro',
    });
  });

  it('does not repeat the plan under itself when there is no custom name', () => {
    // Вторая строка с тем же текстом занимает место и ничего не сообщает.
    expect(resolveSubscriptionTitle(subscription(), tariff, labels)).toEqual({
      title: 'VDS Pro',
      planName: null,
    });
  });

  it('treats a blank name as no name', () => {
    // Биллинг хранит `null` для опустевшего поля, но пробелы могли доехать из
    // старой записи — заголовок из пробелов выглядел бы как пропавшее название.
    const s = subscription({ display_name: '   ' });
    expect(resolveSubscriptionTitle(s, tariff, labels).title).toBe('VDS Pro');
  });
});
