import type { dashboard as ruDashboard } from '../ru/dashboard';
import type { DeepWiden } from '../../deepWiden';

export const dashboard = {
  topbar: {
    welcome: 'Welcome back',
    admin: 'Admin',
  },
  sidebar: {
    instances: 'Instances',
    billing: 'Billing',
    settings: 'Settings',
  },
  stats: {
    activeServers: 'Active servers',
    nextRenewal: 'Next renewal',
    totalPlans: 'Total plans',
  },
  instances: {
    title: 'My servers',
    columns: { name: 'Name', region: 'Region', status: 'Status', uptime: 'Uptime', specs: 'Specs', actions: '' },
    statusLabels: { online: 'Online', degraded: 'Degraded', stopped: 'Stopped' },
    manage: 'Manage',
  },
  subscriptions: {
    title: 'My servers',
    statusLabels: {
      pending_activation: 'Activating',
      active: 'Active',
      past_due: 'Past due',
      expired: 'Expired',
      cancelled: 'Cancelled',
      revoked: 'Revoked',
    },
    provisioning: {
      pending: 'Server is still being provisioned',
      delayed: 'Provisioning delayed',
      failed: 'Provisioning failed',
    },
    term: { monthly: 'Monthly', annual: 'Annual' },
    validUntil: 'Valid until',
    autoRenew: 'Auto-renew',
    unknownPlan: 'Unknown plan',
    customPlan: 'Custom VDS',
    loading: 'Loading your servers…',
    error: 'Could not load your servers.',
    empty: "You don't have any servers yet.",
    emptyCta: 'Browse plans',
  },
  billing: {
    title: 'Balance',
    balance: 'Current balance',
    nextInvoice: 'Next charge',
    topUp: 'Top up balance',
  },
  admin: {
    title: 'Who came to hosting',
    subtitle: 'People with access to hotvds, as recorded by webtalk.',
    columns: { user: 'User', login: 'Login', roles: 'Roles', granted: 'Access granted' },
    loading: 'Loading the list…',
    error: 'Could not load the list.',
    forbidden: 'Your account is not permitted to view this list.',
    empty: 'Nobody has been granted access yet.',
    count: 'Total: {count}',
  },
  footer: '© {year} hotvds.com',
} as const satisfies DeepWiden<typeof ruDashboard>;
