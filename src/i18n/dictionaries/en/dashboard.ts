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
    historyTitle: 'History',
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
    // A verb, not a date. On a live service the expiry date is itself the renew
    // control, but "Valid until: Aug 21" is a poor label for the button that
    // takes money for a server that has already stopped.
    payNow: 'Pay',
    payHint: 'The service has expired. Pay to bring the server back',
    // Billing's answer rather than a guess made here: when renewal is not
    // possible, the confirm button must not lead to a refusal after the click.
    notRenewable: 'This service cannot be renewed. Please contact support.',
    unknownPlan: 'Unknown plan',
    serviceId: 'Service ID',
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
      mbits: 'Mbit/s',
      noData: '—',
      // Shown only before the engine has polled the machine for the first time.
      // Polling runs every two minutes, so the promise is specific, not "soon".
      note: 'The engine has not polled this machine yet — figures appear in a couple of minutes.',
    },
    // The name a customer gives their service. Our plan name is not replaced:
    // it moves to a second line so a charge still shows what is being paid for.
    rename: {
      label: 'Server name',
      hint: 'Click to give this server your own name',
      failed: 'Could not save the name. Please try again.',
    },
    controls: {
      powerOn: 'Power on',
      powerOff: 'Power off',
      reboot: 'Reboot',
      // The machine's screen — what is left when both the network and sshd are gone.
      console: 'Console',
      changeIp: 'Change IP',
      // The button stays and goes flat rather than disappearing: a button that
      // vanished reads as a fault, and the date answers the only question this
      // raises.
      changeIpBlocked: 'The address can be changed once a week. Next change from {date}.',
      ipChanged: 'New address: {ip}. The machine is rebooting — it comes up in a minute.',
      // The engine could not reboot it, or the machine is off. Staying silent
      // would leave the customer waiting for an address only they can bring up.
      ipChangedNoReboot: 'New address: {ip}. It comes up after a reboot — please reboot the machine yourself.',
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
      // The console link lasts a minute and opens once, so there is no showing
      // it as text — only saying what is in the way.
      popupBlocked: 'Your browser blocked the new window. Allow pop-ups for this site and press again.',
      consoleRateLimited: 'Too many console attempts. Please wait a minute.',
    },
    loading: 'Loading your servers…',
    error: 'Could not load your servers.',
    empty: "You don't have any servers yet.",
    emptyCta: 'Browse plans',
  },
  renewal: {
    title: 'Renew service',
    server: 'Server',
    plan: 'Plan',
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
  // Confirming an address change. What is confirmed is the address itself, not
  // the intent: DNS records, allowlists and other people's firewalls still point
  // at the old one.
  changeIp: {
    title: 'Change IP address',
    currentIp: 'Current address',
    nextIp: 'New address',
    picking: 'picking…',
    rebootWarning: 'The machine will reboot — the new address comes up on the next boot.',
    limitNote: 'The address can be changed once a week.',
    offerExpires: 'This address is held for you until {time}.',
    offerFailed: 'Could not pick an address. Please try again in a moment.',
    // The address on screen is no longer the one held: pressing again is
    // pointless, the dialog has to be reopened.
    offerExpired: 'That address is no longer held for you. Close this and start the change again.',
    // Built by hand before the engine existed: the address lives inside the
    // guest and cannot be changed from outside. Support does it instead.
    manualMachine: 'This server was set up by hand and its address is configured inside the system. Contact support — we will change it for you.',
    rateLimited: 'The address was already changed this week. The next change will be available later.',
    // The location's pool is empty. Not the customer's fault and not fixed by
    // retrying — saying so plainly beats a generic failure.
    poolExhausted: 'This location has no free addresses right now. Contact support — we will extend the block.',
    cancel: 'Cancel',
    confirm: 'Change address',
    changing: 'Changing the address…',
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
