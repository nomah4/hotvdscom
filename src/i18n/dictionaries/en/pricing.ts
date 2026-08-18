import type { pricing as ruPricing } from '../ru/pricing';
import type { DeepWiden } from '../../deepWiden';

export const pricing = {
  meta: {
    title: 'VDS Pricing from $10/mo & Configurator — hotvds',
    description:
      'Build a custom VDS or pick a ready-made plan. NVMe storage, DDoS protection, IPv6. Save 15% with yearly billing.',
  },
  hero: {
    title: 'Pricing & configurator',
    subtitle: 'Build a server for your task or pick a ready-made plan',
  },
  configurator: {
    title: 'Build your VDS',
    cpuLabel: 'CPU (cores)',
    ramLabel: 'RAM (GB)',
    ssdLabel: 'NVMe storage (GB)',
    osLabel: 'Operating system',
    datacenterLabel: 'Data center',
    priceLabel: 'Price per month',
    priceLabelAnnual: 'Price per year',
    loadingPrice: 'Calculating…',
    priceUnavailable: 'Pricing unavailable',
    cta: 'Order',
  },
  billingToggle: {
    monthly: 'Monthly',
    yearly: 'Yearly (−15%)',
  },
  comparison: {
    title: 'Ready-made plans',
    subtitle: 'Five configurations for every scale',
    popularBadge: 'Popular',
    loading: 'Loading plans…',
    error: "Couldn't load plans — please try again shortly.",
  },
  checkout: {
    confirmTitle: 'Confirm your order',
    billingCycleLabel: 'Billing cycle',
    billedToLabel: 'Receipt sent to',
    totalLabel: 'Total',
    // Introduces the secondary figure `displayPrice` renders beneath the
    // primary one on marketing surfaces (e.g. "~$11" above "billed RUB 990") —
    // never the primary itself, and never on a payment surface, where the
    // roubles figure already leads and needs no introduction.
    secondaryLabel: 'billed',
    renewalNoteMonthly: 'Renews automatically every month. Cancel any time from your dashboard.',
    renewalNoteAnnual: 'Renews automatically every year. Cancel any time from your dashboard.',
    termsPrefix: 'I accept the',
    termsLink: 'terms of service',
    proceedToPayment: 'Proceed to payment',
    signInToContinue: 'Sign in to continue',
    planNotFoundTitle: 'Plan not found',
    planNotFoundBody: 'That plan is not in the catalogue. The link may be out of date — please pick a plan again.',
    starting: 'Opening payment…',
    failed: "Couldn't start the payment — please try again.",
    checking: 'Checking payment status…',
    paidTitle: 'Payment received',
    paidBody: "Thank you! We're preparing your server — details will arrive by email.",
    pendingTitle: 'Awaiting confirmation',
    pendingBody: 'The payment is still being processed. This page will update on its own.',
    failedTitle: 'Payment did not go through',
    failedBody: "You haven't been charged. You can try again from any plan.",
    backToPricing: 'Back to pricing',
    toDashboard: 'Go to dashboard',
    customPlanName: 'Custom VDS',
    pricingQuoteLoading: 'Calculating configuration…',
    pricingQuoteFailed: "Couldn't calculate this configuration — choose different specs or try again.",
  },
  features: {
    title: "What's included in every plan",
    items: [
      { name: 'DDoS protection', tiers: [true, true, true, true, true] },
      { name: 'IPv6', tiers: [true, true, true, true, true] },
      { name: 'Priority support', tiers: [false, false, true, true, true] },
      { name: 'Dedicated IP', tiers: [true, true, true, true, true] },
    ],
  },
  faq: {
    title: 'Billing questions',
    items: [
      { question: 'Can I pay with a foreign card?', answer: 'Yes, we accept international Visa and Mastercard.' },
      { question: "What happens if my balance runs out?", answer: "We'll notify you 3 days ahead and only pause the server after a written notice." },
      { question: 'Do you offer refunds?', answer: 'Yes, within 7 days of your first payment on any plan.' },
    ],
  },
} as const satisfies DeepWiden<typeof ruPricing>;
