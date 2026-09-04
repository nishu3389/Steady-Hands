export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type DurationOption = 45 | 60 | 90;
export type NavigationTab = 'play' | 'instructions' | 'leaderboard' | 'settings';
export type GameMode = 'lobby' | 'playing' | 'result';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSizeOption = 'default' | 'medium' | 'large';
export type DistanceUnit = 'feet' | 'meters' | 'both';
export type WalkingSensitivity = 'high' | 'medium' | 'low';
export type GpsStatus = 'active' | 'searching' | 'unavailable' | 'off';

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
  fontSize: FontSizeOption;
  walkingModeEnabled: boolean; // Must walk to play
  distanceUnit: DistanceUnit; // 'feet' | 'meters' | 'both'
  walkingSensitivity?: WalkingSensitivity; // 'high' (Steady Hands/Mindful) | 'medium' | 'low'
  gpsEnabled?: boolean;
}

export interface SteadinessBreakdown {
  stillnessScore: number; // 0 - 100% (fluid calmness and safe zone presence)
  rhythmScore: number; // 0 - 100% (walking cadence and pace consistency)
  postureScore: number; // 0 - 100% (micro-tremor and tilt control)
  timeInSafeZoneSec: number;
  totalTimeSec: number;
  safeZoneRatio: number; // 0.0 - 1.0
  gradeTitle: string; // e.g. "Flow State", "Mindful Balance", "Grounded Focus"
  gradeIcon: string;
  feedback: string;
}

export interface GameResult {
  isWin: boolean;
  finalScore: number; // Body Steadiness Index (0 - 100%)
  steadinessScore: number; // 0 - 100%
  steadinessBreakdown: SteadinessBreakdown;
  waterRemaining: number; // percentage (0 - 100)
  totalDuration: number;
  targetDuration?: DurationOption;
  difficulty: DifficultyLevel;
  spilledAmount: number;
  isNewBest: boolean;
  stepsTaken?: number;
  distanceMeters?: number;
  distanceFeet?: number;
  cadence?: number;
  streakBonus?: number;
}
