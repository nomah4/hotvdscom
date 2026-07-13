export interface Datacenter {
  id: string;
  city: string;
  cityEn: string;
  country: string;
  countryEn: string;
  flag: string;
  status: 'live' | 'comingSoon';
  gpuAvailable: boolean;
}

export const datacenters: Datacenter[] = [
  { id: 'ams', city: 'Амстердам', cityEn: 'Amsterdam', country: 'Нидерланды', countryEn: 'Netherlands', flag: '🇳🇱', status: 'live', gpuAvailable: true },
  { id: 'msk', city: 'Москва', cityEn: 'Moscow', country: 'Россия', countryEn: 'Russia', flag: '🇷🇺', status: 'comingSoon', gpuAvailable: false },
  { id: 'fra', city: 'Франкфурт', cityEn: 'Frankfurt', country: 'Германия', countryEn: 'Germany', flag: '🇩🇪', status: 'comingSoon', gpuAvailable: false },
  { id: 'ist', city: 'Стамбул', cityEn: 'Istanbul', country: 'Турция', countryEn: 'Turkey', flag: '🇹🇷', status: 'comingSoon', gpuAvailable: false },
  { id: 'sgp', city: 'Сингапур', cityEn: 'Singapore', country: 'Сингапур', countryEn: 'Singapore', flag: '🇸🇬', status: 'comingSoon', gpuAvailable: false },
];
