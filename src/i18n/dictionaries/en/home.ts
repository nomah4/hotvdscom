import type { home as ruHome } from '../ru/home';
import type { DeepWiden } from '../../deepWiden';

export const home = {
  hero: {
    eyebrow: 'A new generation of VDS',
    title: 'VDS hosting that launches in 5 minutes',
    subtitle:
      'Powerful NVMe-backed servers with a real 99.98% uptime and support that actually answers. Spin up your project today — zero paperwork.',
    ctaPrimary: 'Launch a server',
    ctaSecondary: 'View pricing',
    trustBadge: '99.98% uptime',
    trustNote: '5-minute setup',
  },
  valueProps: {
    title: 'Why hotvds',
    subtitle: 'Everything you need for a calm production run',
    items: [
      { title: 'NVMe speed', text: 'NVMe disks with plenty of headroom in IOPS for databases and high-load projects.' },
      { title: 'DDoS protection', text: 'Network-level filtering keeps your server reachable at all times.' },
      { title: '24/7 support', text: 'Real engineers respond in minutes, not hours.' },
      { title: 'Instant deploy', text: 'Your server spins up automatically 5 minutes after payment.' },
    ],
  },
  tariffTeaser: {
    title: 'Plans for every workload',
    subtitle: 'From side projects to production-grade traffic',
    linkLabel: 'All plans',
  },
  datacenters: {
    title: 'Data center locations',
    subtitle: 'Place your server closer to your users',
  },
  testimonials: {
    title: 'Trusted by teams',
    subtitle: 'What customers say about hotvds',
    items: [
      { quote: 'We migrated from another host in one evening with zero downtime.', author: 'Igor Sokolov', role: 'CTO, Fintra' },
      { quote: 'Support answers faster than I can finish typing the question.', author: 'Maria Lebedeva', role: 'DevOps Engineer' },
      { quote: 'Honest pricing, no hidden bandwidth fees.', author: 'Dmitry Kovalev', role: 'Founder, ShopEasy' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      { question: 'How fast does the server activate?', answer: 'The server deploys automatically within 5 minutes of payment.' },
      { question: 'Can I change my plan later?', answer: 'Yes, upgrades and downgrades are available anytime from the dashboard.' },
      { question: 'Do you offer backups?', answer: 'Daily backups are included in every plan except the base tier.' },
      { question: 'What payment methods do you accept?', answer: 'Bank cards, instant bank transfer, and cryptocurrency.' },
    ],
  },
  finalCta: {
    title: 'Ready to launch your project?',
    subtitle: 'First 7 days free, no card required.',
    cta: 'Start for free',
  },
} as const satisfies DeepWiden<typeof ruHome>;
