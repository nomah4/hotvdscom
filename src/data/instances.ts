export type InstanceStatus = 'online' | 'degraded' | 'stopped';

export interface VdsInstance {
  id: string;
  name: string;
  datacenterId: string;
  status: InstanceStatus;
  uptime: number;
  cpu: number;
  ram: number;
  ssd: number;
  usageTrend: number[];
}

export const instances: VdsInstance[] = [
  { id: 'i-1', name: 'prod-api-01', datacenterId: 'msk', status: 'online', uptime: 99.99, cpu: 4, ram: 8, ssd: 80, usageTrend: [20, 35, 30, 45, 60, 55, 70] },
  { id: 'i-2', name: 'staging-web', datacenterId: 'ams', status: 'online', uptime: 99.95, cpu: 2, ram: 4, ssd: 40, usageTrend: [10, 15, 12, 20, 18, 22, 25] },
  { id: 'i-3', name: 'db-replica-02', datacenterId: 'fra', status: 'degraded', uptime: 98.2, cpu: 6, ram: 16, ssd: 160, usageTrend: [50, 70, 85, 90, 75, 88, 92] },
  { id: 'i-4', name: 'ml-training-gpu', datacenterId: 'msk', status: 'online', uptime: 99.87, cpu: 8, ram: 32, ssd: 320, usageTrend: [60, 80, 95, 90, 85, 95, 98] },
  { id: 'i-5', name: 'old-backup-node', datacenterId: 'ist', status: 'stopped', uptime: 0, cpu: 1, ram: 1, ssd: 20, usageTrend: [0, 0, 0, 0, 0, 0, 0] },
];
