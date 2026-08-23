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
  walkSimulation: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Chen',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsTmal7IwMa9qg0mxMcIt-ZBhVllEW5OQAS6Vwq_I1ba_iOjsL4V0b-Rw895bB8AjIi1Lf01-6bEmJVaza08UR8Xli84OyVPP2rshQYp6lV6l2ohQdJ3-bUgrxvv2WxpbznUxTWcsXSlYabAb3GO4iCS3Doioj_klSUMrFxR21FjnzPY7bsMiAI2U2yzemWN924j38-uWYHAPMr5nFuNzL-9KUO4ukXRQfcAmmRVLQ5pWg4DlL7i2u',
  isSignedIn: true,
  streak: 12,
  lastPlayedDate: new Date().toISOString(),
};

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    name: 'Alex Chen',
    score: 98.5,
    difficulty: 'hard',
    duration: 30,
    waterRemaining: 98.5,
    date: '2026-08-22',
    isUser: true,
  },
  {
    id: 'lb-2',
    name: 'Sarah Jones',
    score: 94.2,
    difficulty: 'normal',
    duration: 30,
    waterRemaining: 94.2,
    date: '2026-08-21',
  },
  {
    id: 'lb-3',
    name: 'Mike T.',
    score: 91.8,
    difficulty: 'hard',
    duration: 30,
    waterRemaining: 91.8,
    date: '2026-08-20',
  },
  {
    id: 'lb-4',
    name: 'Emma W.',
    score: 88.0,
    difficulty: 'easy',
    duration: 20,
    waterRemaining: 88.0,
    date: '2026-08-19',
  },
  {
    id: 'lb-5',
    name: 'Liam Vance',
    score: 84.6,
    difficulty: 'normal',
    duration: 30,
    waterRemaining: 84.6,
    date: '2026-08-18',
  },
  {
    id: 'lb-6',
    name: 'Chloe Zhang',
    score: 81.2,
    difficulty: 'expert',
    duration: 60,
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
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
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
      easy: 165,
      normal: 142,
      hard: 158,
      expert: 120,
      master: 95,
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch {
      return defaults;
    }
  },

  saveHighScore(difficulty: DifficultyLevel, score: number): boolean {
    const scores = this.getHighScores();
    if (score > (scores[difficulty] || 0)) {
      scores[difficulty] = score;
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
      return data ? JSON.parse(data) : INITIAL_LEADERBOARD;
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
