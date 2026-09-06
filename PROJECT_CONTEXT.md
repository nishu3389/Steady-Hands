# Steady Hands — Project Context

> Paste this whole document into any AI tool (ChatGPT, Claude, Gemini, etc.) to give it full context on this project before asking questions.

## 1. What this project is

**Steady Hands** (a.k.a. "Steady Hands: Zen Balance") is a mobile-first, tactile "mindful balance" game: the player holds their phone flat like a bowl of water and must keep it steady (and, in the main mode, physically **walk**) without spilling the water, for a chosen duration. It's positioned as a mindfulness/meditation-adjacent game (Kinhin/walking-meditation framing) rather than a pure arcade game — results are framed as a "Mind-Body Steadiness Index," not just a score.

- **Platform**: Built as a web app (React + Vite) and packaged as a native Android app via **Capacitor**. No iOS target currently.
- **Distribution**: Google Play Store (package id `com.steadyhands.balance`), monetized with AdMob banner ads.
- **Origin**: Built in Google AI Studio (see `metadata.json`), exported and hardened into a real Capacitor/Android project.

## 2. Tech stack

- **Frontend**: React 19 + TypeScript, Vite 6, Tailwind CSS v4.
- **3D/graphics**: `three.js` (via `ThreeBowlCanvas.tsx`) for the real-time sloshing water/bowl visual.
- **Animation**: `motion` (Framer Motion successor) for screen transitions.
- **Native shell**: Capacitor 8 (`@capacitor/core`, `@capacitor/android`).
- **Auth**: Firebase Authentication (`@capacitor-firebase/authentication`), Google Sign-In only.
- **Backend/data**: Firebase Firestore — used **only** for the global leaderboard (`leaderboard/{uid}` collection). Everything else (settings, profile, local high scores, local leaderboard) is `localStorage`-only; there is no other backend.
- **Ads**: `@capacitor-community/admob` (native banner ads).
- **Other**: `canvas-confetti` (win celebration), `lucide-react` (icons), `@google/genai` (present as a dependency but not central to gameplay).
- **Build scripts**: `npm run dev` (Vite dev server, port 3000), `npm run build`, `npm run lint` (just `tsc --noEmit`, no lint rules configured), plus `sync-android.sh`/`.command` to rebuild web assets and `npx cap sync` into the Android project.

## 3. Repo layout

```
src/
  App.tsx                     — root component, tab routing, theme/font-size, tutorial gating
  types.ts                    — all shared TypeScript types
  components/
    PlayScreen.tsx            — THE CORE FILE: lobby, calibration, live gameplay loop, physics
    ThreeBowlCanvas.tsx        — three.js bowl + water rendering, tilt-driven visuals
    MatchResultsModal.tsx     — post-round results screen (Mind-Body Steadiness breakdown)
    InteractiveTutorialModal.tsx — first-launch animated tutorial
    InstructionsScreen.tsx, LeaderboardScreen.tsx, SettingsScreen.tsx, BottomNav.tsx, Header.tsx
    AdMimicBanner.tsx          — in-lobby ad-styled banner placeholder
    ShareExperienceModal.tsx
  services/
    walkingDetector.ts         — sensor-fusion step/walking detector (see §5)
    storage.ts                 — localStorage persistence (settings, profile, high scores, local leaderboard)
    firebase.ts                — Firebase app init (hardcoded, non-secret config)
    firestore.ts                — global leaderboard read/write (Firestore)
    googleAuth.ts               — Google Sign-In via Firebase Auth
    regionService.ts / networkRegion.ts / locationResolver.ts — country/region detection for leaderboard flavor
    adMobService.ts             — native AdMob banner lifecycle
    audio.ts                    — sound effects (clicks, spill, calibration, countdown)
    cardGenerator.ts            — likely for the "share experience" result card image
  data/mindfulBenefits.tsx     — rotating mindfulness tip copy shown in the lobby
android/                      — full Capacitor-generated native Android project (Gradle, Android Studio project)
capacitor.config.ts           — Capacitor app config (appId, AdMob ids, Firebase Auth provider config)
metadata.json                 — AI Studio metadata (app name/description, required permissions)
ANDROID_RELEASE_GUIDE.md      — step-by-step guide for building signed .aab and publishing to Play Console
```

