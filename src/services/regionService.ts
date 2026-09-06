// Region & Geolocation Detection Service
// Automatically determines the user's country/region from mobile network / GPS
// latitude & longitude with intelligent timezone fallback, providing culturally
// authentic player leaderboards for the top 10 regions across the world.

export interface RegionInfo {
  code: string;
  name: string;
  flag: string;
  subtext: string;
  communityAvg: number;
  top10Benchmark: number;
  activeWalkers: number;
  timeframeReset: string;
  players: RegionPlayer[];
}

export interface RegionPlayer {
  id: string;
  name: string;
  initials: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  streakDays?: number;
  lastPlayed: string;
  isUser?: boolean;
  deltaPB?: string;
}

export const TOP_REGIONS: Record<string, RegionInfo> = {
  PK: {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    subtext: 'South Asia · PK Network',
    communityAvg: 85.2,
    top10Benchmark: 98.4,
    activeWalkers: 1420,
    timeframeReset: '2d 11h',
    players: [
      { id: 'pk-1', name: 'Muhammad Ali', initials: 'MA', score: 98.9, difficulty: 'hard', streakDays: 14, lastPlayed: 'Today' },
      { id: 'pk-2', name: 'Fatima Zahra', initials: 'FZ', score: 98.1, difficulty: 'medium', streakDays: 9, lastPlayed: 'Today', deltaPB: '+1.4% PB' },
      { id: 'pk-3', name: 'Bilal Ahmed', initials: 'BA', score: 97.3, difficulty: 'hard', streakDays: 7, lastPlayed: 'Today' },
      { id: 'pk-4', name: 'Ayesha Khan', initials: 'AK', score: 96.0, difficulty: 'medium', streakDays: 5, lastPlayed: 'Today' },
      { id: 'pk-5', name: 'Hamza Tariq', initials: 'HT', score: 94.8, difficulty: 'hard', streakDays: 4, lastPlayed: 'Today' },
      { id: 'pk-6', name: 'Zainab Bibi', initials: 'ZB', score: 93.5, difficulty: 'easy', streakDays: 3, lastPlayed: 'Yesterday' },
      { id: 'pk-7', name: 'Usman Qureshi', initials: 'UQ', score: 92.1, difficulty: 'medium', lastPlayed: 'Yesterday' },
      { id: 'pk-8', name: 'Maryam Nawaz', initials: 'MN', score: 90.7, difficulty: 'easy', lastPlayed: '2 days ago' },
    ],
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    subtext: 'North America · US Carrier',
    communityAvg: 84.8,
    top10Benchmark: 98.2,
    activeWalkers: 3850,
    timeframeReset: '2d 14h',
    players: [
      { id: 'us-1', name: 'Maya Lin', initials: 'ML', score: 98.7, difficulty: 'hard', streakDays: 12, lastPlayed: 'Today' },
      { id: 'us-2', name: 'Jordan Brooks', initials: 'JB', score: 97.9, difficulty: 'medium', streakDays: 8, lastPlayed: 'Today', deltaPB: '+1.8% PB' },
      { id: 'us-3', name: 'Samir Patel', initials: 'SP', score: 96.8, difficulty: 'easy', streakDays: 5, lastPlayed: 'Today' },
      { id: 'us-4', name: 'Taylor Swift (TJ)', initials: 'TJ', score: 95.4, difficulty: 'hard', streakDays: 4, lastPlayed: 'Today' },
      { id: 'us-5', name: 'Chris Nolan', initials: 'CN', score: 93.8, difficulty: 'medium', streakDays: 3, lastPlayed: 'Yesterday' },
      { id: 'us-6', name: 'Emma Watson', initials: 'EW', score: 92.6, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'us-7', name: 'Liam Walker', initials: 'LW', score: 91.5, difficulty: 'easy', lastPlayed: 'Yesterday' },
      { id: 'us-8', name: 'Sophia Miller', initials: 'SM', score: 90.1, difficulty: 'medium', lastPlayed: '2 days ago' },
    ],
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    subtext: 'South Asia · IN Telecom',
    communityAvg: 86.0,
    top10Benchmark: 98.6,
    activeWalkers: 4200,
    timeframeReset: '1d 19h',
    players: [
      { id: 'in-1', name: 'Aarav Sharma', initials: 'AS', score: 99.1, difficulty: 'hard', streakDays: 18, lastPlayed: 'Today' },
      { id: 'in-2', name: 'Priya Patel', initials: 'PP', score: 98.3, difficulty: 'medium', streakDays: 11, lastPlayed: 'Today', deltaPB: '+2.1% PB' },
      { id: 'in-3', name: 'Rohan Verma', initials: 'RV', score: 97.5, difficulty: 'hard', streakDays: 6, lastPlayed: 'Today' },
      { id: 'in-4', name: 'Ananya Iyer', initials: 'AI', score: 96.2, difficulty: 'medium', streakDays: 5, lastPlayed: 'Today' },
      { id: 'in-5', name: 'Vikram Singh', initials: 'VS', score: 94.7, difficulty: 'hard', streakDays: 3, lastPlayed: 'Yesterday' },
      { id: 'in-6', name: 'Sneha Reddy', initials: 'SR', score: 93.4, difficulty: 'easy', lastPlayed: 'Yesterday' },
      { id: 'in-7', name: 'Arjun Nair', initials: 'AN', score: 91.9, difficulty: 'medium', lastPlayed: '2 days ago' },
      { id: 'in-8', name: 'Divya Gupta', initials: 'DG', score: 90.5, difficulty: 'easy', lastPlayed: '3 days ago' },
    ],
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    subtext: 'Europe · UK Mobile',
    communityAvg: 85.0,
    top10Benchmark: 98.0,
    activeWalkers: 2100,
    timeframeReset: '3d 08h',
    players: [
      { id: 'gb-1', name: 'Oliver Clarke', initials: 'OC', score: 98.5, difficulty: 'hard', streakDays: 10, lastPlayed: 'Today' },
      { id: 'gb-2', name: 'Charlotte Davies', initials: 'CD', score: 97.8, difficulty: 'medium', streakDays: 7, lastPlayed: 'Today', deltaPB: '+1.6% PB' },
      { id: 'gb-3', name: 'Harry Bennett', initials: 'HB', score: 96.9, difficulty: 'hard', streakDays: 5, lastPlayed: 'Today' },
      { id: 'gb-4', name: 'Amelia Wright', initials: 'AW', score: 95.3, difficulty: 'easy', streakDays: 4, lastPlayed: 'Today' },
      { id: 'gb-5', name: 'George Evans', initials: 'GE', score: 94.0, difficulty: 'medium', lastPlayed: 'Yesterday' },
      { id: 'gb-6', name: 'Jack Thompson', initials: 'JT', score: 92.8, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'gb-7', name: 'Isla Robinson', initials: 'IR', score: 91.2, difficulty: 'easy', lastPlayed: '2 days ago' },
      { id: 'gb-8', name: 'Arthur Hughes', initials: 'AH', score: 89.9, difficulty: 'medium', lastPlayed: '2 days ago' },
    ],
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    subtext: 'Europe · DE Funknetz',
    communityAvg: 85.5,
    top10Benchmark: 98.3,
    activeWalkers: 1890,
    timeframeReset: '2d 04h',
    players: [
      { id: 'de-1', name: 'Lukas Weber', initials: 'LW', score: 98.8, difficulty: 'hard', streakDays: 13, lastPlayed: 'Today' },
      { id: 'de-2', name: 'Hannah Schmidt', initials: 'HS', score: 97.9, difficulty: 'medium', streakDays: 9, lastPlayed: 'Today', deltaPB: '+1.5% PB' },
      { id: 'de-3', name: 'Felix Müller', initials: 'FM', score: 97.1, difficulty: 'hard', streakDays: 6, lastPlayed: 'Today' },
      { id: 'de-4', name: 'Mia Fischer', initials: 'MF', score: 95.8, difficulty: 'medium', streakDays: 4, lastPlayed: 'Today' },
      { id: 'de-5', name: 'Maximilian Wagner', initials: 'MW', score: 94.3, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'de-6', name: 'Leon Becker', initials: 'LB', score: 92.7, difficulty: 'easy', lastPlayed: 'Yesterday' },
      { id: 'de-7', name: 'Sophie Hoffmann', initials: 'SH', score: 91.4, difficulty: 'medium', lastPlayed: '2 days ago' },
      { id: 'de-8', name: 'Jonas Richter', initials: 'JR', score: 90.2, difficulty: 'easy', lastPlayed: '3 days ago' },
    ],
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    subtext: 'East Asia · JP Carrier',
    communityAvg: 87.1,
    top10Benchmark: 99.2,
    activeWalkers: 3200,
    timeframeReset: '1d 12h',
    players: [
      { id: 'jp-1', name: 'Kenji Sato', initials: 'KS', score: 99.4, difficulty: 'hard', streakDays: 21, lastPlayed: 'Today' },
      { id: 'jp-2', name: 'Haruto Takahashi', initials: 'HT', score: 98.6, difficulty: 'medium', streakDays: 14, lastPlayed: 'Today', deltaPB: '+1.9% PB' },
      { id: 'jp-3', name: 'Yui Watanabe', initials: 'YW', score: 97.8, difficulty: 'hard', streakDays: 8, lastPlayed: 'Today' },
      { id: 'jp-4', name: 'Ren Kobayashi', initials: 'RK', score: 96.5, difficulty: 'medium', streakDays: 5, lastPlayed: 'Today' },
      { id: 'jp-5', name: 'Sakura Tanaka', initials: 'ST', score: 95.1, difficulty: 'easy', streakDays: 4, lastPlayed: 'Yesterday' },
      { id: 'jp-6', name: 'Daiki Ito', initials: 'DI', score: 93.9, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'jp-7', name: 'Aoi Nakamura', initials: 'AN', score: 92.3, difficulty: 'medium', lastPlayed: '2 days ago' },
      { id: 'jp-8', name: 'Kaito Yamamoto', initials: 'KY', score: 91.0, difficulty: 'easy', lastPlayed: '3 days ago' },
    ],
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    subtext: 'South America · BR Telecom',
    communityAvg: 84.3,
    top10Benchmark: 97.9,
    activeWalkers: 1950,
    timeframeReset: '3d 18h',
    players: [
      { id: 'br-1', name: 'Gabriel Silva', initials: 'GS', score: 98.4, difficulty: 'hard', streakDays: 11, lastPlayed: 'Today' },
      { id: 'br-2', name: 'Lucas Santos', initials: 'LS', score: 97.6, difficulty: 'medium', streakDays: 8, lastPlayed: 'Today', deltaPB: '+1.3% PB' },
      { id: 'br-3', name: 'Julia Oliveira', initials: 'JO', score: 96.7, difficulty: 'easy', streakDays: 6, lastPlayed: 'Today' },
      { id: 'br-4', name: 'Matheus Souza', initials: 'MS', score: 95.2, difficulty: 'hard', streakDays: 4, lastPlayed: 'Today' },
      { id: 'br-5', name: 'Beatriz Lima', initials: 'BL', score: 93.8, difficulty: 'medium', lastPlayed: 'Yesterday' },
      { id: 'br-6', name: 'Thiago Pereira', initials: 'TP', score: 92.4, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'br-7', name: 'Isabella Costa', initials: 'IC', score: 91.1, difficulty: 'easy', lastPlayed: '2 days ago' },
      { id: 'br-8', name: 'Rodrigo Alves', initials: 'RA', score: 89.8, difficulty: 'medium', lastPlayed: '3 days ago' },
    ],
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    subtext: 'Middle East · Gulf Network',
    communityAvg: 85.7,
    top10Benchmark: 98.5,
    activeWalkers: 1650,
    timeframeReset: '2d 09h',
    players: [
      { id: 'ae-1', name: 'Tariq Al-Maktoum', initials: 'TM', score: 98.9, difficulty: 'hard', streakDays: 15, lastPlayed: 'Today' },
      { id: 'ae-2', name: 'Noor Al-Hashimi', initials: 'NH', score: 98.0, difficulty: 'medium', streakDays: 10, lastPlayed: 'Today', deltaPB: '+1.7% PB' },
      { id: 'ae-3', name: 'Zayd Al-Otaibi', initials: 'ZO', score: 97.2, difficulty: 'hard', streakDays: 7, lastPlayed: 'Today' },
      { id: 'ae-4', name: 'Reem Al-Fassi', initials: 'RF', score: 95.9, difficulty: 'medium', streakDays: 5, lastPlayed: 'Today' },
      { id: 'ae-5', name: 'Omar Mansoor', initials: 'OM', score: 94.5, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'ae-6', name: 'Dana Al-Nuaimi', initials: 'DN', score: 93.1, difficulty: 'easy', lastPlayed: 'Yesterday' },
      { id: 'ae-7', name: 'Khalid Al-Dhaheri', initials: 'KD', score: 91.8, difficulty: 'medium', lastPlayed: '2 days ago' },
      { id: 'ae-8', name: 'Layla Al-Qasimi', initials: 'LQ', score: 90.4, difficulty: 'easy', lastPlayed: '3 days ago' },
    ],
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    subtext: 'North America · CA Mobile',
    communityAvg: 85.1,
    top10Benchmark: 98.1,
    activeWalkers: 1750,
    timeframeReset: '2d 20h',
    players: [
      { id: 'ca-1', name: 'Liam Tremblay', initials: 'LT', score: 98.6, difficulty: 'hard', streakDays: 12, lastPlayed: 'Today' },
      { id: 'ca-2', name: 'Chloe Bouchard', initials: 'CB', score: 97.7, difficulty: 'medium', streakDays: 8, lastPlayed: 'Today', deltaPB: '+1.4% PB' },
      { id: 'ca-3', name: 'Lucas Gagnon', initials: 'LG', score: 96.8, difficulty: 'hard', streakDays: 5, lastPlayed: 'Today' },
      { id: 'ca-4', name: 'Hannah Roy', initials: 'HR', score: 95.4, difficulty: 'easy', streakDays: 4, lastPlayed: 'Today' },
      { id: 'ca-5', name: 'Benjamin Cote', initials: 'BC', score: 93.9, difficulty: 'medium', lastPlayed: 'Yesterday' },
      { id: 'ca-6', name: 'Maya Leblanc', initials: 'ML', score: 92.5, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'ca-7', name: 'Felix Morin', initials: 'FM', score: 91.1, difficulty: 'easy', lastPlayed: '2 days ago' },
      { id: 'ca-8', name: 'Emma Fortin', initials: 'EF', score: 89.7, difficulty: 'medium', lastPlayed: '3 days ago' },
    ],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    subtext: 'Oceania · AU Wireless',
    communityAvg: 84.9,
    top10Benchmark: 98.1,
    activeWalkers: 1540,
    timeframeReset: '1d 22h',
    players: [
      { id: 'au-1', name: 'Jack Cooper', initials: 'JC', score: 98.6, difficulty: 'hard', streakDays: 11, lastPlayed: 'Today' },
      { id: 'au-2', name: 'Lachlan Kelly', initials: 'LK', score: 97.8, difficulty: 'medium', streakDays: 8, lastPlayed: 'Today', deltaPB: '+1.5% PB' },
      { id: 'au-3', name: 'Matilda Wilson', initials: 'MW', score: 96.9, difficulty: 'hard', streakDays: 6, lastPlayed: 'Today' },
      { id: 'au-4', name: 'Darcy O\'Connor', initials: 'DO', score: 95.5, difficulty: 'medium', streakDays: 4, lastPlayed: 'Today' },
      { id: 'au-5', name: 'Sienna Hughes', initials: 'SH', score: 94.1, difficulty: 'easy', lastPlayed: 'Yesterday' },
      { id: 'au-6', name: 'Bailey Murphy', initials: 'BM', score: 92.7, difficulty: 'hard', lastPlayed: 'Yesterday' },
      { id: 'au-7', name: 'Harper Jones', initials: 'HJ', score: 91.3, difficulty: 'medium', lastPlayed: '2 days ago' },
      { id: 'au-8', name: 'Archie Taylor', initials: 'AT', score: 90.0, difficulty: 'easy', lastPlayed: '2 days ago' },
    ],
  },
};

