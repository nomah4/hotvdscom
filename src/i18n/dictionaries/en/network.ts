import type { network as ruNetwork } from '../ru/network';
import type { DeepWiden } from '../../deepWiden';

// See ru/network.ts — the Russian file is the shape authority.
const TODO = '__TEXT_FROM_VICTOR__';

export const network = {
  datacenters: {
    meta: {
      title: 'Data Centers — hotvds',
      description: 'Where hotvds.com servers are hosted and which locations are being prepared.',
    },
    title: 'Data Centers',
    subtitle: 'Five locations planned. You can order a server wherever the site is already live.',
    liveHeading: 'Live now ({count})',
    comingSoonHeading: 'Preparing to launch ({count})',
    comingSoonNote: 'Launch dates are not announced yet. A location appears in the configurator as soon as it opens.',
    sectionsTitle: 'Facility details',
    sections: [
      { heading: 'Operator and facility address', placeholder: TODO },
      { heading: 'Network and uplinks', placeholder: TODO },
      { heading: 'Hardware', placeholder: TODO },
      { heading: 'Power and cooling', placeholder: TODO },
      { heading: 'Timeline for new locations', placeholder: TODO },
    ],
    cta: 'Configure a server',
  },
  status: {
    meta: {
      title: 'Service Status — hotvds',
      description: 'Location readiness for hotvds.com and which build you are being served.',
    },
    title: 'Service Status',
    noMonitoringTitle: 'Automated monitoring is not connected yet',
    noMonitoringBody:
      'This page does not measure server availability. Below is location readiness as we record it, and the build you are currently being served. If something is not working, write to support.',
    readinessTitle: 'Location readiness',
    readinessNote: 'This is the rollout state of a location, not the current availability of any one server.',
    buildTitle: 'Site build',
    buildNote: 'The commit the page open in your browser was built from.',
    sectionsTitle: 'What goes here next',
    sections: [
      { heading: 'Incident notification channel', placeholder: TODO },
      { heading: 'Incident history', placeholder: TODO },
      { heading: 'Scheduled maintenance', placeholder: TODO },
      { heading: 'SLA and credits', placeholder: TODO },
      { heading: 'Escalating to support', placeholder: TODO },
    ],
  },
} as const satisfies DeepWiden<typeof ruNetwork>;
