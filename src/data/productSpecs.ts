export interface GpuTier {
  id: string;
  name: string;
  gpu: string;
  vram: string;
  cpu: string;
  ram: string;
  storage: string;
  price: number;
}

export const gpuTiers: GpuTier[] = [
  { id: 'gpu-t4', name: 'GPU Start', gpu: 'NVIDIA T4', vram: '16 ГБ', cpu: '4 vCPU', ram: '16 ГБ', storage: '100 ГБ NVMe', price: 90 },
  { id: 'gpu-l4', name: 'GPU Pro', gpu: 'NVIDIA L4', vram: '24 ГБ', cpu: '8 vCPU', ram: '32 ГБ', storage: '200 ГБ NVMe', price: 180 },
  { id: 'gpu-a100', name: 'GPU Ultra', gpu: 'NVIDIA A100', vram: '80 ГБ', cpu: '16 vCPU', ram: '64 ГБ', storage: '400 ГБ NVMe', price: 420 },
];
