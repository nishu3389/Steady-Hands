import { useEffect } from 'react';
import { InteractiveTutorialModal } from './components/InteractiveTutorialModal';
import { storageService } from './services/storage';

interface TutorialStandaloneProps {
  // Compose's resolved Day/Night state, passed in via the "open_tutorial"
  // intent extra -> EngineSwitchPlugin.getLaunchOptions(). When present,
  // this wins over the web app's own theme setting so the screen matches
  // whatever mode was active in Compose, instead of computing its own.
  forcedDarkMode?: boolean;
}

// Rendered instead of <App /> when launched natively with the
// "open_tutorial" intent extra (see EngineSwitchPlugin.getLaunchOptions in
// android/) -- shows only the tutorial, full-screen, with no app shell
// underneath. Finishing it hands control back to the native Compose UI.
export default function TutorialStandalone({ forcedDarkMode }: TutorialStandaloneProps) {
  const settings = storageService.getSettings();
  const soundEnabled = settings.soundEnabled;

  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkMode =
    forcedDarkMode ?? (settings.theme === 'dark' || (settings.theme === 'system' && prefersDark));

  // App.tsx normally owns toggling the `dark` class on <html> (Tailwind's
  // `dark:` variants read it, not a prop) -- this standalone screen never
  // mounts App.tsx, so it has to do that itself.
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

  const handleDone = () => {
    localStorage.setItem('steady_hands_tutorial_seen', 'true');
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.EngineSwitch?.switchToCompose) {
      cap.Plugins.EngineSwitch.switchToCompose();
    }
  };

  return (
    <InteractiveTutorialModal
      isOpen={true}
      onClose={handleDone}
      onComplete={handleDone}
      soundEnabled={soundEnabled}
    />
  );
}
