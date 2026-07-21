export const dashboard = {
  topbar: {
    welcome: 'С возвращением',
    admin: 'Админ',
  },
  sidebar: {
    instances: 'Инстансы',
    billing: 'Биллинг',
    settings: 'Настройки',
  },
  stats: {
    activeServers: 'Активных серверов',
    nextRenewal: 'Следующее продление',
    totalPlans: 'Всего планов',
  },
  instances: {
    title: 'Мои серверы',
    columns: { name: 'Имя', region: 'Регион', status: 'Статус', uptime: 'Аптайм', specs: 'Конфигурация', actions: '' },
    statusLabels: { online: 'Активен', degraded: 'Проблема', stopped: 'Остановлен' },
    manage: 'Управлять',
  },
  subscriptions: {
    title: 'Мои серверы',
    statusLabels: {
      pending_activation: 'Активируется',
      active: 'Активен',
      past_due: 'Просрочен',
      expired: 'Истёк',
      cancelled: 'Отменён',
      revoked: 'Отозван',
    },
    provisioning: {
      pending: 'Сервер ещё разворачивается',
      delayed: 'Развёртывание задерживается',
      failed: 'Ошибка развёртывания',
    },
    term: { monthly: 'Ежемесячно', annual: 'Ежегодно' },
    validUntil: 'Действует до',
    autoRenew: 'Автопродление',
    unknownPlan: 'Неизвестный план',
    loading: 'Загружаем ваши серверы…',
    error: 'Не удалось загрузить ваши серверы.',
    empty: 'У вас пока нет серверов.',
    emptyCta: 'Выбрать план',
  },
  billing: {
    title: 'Баланс',
    balance: 'Текущий баланс',
    nextInvoice: 'Следующее списание',
    topUp: 'Пополнить баланс',
  },
  footer: '© {year} hotvds.com',
} as const;
