import React, { useState, useEffect } from 'react';
import { GameSettings, ThemeMode, UserProfile } from '../types';
import {
  Volume2,
  VolumeX,
  User,
  UserCheck,
  ShieldCheck,
  Activity,
  Sparkles,
  Play,
  Mail,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { soundService } from '../services/audio';
import { walkingDetector } from '../services/walkingDetector';
import { signInWithGoogle, signOutFromGoogle, isGoogleAuthConfigured } from '../services/googleAuth';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onOpenTutorial?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  profile,
  onUpdateProfile,
  onOpenTutorial,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [isTestingSensors, setIsTestingSensors] = useState(false);
  const [testState, setTestState] = useState(() => walkingDetector.getState());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync name input when profile updates
  useEffect(() => {
    setNameInput(profile.name);
  }, [profile.name]);

  useEffect(() => {
    if (!isTestingSensors) return;
    walkingDetector.setSensitivity(settings.walkingSensitivity || 'high');
    walkingDetector.setGpsEnabled(settings.gpsEnabled !== false);
    walkingDetector.reset();
    walkingDetector.start();
    const unsubStep = walkingDetector.onStep((st) => setTestState(st));
    const unsubState = walkingDetector.onStateChange((_, st) => setTestState(st));
    const interval = setInterval(() => {
      setTestState(walkingDetector.getState());
    }, 250);

    return () => {
      unsubStep();
      unsubState();
      clearInterval(interval);
      walkingDetector.stop();
    };
  }, [isTestingSensors, settings.walkingSensitivity, settings.gpsEnabled]);

  const handleThemeChange = (theme: ThemeMode) => {
    if (settings.soundEnabled) soundService.playClick();
    onUpdateSettings({ ...settings, theme });
  };

  const handleSoundToggle = () => {
    const nextSound = !settings.soundEnabled;
    if (nextSound) soundService.playClick();
    onUpdateSettings({ ...settings, soundEnabled: nextSound });
  };

  const handleSensitivityChange = (val: number) => {
    if (settings.soundEnabled) soundService.playClick();
    onUpdateSettings({ ...settings, sensitivity: val });
  };

  const handleGoogleSignIn = async () => {
    if (settings.soundEnabled) soundService.playClick();
    setAuthError(null);

    // If currently signed in, sign out
    if (profile.isSignedIn) {
      try {
        await signOutFromGoogle(profile.email);
      } catch {
        // Ignore sign-out cleanup errors
      }
      onUpdateProfile({
        ...profile,
        isSignedIn: false,
        name: 'Guest Player',
        avatarUrl: '',
        email: undefined,
      });
      setNameInput('Guest Player');
      return;
    }

    // Launch Google Sign-In flow
    setIsSigningIn(true);
    try {
      const googleUser = await signInWithGoogle();
      onUpdateProfile({
        ...profile,
        isSignedIn: true,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        email: googleUser.email,
      });
      setNameInput(googleUser.name);
    } catch (err: unknown) {
      const error = err as Error;
      setAuthError(error.message || 'Google Sign-In could not be completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateProfile({ ...profile, name: nameInput.trim() });
      setEditingName(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto p-4 sm:p-6 gap-6 pb-28 pt-6">
      {/* Game Tutorial & Guide Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">How to Play</h2>
        <div className="p-4 bg-white dark:bg-[#191c1e] rounded-2xl card-raised flex flex-col gap-3.5 border border-white/60 dark:border-transparent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eef4fb] dark:bg-[#152331] text-[#005f9e] dark:text-[#9dcaff] flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-[#191c1e] dark:text-[#eff1f4]">
                Animated Tutorial
              </span>
              <p className="text-xs text-[#5a626f] dark:text-[#a0a8b4] leading-relaxed mt-0.5">
                4-step animated walkthrough teaching level calibration, walking rhythm, spill prevention, and steadiness scores.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (settings.soundEnabled) soundService.playClick();
              onOpenTutorial?.();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#005f9e] dark:bg-[#9dcaff] text-white dark:text-[#003258] font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer hover:opacity-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Animated Tutorial</span>
          </button>
        </div>
      </section>

      {/* Audio Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Audio</h2>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#191c1e] rounded-2xl card-raised border border-white/60 dark:border-transparent">
          <div className="flex items-center gap-3 text-[#191c1e] dark:text-[#eff1f4]">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-[#005f9e] dark:text-[#9dcaff]" />
            ) : (
              <VolumeX className="w-5 h-5 text-[#707882]" />
            )}
            <span className="font-medium text-base">Sound Effects</span>
          </div>

          {/* Neumorphic Toggle Switch */}
          <button
            onClick={handleSoundToggle}
            className="relative w-14 h-8 bg-[#e0e3e6] dark:bg-[#050B10] rounded-full transition-colors duration-300 focus:outline-none p-1 neumorphic-inset"
            aria-label="Toggle Sound Effects"
          >
            <div
              className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                settings.soundEnabled
                  ? 'translate-x-6 bg-[#005f9e] dark:bg-[#0078c6]'
                  : 'translate-x-0 bg-[#707882]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Sensor Diagnostics / Test Sensors Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Sensor Diagnostics</h2>
        <div className="p-4 bg-white dark:bg-[#191c1e] rounded-2xl card-raised flex flex-col gap-3.5 border border-white/60 dark:border-transparent">
          <div className="flex items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-3 text-[#191c1e] dark:text-[#eff1f4] min-w-0 flex-1">
              <Activity className="w-5 h-5 text-[#005f9e] dark:text-[#9dcaff] shrink-0" />
              <div className="flex flex-col min-w-0 pr-1 sm:pr-2">
                <span className="font-medium text-base leading-snug">Test Device Sensors</span>
                <span className="text-xs text-[#707882] dark:text-[#a0a8b4] mt-0.5 leading-normal">
                  Verify walking detection on this phone
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (settings.soundEnabled) soundService.playClick();
                setIsTestingSensors(!isTestingSensors);
              }}
              className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95 ${
                isTestingSensors
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#005f9e] hover:bg-[#004f84] text-white'
              }`}
            >
              {isTestingSensors ? 'Stop Test' : 'Test Sensors'}
            </button>
          </div>

          {isTestingSensors && (
            <div className="p-3 bg-[#e9edf2]/70 dark:bg-[#101b24] rounded-xl border border-black/5 dark:border-white/5 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#707882] dark:text-[#a0a8b4]">Walking Status:</span>
                <span
                  className={`font-black px-2 py-0.5 rounded-full uppercase text-[10px] ${
                    testState.isWalking
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {testState.isWalking ? 'Walking Detected' : 'Stationary / Paused'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#707882] dark:text-[#a0a8b4]">Steps Detected:</span>
                <span className="font-bold text-[#191c1e] dark:text-[#eff1f4]">
                  {testState.steps} steps
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#707882] dark:text-[#a0a8b4]">GPS Status:</span>
                <span className="font-semibold capitalize text-[#005f9e] dark:text-[#9dcaff]">
                  {testState.gpsStatus} {testState.gpsSpeedMps > 0 ? `(${Math.round(testState.gpsSpeedMps * 3.6)} km/h)` : ''}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-[#707882] dark:text-[#a0a8b4]">
                  <span>Motion Intensity:</span>
                  <span className="font-mono font-bold text-[#191c1e] dark:text-[#eff1f4]">
                    {Math.round(testState.motionEnergy * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#d2d7df] dark:bg-[#1e2f3e] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      testState.isWalking ? 'bg-emerald-500' : 'bg-[#005f9e]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, testState.motionEnergy * 100))}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-[#707882] dark:text-[#8a94a2] italic pt-1 border-t border-black/5 dark:border-white/5">
                Hold device flat and steady in your palms and take a few gentle steps. The meter and status will update automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Balance & Sensitivity Simulation */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Controls</h2>
        <div className="p-4 bg-white dark:bg-[#191c1e] rounded-2xl card-raised flex flex-col gap-4 border border-white/60 dark:border-transparent">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-[#404751] dark:text-[#c0c7d3]">
              <span>Tilt Sensitivity</span>
              <span className="font-bold text-[#005f9e] dark:text-[#9dcaff]">
                {settings.sensitivity === 0.75
                  ? 'Gentle (0.75x)'
                  : settings.sensitivity === 1.0
                  ? 'Standard (1.0x)'
                  : 'High (1.5x)'}
              </span>
            </div>
            <div className="flex bg-[#e9edf2] dark:bg-[#162B3B] rounded-xl p-1 shadow-inner gap-1">
              {[0.75, 1.0, 1.5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleSensitivityChange(val)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.sensitivity === val
                      ? 'bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] shadow-sm'
                      : 'text-[#404751] dark:text-[#c0c7d3]'
                  }`}
                >
                  {val === 0.75 ? 'Gentle' : val === 1.0 ? 'Normal' : 'High'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Account</h2>
        <div className="flex flex-col items-center p-6 bg-white dark:bg-[#191c1e] rounded-2xl card-raised gap-4 border border-white/60 dark:border-transparent">
          <div className="w-16 h-16 rounded-full bg-[#e0e3e6] dark:bg-[#2d3133] flex items-center justify-center text-[#404751] dark:text-[#c0c7d3] overflow-hidden">
            {profile.isSignedIn ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCheck className="w-8 h-8 text-[#707882]" />
            )}
          </div>

          <div className="text-center w-full">
            {profile.isSignedIn ? (
              <div className="flex flex-col items-center">
                {editingName ? (
                  <div className="flex gap-2 w-full max-w-[220px]">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg neumorphic-inset bg-transparent text-center font-bold text-sm text-[#191c1e] dark:text-[#eff1f4] focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-3 py-1 bg-[#005f9e] text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-[#191c1e] dark:text-[#eff1f4]">
                      {profile.name}
                    </span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-[#005f9e] dark:text-[#9dcaff] underline cursor-pointer"
                    >
                      edit
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-[#34A853] font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Google Connected
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#404751] dark:text-[#c0c7d3]">
                Sign in to save your scores and compete on the global leaderboard.
              </p>
            )}
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-full bg-white dark:bg-[#191c1e] neumorphic-raised text-[#191c1e] dark:text-[#eff1f4] font-medium hover:bg-[#f2f4f7] dark:hover:bg-[#222a36] transition-all active:neumorphic-inset mt-1 cursor-pointer border border-white/80 dark:border-transparent"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {profile.isSignedIn ? 'Sign out of Google' : 'Sign in with Google'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex justify-center mt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#707882]/70">
          Version 1.0.2
        </p>
      </div>
    </div>
  );
};
