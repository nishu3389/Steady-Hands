import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import TutorialStandalone from './TutorialStandalone.tsx';
import GameStandalone from './GameStandalone.tsx';
import './index.css';

const LAST_DARK_MODE_KEY = 'steady_hands_last_dark_mode';

function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
}

// Best-effort optimistic guess from the last time a screen launched from
// Compose, applied immediately -- before the async native round trip below,
// before React even mounts -- so there's no default-light flash while that
// resolves. Harmless if it turns out wrong: the real value (read below)
// corrects it before anything is drawn.
try {
  const cached = localStorage.getItem(LAST_DARK_MODE_KEY);
  if (cached !== null) applyThemeClass(cached === 'true');
} catch {
  // Ignore -- localStorage can throw in some contexts (private mode, etc).
}

async function bootstrap() {
  let openTutorial = false;
  let openGame = false;
  let isDarkMode: boolean | undefined;
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.EngineSwitch?.getLaunchOptions) {
      const options = await cap.Plugins.EngineSwitch.getLaunchOptions();
      openTutorial = !!options?.openTutorial;
      openGame = !!options?.openGame;
      if (typeof options?.isDarkMode === 'boolean') {
        isDarkMode = options.isDarkMode;
        // Read the mode, apply it, THEN draw the views below -- the class
        // is already correct before the first paint, instead of flipping
        // after mount (which is what caused the day/night blink).
        applyThemeClass(isDarkMode);
        try {
          localStorage.setItem(LAST_DARK_MODE_KEY, String(isDarkMode));
        } catch {
          // Ignore -- persistence is a nice-to-have, not required.
        }
      }
    }
  } catch {
    // Not running under Capacitor (or the plugin call failed) -- fall back
    // to the normal app shell.
  }

  const screen = openTutorial ? (
    <TutorialStandalone forcedDarkMode={isDarkMode} />
  ) : openGame ? (
    <GameStandalone forcedDarkMode={isDarkMode} />
  ) : (
    <App />
  );

  createRoot(document.getElementById('root')!).render(
    <StrictMode>{screen}</StrictMode>,
  );
}

bootstrap();
