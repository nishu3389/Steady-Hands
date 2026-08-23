import React, { useState } from 'react';
import { GameSettings, ThemeMode, UserProfile } from '../types';
import { Sun, Moon, Smartphone, Volume2, VolumeX, UserCheck, ShieldCheck } from 'lucide-react';
import { soundService } from '../services/audio';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  profile,
  onUpdateProfile,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const handleThemeChange = (theme: ThemeMode) => {
    if (settings.soundEnabled) soundService.playClick();
    onUpdateSettings({ ...settings, theme });
  };

  const handleSoundToggle = () => {
    const nextSound = !settings.soundEnabled;
    if (nextSound) soundService.playClick();
    onUpdateSettings({ ...settings, soundEnabled: nextSound });
  };

  const handleWalkToggle = () => {
    if (settings.soundEnabled) soundService.playClick();
    onUpdateSettings({ ...settings, walkSimulation: !settings.walkSimulation });
  };

  const handleSensitivityChange = (val: number) => {
    if (settings.soundEnabled) soundService.playClick();
    onUpdateSettings({ ...settings, sensitivity: val });
  };

  const handleGoogleSignIn = () => {
    if (settings.soundEnabled) soundService.playClick();
    if (profile.isSignedIn) {
      onUpdateProfile({ ...profile, isSignedIn: false });
    } else {
      onUpdateProfile({
        ...profile,
        isSignedIn: true,
        name: 'Alex Chen',
      });
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
      {/* Theme Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Theme</h2>
        <div className="flex bg-[#f2f4f7] dark:bg-[#162B3B] rounded-2xl p-1.5 shadow-inner w-full justify-between gap-1">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200 ${
              settings.theme === 'light'
                ? 'bg-[#ffffff] text-[#005f9e] shadow-sm font-bold'
                : 'text-[#404751] dark:text-[#c0c7d3] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            aria-label="Light Theme"
          >
            <Sun className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200 ${
              settings.theme === 'dark'
                ? 'bg-[#191c1e] text-[#9dcaff] shadow-sm font-bold'
                : 'text-[#404751] dark:text-[#c0c7d3] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            aria-label="Dark Theme"
          >
            <Moon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200 ${
              settings.theme === 'system'
                ? 'bg-[#e0e3e6] dark:bg-[#2d3133] text-[#005f9e] dark:text-[#9dcaff] shadow-sm font-bold'
                : 'text-[#404751] dark:text-[#c0c7d3] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            aria-label="System Theme"
          >
            <Smartphone className="w-5 h-5" />
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

      {/* Balance & Sensitivity Simulation */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-xl text-[#191c1e] dark:text-[#eff1f4]">Controls</h2>
        <div className="p-4 bg-white dark:bg-[#191c1e] rounded-2xl card-raised flex flex-col gap-4 border border-white/60 dark:border-transparent">
          <div className="flex items-center justify-between">
            <span className="font-medium text-base text-[#191c1e] dark:text-[#eff1f4]">
              Simulate Walking Footsteps
            </span>
            <button
              onClick={handleWalkToggle}
              className="relative w-14 h-8 bg-[#e0e3e6] dark:bg-[#050B10] rounded-full transition-colors duration-300 focus:outline-none p-1 neumorphic-inset"
              aria-label="Toggle Walking Wobble"
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.walkSimulation
                    ? 'translate-x-6 bg-[#005f9e] dark:bg-[#0078c6]'
                    : 'translate-x-0 bg-[#707882]'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-black/5 dark:border-white/5">
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
                      className="px-3 py-1 bg-[#005f9e] text-white rounded-lg text-xs font-bold"
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
                      className="text-xs text-[#005f9e] dark:text-[#9dcaff] underline"
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
