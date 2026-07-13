import type { dashboard as ruDashboard } from '../ru/dashboard';
import type { DeepWiden } from '../../deepWiden';

export const dashboard = {
  topbar: {
    welcome: 'Welcome back',
  },
  sidebar: {
    instances: 'Instances',
    billing: 'Billing',
    settings: 'Settings',
  },
  stats: {
    activeInstances: 'Active servers',
    avgUptime: 'Average uptime',
    monthSpend: 'This month spend',
  },
  instances: {
    title: 'My servers',
    columns: { name: 'Name', region: 'Region', status: 'Status', uptime: 'Uptime', specs: 'Specs', actions: '' },
    statusLabels: { online: 'Online', degraded: 'Degraded', stopped: 'Stopped' },
    manage: 'Manage',
  },
  billing: {
    title: 'Balance',
    balance: 'Current balance',
    nextInvoice: 'Next charge',
    topUp: 'Top up balance',
  },
  footer: '© {year} hotvds.com',
} as const satisfies DeepWiden<typeof ruDashboard>;
