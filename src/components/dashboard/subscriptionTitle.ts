import type { Subscription } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';

/**
 * Как называется услуга на экране.
 *
 * Один модуль на всё приложение. Раньше цепочка была написана дважды — в
 * карточке и на странице кабинета, — и в обоих местах стоял комментарий, что
 * они не должны разойтись. Комментарий не механизм: имя клиента добавляет к
 * цепочке третье правило, а третье правило в двух копиях расходится втрое
 * охотнее. Окно подтверждения оплаты читает отсюда же, поэтому клиент видит
 * одно и то же название и на карточке, и в момент списания.
 */
export interface SubscriptionTitle {
  /** Крупная строка: имя клиента, если он его дал, иначе название тарифа. */
  title: string;
  /**
   * Тариф — но только когда заголовок его вытеснил.
   *
   * `null`, когда заголовок и есть название тарифа: повторять его второй
   * строкой значит занимать место, ничего не сообщая.
   */
  planName: string | null;
}

export interface TitleLabels {
  customPlan: string;
  unknownPlan: string;
}

/** Название тарифа без учёта имени, данного клиентом. */
export function resolvePlanName(
  subscription: Subscription,
  tariff: Tariff | undefined,
  labels: TitleLabels,
): string {
  if (tariff) return tariff.name;
  // Своя конфигурация — значит тариф собран клиентом, и у него нет имени в
  // каталоге. Показывать код пакета в этом случае бессмысленно.
  if (subscription.configuration) return labels.customPlan;
  return subscription.package_code ?? labels.unknownPlan;
}

export function resolveSubscriptionTitle(
  subscription: Subscription,
  tariff: Tariff | undefined,
  labels: TitleLabels,
): SubscriptionTitle {
  const planName = resolvePlanName(subscription, tariff, labels);
  const custom = subscription.display_name?.trim();
  if (!custom) return { title: planName, planName: null };
  return { title: custom, planName };
}
