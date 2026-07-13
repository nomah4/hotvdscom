import type { product as ruProduct } from '../ru/product';
import type { DeepWiden } from '../../deepWiden';

export const product = {
  meta: {
    title: 'NVIDIA GPU Servers, No Waitlists — hotvds',
    description:
      'Rent NVIDIA A100 GPU servers for ML, rendering, and HPC. Hourly billing, pre-installed CUDA and PyTorch, live in 5 minutes.',
  },
  hero: {
    eyebrow: 'GPU Servers',
    title: 'GPU compute without queues or markups',
    subtitle: 'NVIDIA accelerators for model training, rendering, and high-performance computing.',
    cta: 'Order a GPU server',
  },
  useCases: {
    title: 'Built for',
    items: [
      { title: 'ML model training', text: 'Fast training and inference on GPUs with plenty of VRAM.' },
      { title: 'Rendering', text: '3D rendering and video processing many times faster than CPU.' },
      { title: 'Scientific computing', text: 'Parallel computing for simulations and data analysis.' },
      { title: 'Streaming & cloud gaming', text: 'Low latency for streaming graphics-heavy content.' },
    ],
  },
  specsTable: {
    title: 'GPU server configurations',
    columns: ['Plan', 'GPU', 'VRAM', 'CPU', 'RAM', 'Storage', 'Price/mo'],
  },
  whyHotvds: {
    title: 'Why hotvds GPU servers',
    items: [
      { title: 'No queues', text: 'Instant capacity allocation with no waitlists.' },
      { title: 'Hourly billing', text: 'Pay only for the time you actually use.' },
      { title: 'Ready-made images', text: 'Pre-installed CUDA, PyTorch, and TensorFlow.' },
    ],
  },
  availability: {
    title: 'Data center availability',
    subtitle: 'GPU capacity is not available in every location',
  },
  cta: {
    title: 'Launch a GPU server right now',
    subtitle: 'Deployed in 5 minutes, billed by actual usage.',
    button: 'Order a GPU server',
  },
} as const satisfies DeepWiden<typeof ruProduct>;
