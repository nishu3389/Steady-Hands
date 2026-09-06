import { DifficultyLevel, DurationOption, GameSettings, LeaderboardEntry, UserProfile } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'steady_hands_settings',
  PROFILE: 'steady_hands_profile',
  HIGH_SCORES: 'steady_hands_high_scores',
  LEADERBOARD: 'steady_hands_leaderboard',
};

const DEFAULT_SETTINGS: GameSettings = {
  theme: 'light',
  soundEnabled: true,
  vibrationEnabled: true,
  sensitivity: 1.0,
  fontSize: 'default',
  defaultDuration: 60,
  walkingModeEnabled: true,
  distanceUnit: 'both',
  walkingSensitivity: 'high',
  gpsEnabled: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Guest Player',
  avatarUrl: '',
  isSignedIn: false,
  streak: 0,
  lastPlayedDate: new Date().toISOString(),
};

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    name: 'Alex Chen',
    score: 96.5,
    difficulty: 'hard',
    duration: 60,
    waterRemaining: 98.5,
    date: '2026-08-22',
    isUser: true,
  },
  {
    id: 'lb-2',
    name: 'Sarah Jones',
    score: 93.4,
    difficulty: 'medium',
    duration: 45,
    waterRemaining: 94.2,
    date: '2026-08-21',
  },
  {
    id: 'lb-3',
    name: 'Mike T.',
    score: 91.0,
    difficulty: 'hard',
    duration: 45,
    waterRemaining: 91.8,
    date: '2026-08-20',
  },
  {
    id: 'lb-4',
    name: 'Emma W.',
    score: 88.0,
    difficulty: 'easy',
    duration: 45,
    waterRemaining: 88.0,
    date: '2026-08-19',
  },
  {
    id: 'lb-5',
    name: 'Liam Vance',
    score: 84.6,
    difficulty: 'medium',
    duration: 60,
    waterRemaining: 84.6,
    date: '2026-08-18',
  },
  {
    id: 'lb-6',
    name: 'Chloe Zhang',
    score: 81.2,
    difficulty: 'hard',
    duration: 90,
    waterRemaining: 81.2,
    date: '2026-08-17',
  }
];

export const storageService = {
  getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  },

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return DEFAULT_PROFILE;
      const parsed = JSON.parse(data);
      if (parsed.name === 'Alex Chen' && !parsed.email) {
        return DEFAULT_PROFILE;
      }
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  },

  getHighScores(): Record<DifficultyLevel, number> {
    const defaults: Record<DifficultyLevel, number> = {
      easy: 94,
      medium: 91,
      hard: 88,
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      if (!data) return defaults;
      const parsed = JSON.parse(data);
      // Migrate legacy 'normal' key to 'medium'
      if (parsed.normal && !parsed.medium) {
        parsed.medium = parsed.normal;
      }
      const normalize = (val: any, def: number) => {
        if (typeof val !== 'number' || isNaN(val)) return def;
        // Normalize legacy scores that were > 100
        if (val > 100) return Math.min(99, Math.round(val / 2.2));
        return Math.min(100, Math.max(0, Math.round(val)));
      };

      return {
        easy: normalize(parsed.easy, defaults.easy),
        medium: normalize(parsed.medium, defaults.medium),
        hard: normalize(parsed.hard, defaults.hard),
      };
    } catch {
      return defaults;
    }
  },

  saveHighScore(difficulty: DifficultyLevel, score: number): boolean {
    const scores = this.getHighScores();
    const cleanScore = Math.min(100, Math.max(0, Math.round(score)));
    if (cleanScore > (scores[difficulty] || 0)) {
      scores[difficulty] = cleanScore;
      try {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  },

  getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (!data) return INITIAL_LEADERBOARD;
      const parsed = JSON.parse(data) as any[];
      // Migrate any legacy difficulties & scores in existing stored leaderboard
      return parsed.map((item) => {
        let diff: DifficultyLevel = 'medium';
        if (item.difficulty === 'easy') diff = 'easy';
        else if (item.difficulty === 'hard' || item.difficulty === 'expert' || item.difficulty === 'master') diff = 'hard';
        else diff = 'medium';

        let dur: DurationOption = 45;
        if (item.duration === 90) dur = 90;
        else if (item.duration === 60) dur = 60;
        else dur = 45;

        let score = typeof item.score === 'number' ? item.score : 85;
        if (score > 100) {
          // Normalize legacy score
          score = item.waterRemaining ? Math.min(99, item.waterRemaining) : Math.min(99, Math.round(score / 2.2));
        }

        return {
          ...item,
          score: Math.min(100, Math.max(0, Math.round(score * 10) / 10)),
          difficulty: diff,
          duration: dur,
        };
      });
    } catch {
      return INITIAL_LEADERBOARD;
    }
  },

  addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const current = this.getLeaderboard();
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: 'lb-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      isUser: true,
    };
    
    // Sort descending by score
    const updated = [newEntry, ...current].sort((a, b) => b.score - a.score);
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    return newEntry;
  },

  updateStreak(): number {
    const profile = this.getProfile();
    const today = new Date().toDateString();
    const lastPlayed = new Date(profile.lastPlayedDate).toDateString();
    
    if (today !== lastPlayed) {
      profile.streak += 1;
      profile.lastPlayedDate = new Date().toISOString();
      this.saveProfile(profile);
    }
    return profile.streak;
  }
};
