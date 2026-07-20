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
    activeInstances: 'Активных серверов',
    avgUptime: 'Средний аптайм',
    monthSpend: 'Расход за месяц',
  },
  instances: {
    title: 'Мои серверы',
    columns: { name: 'Имя', region: 'Регион', status: 'Статус', uptime: 'Аптайм', specs: 'Конфигурация', actions: '' },
    statusLabels: { online: 'Активен', degraded: 'Проблема', stopped: 'Остановлен' },
    manage: 'Управлять',
  },
  billing: {
    title: 'Баланс',
    balance: 'Текущий баланс',
    nextInvoice: 'Следующее списание',
    topUp: 'Пополнить баланс',
  },
  footer: '© {year} hotvds.com',
} as const;
