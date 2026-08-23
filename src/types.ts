export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert' | 'master';
export type DurationOption = 20 | 30 | 60;
export type NavigationTab = 'play' | 'instructions' | 'leaderboard' | 'settings';
export type GameMode = 'lobby' | 'playing' | 'result';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  difficulty: DifficultyLevel;
  duration: DurationOption;
  waterRemaining: number;
  date: string;
  isUser?: boolean;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  isSignedIn: boolean;
  streak: number;
  lastPlayedDate: string;
}

export interface GameSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  sensitivity: number; // 0.5 to 2.0
}

export interface GameResult {
  isWin: boolean;
  finalScore: number;
  waterRemaining: number; // percentage (0 - 100)
  totalDuration: number;
  difficulty: DifficultyLevel;
  spilledAmount: number;
  isNewBest: boolean;
}