export class RegionService {
  private detectedCode: string = 'PK'; // default
  private isLocationDetected: boolean = false;
  private detectionSource: 'gps' | 'network' | 'timezone' | 'manual' = 'timezone';
  private cachedCoords: { lat: number; lon: number } | null = null;
  private listeners: Array<(region: RegionInfo) => void> = [];

  constructor() {
    this.detectFromTimezone();
    this.requestGpsDetection();
  }

  public getRegion(): RegionInfo {
    return TOP_REGIONS[this.detectedCode] || TOP_REGIONS.US;
  }

  public getAllRegions(): RegionInfo[] {
    return Object.values(TOP_REGIONS);
  }

  public getDetectionSource(): string {
    return this.detectionSource;
  }

  public getCachedCoords() {
    return this.cachedCoords;
  }

  public isAutoDetected(): boolean {
    return this.isLocationDetected;
  }

  public setRegion(code: string, manual = true) {
    if (TOP_REGIONS[code]) {
      this.detectedCode = code;
      if (manual) this.detectionSource = 'manual';
      this.notifyListeners();
    }
  }

  public subscribe(fn: (region: RegionInfo) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners() {
    const reg = this.getRegion();
    this.listeners.forEach((fn) => fn(reg));
  }

  // Resolve country code from (lat, lon) coordinates
  public resolveCountryFromCoords(lat: number, lon: number): string {
    // 1. Pakistan: ~23.5°N - 37.5°N, 60.5°E - 77.5°E
    if (lat >= 23.5 && lat <= 37.5 && lon >= 60.5 && lon <= 77.5) {
      return 'PK';
    }
    // 2. India: ~8.0°N - 37.0°N, 68.0°E - 97.5°E (excluding PK)
    if (lat >= 8.0 && lat <= 37.0 && lon >= 68.0 && lon <= 97.5) {
      return 'IN';
    }
    // 3. United States (Continental + AK + HI): lat 24.5 to 49.5 & lon -125 to -66.5, or HI/AK
    if (
      (lat >= 24.0 && lat <= 49.5 && lon >= -125.0 && lon <= -66.5) ||
      (lat >= 18.0 && lat <= 23.0 && lon >= -161.0 && lon <= -154.0) || // Hawaii
      (lat >= 51.0 && lat <= 72.0 && lon >= -170.0 && lon <= -130.0) // Alaska
    ) {
      return 'US';
    }
    // 4. Canada: lat 42.0 to 75.0, lon -141.0 to -52.0 (above US)
    if (lat >= 49.0 && lat <= 75.0 && lon >= -141.0 && lon <= -52.0) {
      return 'CA';
    }
    // 5. United Kingdom: lat 49.8 to 61.0, lon -8.6 to 2.0
    if (lat >= 49.8 && lat <= 61.0 && lon >= -8.6 && lon <= 2.0) {
      return 'GB';
    }
    // 6. Germany: lat 47.2 to 55.1, lon 5.8 to 15.1
    if (lat >= 47.2 && lat <= 55.1 && lon >= 5.8 && lon <= 15.1) {
      return 'DE';
    }
    // 7. Japan: lat 24.0 to 46.0, lon 122.0 to 154.0
    if (lat >= 24.0 && lat <= 46.0 && lon >= 122.0 && lon <= 154.0) {
      return 'JP';
    }
    // 8. Brazil: lat -34.0 to 5.5, lon -74.0 to -34.0
    if (lat >= -34.0 && lat <= 5.5 && lon >= -74.0 && lon <= -34.0) {
      return 'BR';
    }
    // 9. UAE & Gulf Region: lat 22.0 to 26.5, lon 51.0 to 56.5
    if (lat >= 16.0 && lat <= 32.0 && lon >= 34.0 && lon <= 56.5) {
      return 'AE';
    }
    // 10. Australia: lat -44.0 to -10.0, lon 113.0 to 154.0
    if (lat >= -44.0 && lat <= -10.0 && lon >= 113.0 && lon <= 154.0) {
      return 'AU';
    }

    // Default to PK or US
    return 'PK';
  }

  // Detect using device timezone and locale
  private detectFromTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const tzLower = tz.toLowerCase();

      if (tzLower.includes('karachi') || tzLower.includes('pakistan')) {
        this.detectedCode = 'PK';
      } else if (tzLower.includes('calcutta') || tzLower.includes('kolkata') || tzLower.includes('india')) {
        this.detectedCode = 'IN';
      } else if (
        tzLower.includes('new_york') ||
        tzLower.includes('chicago') ||
        tzLower.includes('los_angeles') ||
        tzLower.includes('denver') ||
        tzLower.includes('phoenix') ||
        tzLower.includes('america')
      ) {
        this.detectedCode = 'US';
      } else if (tzLower.includes('toronto') || tzLower.includes('vancouver') || tzLower.includes('montreal')) {
        this.detectedCode = 'CA';
      } else if (tzLower.includes('london')) {
        this.detectedCode = 'GB';
      } else if (tzLower.includes('berlin')) {
        this.detectedCode = 'DE';
      } else if (tzLower.includes('tokyo')) {
        this.detectedCode = 'JP';
      } else if (tzLower.includes('sao_paulo')) {
        this.detectedCode = 'BR';
      } else if (tzLower.includes('dubai') || tzLower.includes('riyadh')) {
        this.detectedCode = 'AE';
      } else if (tzLower.includes('sydney') || tzLower.includes('melbourne') || tzLower.includes('perth')) {
        this.detectedCode = 'AU';
      } else {
        this.detectedCode = 'PK';
      }
      this.detectionSource = 'timezone';
    } catch {
      this.detectedCode = 'PK';
    }
  }

  // Request high-accuracy mobile GPS & network location
  public requestGpsDetection(): Promise<string> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve(this.detectedCode);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.cachedCoords = { lat, lon };
          const matchedCountry = this.resolveCountryFromCoords(lat, lon);
          this.detectedCode = matchedCountry;
          this.isLocationDetected = true;
          this.detectionSource = 'gps';
          this.notifyListeners();
          resolve(matchedCountry);
        },
        (err) => {
          // If denied, fallback stays on timezone or previously detected
          resolve(this.detectedCode);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 60000,
        }
      );
    });
  }
}

export const regionService = new RegionService();
