import { useEffect, useState } from 'react';
import { PlayScreen } from './components/PlayScreen';
import { MatchResultsModal } from './components/MatchResultsModal';
import { storageService } from './services/storage';
import { regionService } from './services/regionService';
import { submitScore } from './services/firestore';
import { DifficultyLevel, GameResult, UserProfile } from './types';

function returnToCompose() {
  const cap = (window as any).Capacitor;
  if (cap?.Plugins?.EngineSwitch?.switchToCompose) {
    cap.Plugins.EngineSwitch.switchToCompose();
  }
}

interface GameStandaloneProps {
  // Compose's resolved Day/Night state, passed in via the "open_game" intent
  // extra -> EngineSwitchPlugin.getLaunchOptions(). When present, this wins
  // over the web app's own theme setting so the screen matches whatever mode
  // was active in Compose when Start was tapped, instead of computing its
  // own independently.
  forcedDarkMode?: boolean;
}

// Rendered instead of <App /> when launched natively with the "open_game"
// intent extra (see EngineSwitchPlugin.getLaunchOptions in android/) --
// mirrors App.tsx's play/result wiring (handleGameOver, handleBack) but
// standalone, full-screen, with no bottom nav or other tabs mounted.
// Quitting or leaving for the leaderboard hands control back to Compose.
export default function GameStandalone({ forcedDarkMode }: GameStandaloneProps) {
  const [settings] = useState(() => storageService.getSettings());
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [highScores, setHighScores] = useState(() => storageService.getHighScores());
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [region, setRegion] = useState(() => regionService.getRegion());

  useEffect(() => {
    const unsub = regionService.subscribe(setRegion);
    regionService.fetchAndSaveLocation();
    return unsub;
  }, []);

  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkMode =
    forcedDarkMode ?? (settings.theme === 'dark' || (settings.theme === 'system' && prefersDark));

  // App.tsx normally owns toggling the `dark` class on <html> (Tailwind's
  // `dark:` variants read it, not the isDarkMode prop directly) -- this
  // standalone screen never mounts App.tsx, so it has to do that itself.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const handleGameOver = (result: GameResult) => {
    setGameResult(result);
    if (!result.isWin) return;

    const isNewBest = storageService.saveHighScore(result.difficulty, result.finalScore);
    setHighScores(storageService.getHighScores());

    const updatedStreak = storageService.updateStreak();
    setProfile((prev) => ({ ...prev, streak: updatedStreak }));

    const targetDuration =
      result.targetDuration || (result.totalDuration >= 75 ? 90 : result.totalDuration >= 52 ? 60 : 45);
    storageService.addLeaderboardEntry({
      name: profile.name,
      score: result.finalScore,
      difficulty: result.difficulty as DifficultyLevel,
      duration: targetDuration,
      waterRemaining: result.waterRemaining,
    });

    if (isNewBest && profile.isSignedIn && profile.uid) {
      submitScore({
        uid: profile.uid,
        displayName: profile.name,
        photoUrl: profile.avatarUrl,
        countryCode: region.code,
        difficulty: result.difficulty,
        score: result.finalScore,
        streak: updatedStreak,
      }).catch(() => {
        // Ignore -- the player's progress is already saved locally.
      });
    }
  };

  const handleTryAgain = () => {
    setGameResult(null);
    setSessionKey((k) => k + 1);
  };

  if (gameResult) {
    return (
      <MatchResultsModal
        result={gameResult}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onTryAgain={handleTryAgain}
        onOpenLeaderboard={returnToCompose}
        soundEnabled={settings.soundEnabled}
      />
    );
  }

  return (
    <PlayScreen
      key={sessionKey}
      settings={settings}
      profile={profile}
      highScores={highScores}
      onGameOver={handleGameOver}
      isDarkMode={isDarkMode}
      onQuitGame={returnToCompose}
    />
  );
}
