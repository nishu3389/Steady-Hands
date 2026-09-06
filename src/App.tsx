import React, { useState, useEffect, useRef } from 'react';
import { DifficultyLevel, GameResult, GameSettings, LeaderboardEntry, NavigationTab, UserProfile } from './types';
import { storageService } from './services/storage';
import { regionService, RegionInfo } from './services/regionService';
import { fetchMyBestScores, submitScore } from './services/firestore';
import { BottomNav } from './components/BottomNav';
import { PlayScreen } from './components/PlayScreen';
import { InstructionsScreen } from './components/InstructionsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { MatchResultsModal } from './components/MatchResultsModal';
import { InteractiveTutorialModal } from './components/InteractiveTutorialModal';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('play');
  const [settings, setSettings] = useState<GameSettings>(() => storageService.getSettings());
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [highScores, setHighScores] = useState(() => storageService.getHighScores());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => storageService.getLeaderboard());
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameSessionKey, setGameSessionKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [region, setRegion] = useState<RegionInfo>(() => regionService.getRegion());
  const hasFetchedCloudBestRef = useRef(false);

  // Region detection (network/GPS/timezone) and the regional player-name
  // pool it picks both run once here, at app launch, and are cached locally
  // by regionService -- never redone on the Rank screen itself, so opening
  // it is just reading an already-resolved value, no async work at all.
  useEffect(() => {
    const unsub = regionService.subscribe((newRegion) => {
      setRegion(newRegion);
    });
    regionService.fetchAndSaveLocation();
    return unsub;
  }, []);

  // Pull this player's cloud-saved best scores down into local storage
  // exactly once per app session (covers both "already signed in from a
  // previous session" at cold launch, and signing in fresh during this
  // session). There is no real global leaderboard to read here -- every
  // other row on the Rank screen is simulated data -- so this one read is
  // the only Firestore read the app ever does; everything else is a
  // write-only submit, and only when a round actually beats this reconciled
  // local best (see handleGameOver below).
  useEffect(() => {
    if (!profile.isSignedIn || !profile.uid || hasFetchedCloudBestRef.current) return;
    hasFetchedCloudBestRef.current = true;

    fetchMyBestScores(profile.uid)
      .then((cloudBest) => {
        if (!cloudBest) return;
        (['easy', 'medium', 'hard'] as DifficultyLevel[]).forEach((diff) => {
          storageService.saveHighScore(diff, cloudBest[diff]);
        });
        setHighScores(storageService.getHighScores());
      })
      .catch(() => {
        // Ignore -- local high scores stay authoritative if this fails.
      });
  }, [profile.isSignedIn, profile.uid]);

  // Check first launch: show animated tutorial if not seen before
  useEffect(() => {
    const hasSeen = localStorage.getItem('steady_hands_tutorial_seen');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  const handleOpenTutorial = () => {
    setShowTutorial(true);
  };

  const handleCloseTutorial = () => {
    localStorage.setItem('steady_hands_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const handleCompleteTutorial = () => {
    localStorage.setItem('steady_hands_tutorial_seen', 'true');
    setShowTutorial(false);
    setActiveTab('play');
  };

  const handleBack = () => {
    setGameResult(null);
    setIsGameActive(false);
    setGameSessionKey((prev) => prev + 1);
  };

  // Apply Day / Night / System Theme
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const computeIsDark = () => {
      if (settings.theme === 'dark') return true;
      if (settings.theme === 'light') return false;
      return mediaQuery ? mediaQuery.matches : false;
    };

    const applyTheme = () => {
      const darkActive = computeIsDark();
      if (darkActive) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.backgroundColor = '#0f172a';
        root.style.color = '#eff1f4';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.backgroundColor = '#f0f4f8';
        root.style.color = '#0f172a';
      }
    };

    applyTheme();

    if (settings.theme === 'system' && mediaQuery) {
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Apply Font Size scaling globally to root element
  useEffect(() => {
    const root = document.documentElement;
    switch (settings.fontSize) {
      case 'medium':
        root.style.fontSize = '110%';
        break;
      case 'large':
        root.style.fontSize = '120%';
        break;
      case 'default':
      default:
        root.style.fontSize = '100%';
        break;
    }
  }, [settings.fontSize]);

  // Handle Game Over
  const handleGameOver = (result: GameResult) => {
    setIsGameActive(false);
    setGameResult(result);

    if (result.isWin) {
      // Save high score -- also tells us whether this round is actually a
      // new personal best, which is the only case that should ever reach
      // Firestore (see the submitScore call below).
      const isNewBest = storageService.saveHighScore(result.difficulty, result.finalScore);
      setHighScores(storageService.getHighScores());

      // Update streak
      const updatedStreak = storageService.updateStreak();
      setProfile((prev) => ({ ...prev, streak: updatedStreak }));

      // Add to leaderboard
      const targetDuration = result.targetDuration || (result.totalDuration >= 75 ? 90 : result.totalDuration >= 52 ? 60 : 45);
      storageService.addLeaderboardEntry({
        name: profile.name,
        score: result.finalScore,
        difficulty: result.difficulty,
        duration: targetDuration,
        waterRemaining: result.waterRemaining,
      });
      setLeaderboard(storageService.getLeaderboard());

      // Save to the cloud -- only for signed-in players, only the app
      // itself does this right when a round finishes (never a user-editable
      // action), and only when it's an actual new personal best. Best-effort:
      // the local save above already happened regardless of network/Firestore
      // availability.
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
    }
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkMode =
    settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);

  return (
    <div className="h-full bg-[#f0f4f9] dark:bg-[#191c1e] text-[#191c1e] dark:text-[#eff1f4] flex flex-col justify-between transition-colors duration-200">
      {/* Main Content Area — the actual scroll container now (html/body/#root
          are locked to the viewport, see index.css), so scrolling is fully
          isolated from the fixed bottom nav instead of bouncing the whole
          document. min-h-0 is required here: a flex child with flex-1 won't
          actually shrink/scroll without it (flex items default to
          min-height: auto, which fights overflow). */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col justify-start">
        {/* mode="wait" holds <main> completely empty for the full exit
            duration before mounting the next screen -- most noticeable
            going from a finished round straight into the results screen,
            where it read as a white flash. Each screen's own exit is set to
            a much shorter duration below (independent of its 0.2s entrance
            fade) so that gap is imperceptible, without switching away from
            "wait" and risking two screens' content overlapping/stacking
            mid-crossfade (none of these are absolutely positioned). */}
        <AnimatePresence mode="wait">
          {gameResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.06 } }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <MatchResultsModal
                result={gameResult}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onTryAgain={() => setGameResult(null)}
                onOpenLeaderboard={() => {
                  setGameResult(null);
                  setActiveTab('leaderboard');
                }}
                soundEnabled={settings.soundEnabled}
              />
            </motion.div>
          ) : activeTab === 'play' ? (
            <motion.div
              key={`play-${gameSessionKey}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.06 } }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col"
            >
              <PlayScreen
                key={gameSessionKey}
                settings={settings}
                profile={profile}
                highScores={highScores}
                onGameOver={handleGameOver}
                isDarkMode={isDarkMode}
                onGameActiveChange={setIsGameActive}
                onQuitGame={handleBack}
              />
            </motion.div>
          ) : activeTab === 'instructions' ? (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.06 } }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <InstructionsScreen
                onGotIt={() => setActiveTab('play')}
                soundEnabled={settings.soundEnabled}
                onOpenTutorial={handleOpenTutorial}
              />
            </motion.div>
          ) : activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.06 } }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <LeaderboardScreen
                entries={leaderboard}
                onPlayNow={() => setActiveTab('play')}
                soundEnabled={settings.soundEnabled}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                region={region}
              />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.06 } }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <SettingsScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onOpenTutorial={handleOpenTutorial}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Interactive Step-by-Step Animated Tutorial Modal */}
      <InteractiveTutorialModal
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        onComplete={handleCompleteTutorial}
        soundEnabled={settings.soundEnabled}
      />

      {/* Bottom Tab Bar (hidden while playing, during match results, or while tutorial is active) */}
      {!gameResult && !isGameActive && !showTutorial && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setGameResult(null);
            setActiveTab(tab);
          }}
          soundEnabled={settings.soundEnabled}
        />
      )}
    </div>
  );
}
