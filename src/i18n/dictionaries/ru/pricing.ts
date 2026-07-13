export const pricing = {
  hero: {
    title: 'Тарифы и конфигуратор',
    subtitle: 'Соберите сервер под свою задачу или выберите готовый тариф',
  },
  configurator: {
    title: 'Соберите свой VDS',
    cpuLabel: 'Процессор (ядра)',
    ramLabel: 'Оперативная память (ГБ)',
    ssdLabel: 'NVMe-диск (ГБ)',
    osLabel: 'Операционная система',
    datacenterLabel: 'Дата-центр',
    priceLabel: 'Стоимость в месяц',
    cta: 'Заказать',
  },
  billingToggle: {
    monthly: 'Помесячно',
    yearly: 'На год (−15%)',
  },
  comparison: {
    title: 'Готовые тарифы',
    subtitle: 'Пять конфигураций на любой масштаб',
    popularBadge: 'Популярный',
  },
  features: {
    title: 'Что входит в каждый тариф',
    items: [
      { name: 'Ежедневные бэкапы', tiers: [false, true, true, true, true] },
      { name: 'DDoS-защита', tiers: [true, true, true, true, true] },
      { name: 'IPv6', tiers: [true, true, true, true, true] },
      { name: 'Приоритетная поддержка', tiers: [false, false, true, true, true] },
      { name: 'Выделенный IP', tiers: [false, true, true, true, true] },
    ],
  },
  faq: {
    title: 'Вопросы по оплате',
    items: [
      { question: 'Можно ли оплатить картой другой страны?', answer: 'Да, принимаем международные карты Visa и Mastercard.' },
      { question: 'Что будет, если не хватит средств на балансе?', answer: 'Мы предупредим за 3 дня и приостановим сервер только после письменного уведомления.' },
      { question: 'Есть ли возврат средств?', answer: 'Да, в течение 7 дней с момента первой оплаты по любому тарифу.' },
    ],
  },
} as const;
