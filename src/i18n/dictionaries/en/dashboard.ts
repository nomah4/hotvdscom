import type { dashboard as ruDashboard } from '../ru/dashboard';
import type { DeepWiden } from '../../deepWiden';

export const dashboard = {
  topbar: {
    welcome: 'Welcome back',
    admin: 'Admin',
  },
  sidebar: {
    instances: 'Instances',
    newServer: 'New server',
    support: 'Support',
    billing: 'Billing',
    settings: 'Settings',
    admin: 'Users',
  },
  support: {
    title: 'Technical support',
    subtitle: 'Describe the problem — we answer in chat.',
    openChat: 'Open chat',
    unavailableTitle: 'Chat is not connected yet',
    unavailableBody: 'We are setting the support system up. For now write to us using the details on the Contact page — nothing gets lost.',
    tipsTitle: 'To get an answer faster',
    tips: [
      'Say which server you mean — the plan name and expiry are on its card under Instances.',
      'Describe what you did, and what happened instead of what you expected.',
      'Paste the full error text rather than a summary.',
    ],
  },
  newServer: {
    title: 'New server',
    subtitle: 'Build a configuration or take a ready-made plan — without leaving your account.',
    plansTitle: 'Ready-made plans',
    configuratorTitle: 'Custom configuration',
  },
  stats: {
    activeServers: 'Active servers',
    nextRenewal: 'Next renewal',
    totalServices: 'Total services',
    balance: 'Balance',
    balanceUnavailable: 'not connected yet',
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
    renewHint: 'Click to renew this service',
    renewing: 'Opening payment…',
    renewError: 'Could not start the renewal. Please try again.',
    unknownPlan: 'Unknown plan',
    customPlan: 'Custom VDS',
    // The machine's own state, distinct from the service status above the
    // card. A service can be active while the machine is down — that case is
    // why this line exists separately.
    machine: {
      title: 'Machine status',
      running: 'Running',
      stopped: 'Stopped',
      paused: 'Paused',
      rebooting: 'Rebooting',
      unknown: 'Unknown',
    },
    telemetry: {
      ip: 'IP address',
      cpu: 'CPU load',
      network: 'Network',
      noData: '—',
      note: 'No data yet: monitoring arrives with server provisioning.',
    },
    controls: {
      powerOn: 'Power on',
      powerOff: 'Power off',
      reboot: 'Reboot',
      delete: 'Delete server',
      // Deletion takes a second press: it is the only action on this card the
      // customer cannot undo by themselves.
      deleteConfirm: 'Confirm delete',
      deleteCancel: 'Cancel',
      restore: 'Restore',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      username: 'User',
      password: 'Password',
      // Machines built by hand before the engine existed have no password
      // stored in it. That is an answer, not a fault.
      noPassword: 'We do not hold a password for this server — use the access you were given.',
      noServer: 'The server has not been built yet.',
      pendingDeletion: 'Marked for deletion. Your data is kept until an operator confirms it.',
      failed: 'That did not go through. Please try again.',
    },
    loading: 'Loading your servers…',
    error: 'Could not load your servers.',
    empty: "You don't have any servers yet.",
    emptyCta: 'Browse plans',
  },
  renewal: {
    title: 'Renew service',
    server: 'Server',
    currentlyValidUntil: 'Valid until now',
    amount: 'Amount due',
    amountLoading: 'calculating…',
    amountUnavailable: 'unavailable',
    // The address is prefilled from the account and editable: the receipt may
    // need to go to accounting rather than to the person clicking.
    emailLabel: 'Email for the receipt',
    emailHint: 'The payment receipt goes to this address. Prefilled from your account — change it if you need the receipt somewhere else.',
    previewFailed: 'Could not get the amount from billing. Please try again in a moment.',
    cancel: 'Cancel',
    confirm: 'Pay and renew',
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
    columns: { user: 'User', login: 'Login', roles: 'Roles', granted: 'Access granted', billing: '' },
    viewBilling: 'Billing ↗',
    loading: 'Loading the list…',
    error: 'Could not load the list.',
    forbidden: 'Your account is not permitted to view this list.',
    empty: 'Nobody has been granted access yet.',
    count: 'Total: {count}',
  },
  footer: '© {year} hotvds.com',
} as const satisfies DeepWiden<typeof ruDashboard>;