## 4. Core gameplay flow (state machine in `PlayScreen.tsx`)

`gamePhase`: `lobby` → `calibrating` (hold phone level & still for ~2.4s) → `transitioning` (brief "GO!" burst) → `playing` → back to `lobby` with a result.

- **Difficulty** (`easy` / `medium` / `hard`) maps to a "safe zone percent" (70/78/88) which drives a `computeCfg()` function producing: tilt sensitivity, spill threshold (degrees), spill rate, bowl-follow lerp, and max tilt degrees. This config/physics model was explicitly ported from an earlier prototype called **"WaterBowlProject"** (`water-bowl-game.html`) — comments in the code repeatedly reference matching that source's numbers exactly.
- **Duration**: 45 / 60 / 90 seconds, selectable in the lobby.
- **Tilt input**: real device orientation (`deviceorientation` beta/gamma) on mobile, pointer/touch drag or arrow-keys/WASD as a desktop fallback. Raw degrees are smoothed via a lerp ("bowl follow") before being used for spill math, decoupled from the UI-facing normalized tilt used for the visual dot/3D canvas.
- **Spill/water logic**: once tilt exceeds the difficulty's spill threshold, water drains proportionally to how far past threshold the tilt is (`SPILL_RATE * spill% * 1.3 boost`). Water hitting 0% ends the round as a loss immediately; timer hitting 0 with ≥50% water left is a win.
- **Walking requirement** ("Walking Mode", on by default): the round timer only counts down while the player is actively walking (per `walkingDetector`); otherwise it pauses with a "Timer Paused • Keep Walking" banner. Can be disabled in Settings.
- **Scoring — "Mind-Body Steadiness Index" (0–100)**, computed at round end from three sub-scores:
  - **Stillness** (55% water remaining + 45% time-in-safe-zone ratio)
  - **Rhythm** (walking cadence closeness to an optimal 38–65 steps/min "mindful" pace)
  - **Posture** (average tilt magnitude relative to the difficulty's spill threshold)
  - Weighted `0.50*stillness + 0.30*rhythm + 0.20*posture`, then heavily penalized if the round was a loss.
  - Result also carries a qualitative grade (e.g. "Flow State" 🪷, "Mindful Balance" 🌊, "Grounded Focus" 🍃, "Active Alignment" 🌾, "Restless Stride" 💧) with matching feedback text.
- **Quit confirmation**: quitting mid-round shows a confirm dialog; confirming resets all game state back to lobby defaults.

## 5. Walking detection (`services/walkingDetector.ts`)

A fairly sophisticated sensor-fusion engine, not a simple pedometer:
- Uses `devicemotion` acceleration, tracks a slowly-adapting 3D gravity vector, and projects dynamic (gravity-removed) acceleration onto the gravity axis to get a real "vertical bounce" signal.
- Applies a digital bandpass filter (~0.7–2.8 Hz) to isolate genuine bipedal footfalls while rejecting both hand tremor (8–12 Hz) and slow postural sway (<0.3 Hz) — important because the player is holding the phone flat and still (to balance the bowl) while also walking.
- Runs a peak→valley step state machine with a personalized noise floor calibrated during the 3-second pre-round calibration hold (so each user's own resting hand tremor doesn't get miscounted as steps).
- Three sensitivity presets (`high`/`medium`/`low`), with `high` ("Steady Hands") tuned for slow, deliberate steps and being the recommended/default setting.
- Also fuses **GPS** (via `Geolocation.watchPosition`) as a secondary walking signal (speed ≥ 0.35 m/s, accuracy ≤ 20m) and for real-world distance via Haversine distance between fixes — used when available to cross-check/extend the step-based distance estimate. Distance is otherwise estimated as `steps × 0.55m` stride length.
- Has a "startup grace" window after calibration so the first step isn't punished, and a step/GPS timeout (~1.5–2.1s depending on sensitivity) after which walking state flips to "paused."
- Exposes a singleton (`walkingDetector`) with `onStep`/`onStateChange` subscriptions consumed directly by `PlayScreen`.

## 6. Data & persistence model

- **Local-only (localStorage, via `storageService`)**: `GameSettings`, `UserProfile`, per-difficulty high scores, and a local leaderboard (seeded with 6 fake entries on first run, then real entries prepended and sorted by score). Includes defensive migration logic for legacy data shapes (e.g. old `'normal'` difficulty key → `'medium'`, old >100-scale scores normalized down).
- **Global leaderboard (Firestore, via `services/firestore.ts`)**: one document per signed-in user at `leaderboard/{uid}`, storing best score per difficulty (`bestScoreEasy/Medium/Hard`) plus an overall best, upserted transactionally — **never appended to**, and **only the app itself writes it** right when a round finishes for a signed-in player (never a user-editable action; best-effort, ignored on failure since the local save already happened). Guests (not signed in) never write to Firestore.
- **Region/country detection** (`regionService.ts` + `networkRegion.ts`): used only to flavor leaderboard display (country flags/benchmarks), determined via a priority chain: manual > network/SIM (Android `TelephonyManager`) > GPS bounding-box guess > device timezone fallback > previously saved value. Higher-priority sources never get clobbered by lower ones.

## 7. Firebase / Google project details

- Firebase project id: `steadyhands-5cf12` (config values in `src/services/firebase.ts` are non-secret identifiers, not access-granting secrets — access is controlled by Firestore security rules).
- Auth: Google Sign-In only, via `@capacitor-firebase/authentication`, backed by `android/app/google-services.json`.
- AdMob App ID: `ca-app-pub-4833668827116420~3753425596`; Banner Ad Unit ID: `ca-app-pub-4833668827116420/8214685836` — banner is shown only on the lobby screen, hidden during calibration/gameplay.

## 8. Android packaging

- Capacitor appId: `com.steadyhands.balance`, app name "Steady Hands".
- Full native Android project checked into `android/` (Gradle-based, opens directly in Android Studio).
- `ANDROID_RELEASE_GUIDE.md` documents the full pipeline: `npm run build` → `npx cap sync` → open in Android Studio → lock portrait orientation, verify sensor/vibrate permissions → generate a signed `.aab` → upload to Google Play Console.
- Orientation should be locked to portrait (balance gameplay assumption); requires accelerometer (required) and gyroscope (optional) hardware features.

## 9. Notable product/UX details worth knowing

- First launch shows an animated step-by-step tutorial (`InteractiveTutorialModal`), gated by a `localStorage` flag (`steady_hands_tutorial_seen`).
- Theme: light/dark/system, applied by toggling a class + inline root styles (not pure Tailwind dark-mode class alone) plus a global font-size scale option (default/medium/large, applied via root `fontSize` percentage).
- Streaks: `profile.streak` increments once per calendar day the player wins a round (`storageService.updateStreak`), and a portion of it (`streak * 0.5`, rounded) is shown as a bonus in match results.
- Settings a player controls include: theme, sound, vibration, sensitivity (0.5–2.0 multiplier on tilt sensitivity), font size, default round duration, walking-mode on/off, distance unit (feet/meters/both), walking sensitivity preset, and GPS on/off.
- Desktop/browser play is fully supported as a fallback (arrow keys/WASD to tilt, spacebar to simulate a step and to start calibration from the lobby), useful for testing without a real device.

## 10. Things to double-check before relying on for other tasks

This document reflects the state of the code as read on 2026-09-06. Before making claims about specific line numbers or exact current behavior, re-read the relevant file — this is a snapshot, not a live view. In particular `PlayScreen.tsx` is large (~1480 lines) and this summary does not cover every UI branch (e.g. the full quit-dialog JSX, exact lobby layout) in full detail.
