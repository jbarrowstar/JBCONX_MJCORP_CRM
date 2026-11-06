export interface RealStoreAppInfo {
  name: string;
  developer: string;
  tagline: string;
  category: string;
  googlePlay: {
    packageId: string;
    storeUrl: string;
    downloadTier: string;
    exactDownloads: number;
    rating: number;
    reviewCount: number;
    version: string;
    status: 'ACTIVE' | 'PENDING';
  };
  appStore: {
    appId: string;
    storeUrl: string;
    downloadTier: string;
    exactDownloads: number;
    rating: number;
    reviewCount: number;
    version: string;
    status: 'ACTIVE' | 'PENDING';
  };
  aggregate: {
    totalDownloads: number;
    activeInstalls: number;
    weeklyGrowth: string;
    dailyVelocity: number;
    lastLiveSync: string;
  };
}

export interface StoreTrendPoint {
  date: string;
  playStore: number;
  appStore: number;
  total: number;
}
