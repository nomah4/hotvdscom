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
    balance: 'Balance',
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
    balanceTopUp: 'Top up',
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
    fromBalance: 'Will be paid from your balance, {amount} available.',
    confirmFromBalance: 'Pay from balance',
    paidFromBalance: 'Renewed from your balance.',
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
  balance: {
    meta: {
      title: 'Balance — hotvds',
      description: 'Your hotvds account balance: top it up, read the ledger, and pay for renewals from it.',
    },
    title: 'Balance',
    current: 'Current balance',
    loading: 'Loading your balance…',
    error: 'Could not load your balance. Please try again in a moment.',
    offTitle: 'Balance is not connected yet',
    offBody: 'Paying from a balance is not switched on for this account. Services are paid by card, as before.',
    negativeNote: 'Your balance is negative after a payment reversal. Top up to continue using services.',
    minTopUp: 'Minimum top-up is {amount}.',
    maxTopUp: 'Maximum top-up is {amount}.',
    topUp: {
      title: 'Top up',
      amountLabel: 'Other amount, ₽',
      submit: 'Top up {amount}',
      submitting: 'Opening payment…',
      note: 'Money on the balance is used automatically for your next purchases and renewals. A fiscal receipt is sent to your email for the top-up and again when the balance pays for a service.',
      amountInvalid: 'Enter an amount to top up.',
      belowMinimum: 'That is below the minimum of {amount}.',
      aboveMaximum: 'That is above the maximum of {amount}.',
      methodRefused: 'The payment provider will not take this amount. Try a different one.',
      currencyNotSupported: 'This currency is not accepted right now.',
      emailMissing: 'Add a verified email to your account — the receipt is sent there.',
      gatewayUnavailable: 'The payment provider is unavailable right now. Please try again in a few minutes.',
      failed: 'Could not start the top-up. Please try again.',
    },
    bulk: {
      title: 'Pay for several servers',
      subtitle: 'Tick the servers — the total and the renewal order follow your choice.',
      empty: 'Nothing to renew right now.',
      loading: 'Loading your servers…',
      error: 'Could not load your servers.',
      priceUnavailable: 'price unavailable',
      validUntil: 'until {date}',
      selected: 'Selected {count} servers · total {total} · balance {balance}',
      payFromBalance: 'Pay {total} from balance for {count}',
      topUpAndRenew: 'Top up {shortfall} and renew {count}',
      topUpNote: 'After payment the servers are renewed from the balance automatically, in the order you ticked them.',
      paying: 'Paying…',
      partialFailure: 'Paid from balance: {done} servers. “{server}” was not paid from the balance — the rest were left alone.',
      success: 'Renewed {count} servers from the balance.',
      failed: 'Could not pay from the balance. Please try again.',
    },
    history: {
      title: 'Ledger',
      empty: 'No entries yet.',
      balanceAfter: 'balance {amount}',
      types: {
        top_up: 'Top-up',
        invoice_payment: 'Service payment',
        admin_credit: 'Credited by an operator',
        admin_debit: 'Debited by an operator',
        chargeback_reversal: 'Payment reversal',
        refund: 'Refund',
      },
    },
    pending: {
      title: 'Unfinished top-ups',
      statusLabels: {
        pending: 'Awaiting payment',
        captured: 'Credited',
        failed: 'Failed',
        expired: 'Expired',
      },
      continue: 'Continue payment',
    },
    return: {
      meta: {
        title: 'Balance top-up — hotvds',
        description: 'Checking whether your hotvds balance top-up went through.',
      },
      checking: 'Checking the top-up…',
      capturedTitle: 'Balance topped up by {amount}',
      capturedBody: 'The money is on your balance. Spend it on a purchase or a renewal whenever you like.',
      renewingBody: 'Your servers are being renewed from the balance now. The dates on their cards update once that finishes.',
      pendingTitle: 'Awaiting confirmation',
      pendingBody: 'The payment is still being processed. This page refreshes itself.',
      failedTitle: 'The top-up did not go through',
      failedBody: 'Nothing was charged. You can try again from the balance page.',
      unknownTitle: 'Could not check the top-up',
      unknownBody: 'Open the balance page — if the money arrived, it is already there.',
      toBalance: 'To balance',
      toDashboard: 'To dashboard',
    },
  },
  // The "Telegram notifications" dashboard card. Not shown at all while
  // Billing answers 404 to /telegram/link — a switched-off feature, not a
  // fault.
  telegram: {
    title: 'Telegram notifications',
    error: 'Could not load Telegram settings',
    notLinked: {
      body: 'Get reminders about renewals, expiry notices, balance top-ups and server readiness straight in Telegram. Email keeps coming too.',
      connect: 'Connect Telegram',
      // Linking finishes outside the site: the customer presses Start in
      // Telegram, and this page only learns about it by asking Billing again.
      waiting: 'Open Telegram and press Start — waiting for confirmation…',
      // For anyone whose pop-up was blocked — the same link as plain text.
      openLink: 'Open in Telegram',
      timedOut: 'We did not see a confirmation.',
      tryAgain: 'Try again',
      failed: 'Could not start the connection. Please try again.',
    },
    linked: {
      connectedAs: 'Connected as @{username}',
      connectedNoUsername: 'Connected',
      disconnect: 'Disconnect',
      disconnectConfirm: 'Confirm disconnect',
      disconnectCancel: 'Cancel',
      disconnectFailed: 'Could not disconnect Telegram. Please try again.',
    },
  },
  // The "SSH keys" card. Keys live in the Billing profile and go into every
  // new server — not into existing ones: cloud-init applies keys on first
  // boot only.
  sshKeys: {
    title: 'SSH keys',
    body: 'Keys in this list are added to every new server, so you can sign in without a password. The server password keeps working too.',
    existingNote: 'Servers you already have do not pick a new key up by themselves: add it to ~/.ssh/authorized_keys there.',
    error: 'Could not load SSH keys',
    empty: 'No keys yet.',
    add: 'Add key',
    nameLabel: 'Name',
    namePlaceholder: 'For example, “Work laptop”',
    keyLabel: 'Public key',
    keyPlaceholder: 'ssh-ed25519 AAAA… — the contents of ~/.ssh/id_ed25519.pub',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Confirm delete',
    deleteFailed: 'Could not delete the key. Please try again.',
    limitReached: 'Limit reached — {max} keys.',
    errors: {
      ssh_key_is_private: 'This is a private key — it must never be sent anywhere. Paste the public one, from the .pub file.',
      ssh_key_invalid: 'This does not look like an OpenSSH public key. Paste one line from the .pub file.',
      ssh_key_too_weak: 'RSA keys shorter than 2048 bits are too weak. Consider generating an ed25519 key.',
      ssh_key_exists: 'This key is already in the list.',
      ssh_key_limit: 'Your profile already holds the maximum number of keys.',
      validation_error: 'Paste a public key.',
      failed: 'Could not add the key. Please try again.',
    },
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
