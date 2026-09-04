import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { DifficultyLevel, DurationOption, GameResult, GameSettings, UserProfile } from '../types';
import { Flame, Play, ShieldAlert, Sparkles, CheckCircle2, ChevronLeft, X, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Footprints, Activity, Navigation, MapPin } from 'lucide-react';
import { ThreeBowlCanvas } from './ThreeBowlCanvas';
import { soundService } from '../services/audio';
import { MINDFUL_BENEFITS } from '../data/mindfulBenefits';
import { walkingDetector, formatWalkingDistance } from '../services/walkingDetector';
import { LocationResolver } from '../services/locationResolver';

interface PlayScreenProps {
  settings: GameSettings;
  profile: UserProfile;
  highScores: Record<DifficultyLevel, number>;
  onGameOver: (result: GameResult) => void;
  isDarkMode: boolean;
  onGameActiveChange?: (isActive: boolean) => void;
  onQuitGame?: () => void;
}

type GamePhase = 'lobby' | 'calibrating' | 'transitioning' | 'playing';

/* ============================================================
   GAMEPLAY PHYSICS — ported from WaterBowlProject (water-bowl-game.html)
   instead of this app's original ad-hoc safeRadius/spillSpeedMult model.
   Every tilt/sensitivity/spill/water-drain/calibration number below
   matches that source exactly; only the screen UI below stays this app's own.
   ============================================================ */
const DEG2RAD = Math.PI / 180;

// presetPercent equivalents for each difficulty, merged into Easy, Medium, Hard
// Easy (70%), Medium (78% - merging Medium & Hard), Hard (88% - merging Expert & Master).
const DIFFICULTY_PCT: Record<DifficultyLevel, number> = {
  easy: 70,
  medium: 78,
  hard: 88,
};

const SPILL_RATE_BOOST = 1.3; // +30% spill speed once past the safe zone, every difficulty
const CALIB_HOLD_SECONDS = 3;
const KEYBOARD_TILT_SPEED = 55; // deg/sec, desktop/keyboard fallback

// Inner "safe zone" circle diameter for each difficulty:
// Easy (44px), Medium (28px), Hard (14px).
const RADAR_INNER_DIA_PX: Record<DifficultyLevel, number> = {
  easy: 44,
  medium: 28,
  hard: 14,
};
const CALIB_DIAL_PX = 208;
const PLAY_DIAL_PX = 96;

function fromPercent(percent: number, min: number, max: number): number {
  return min + (max - min) * Math.min(Math.max(percent / 100, 0), 1.5);
}

interface BowlCfg {
  TILT_SENSITIVITY: number;
  SPILL_THRESHOLD_DEG: number;
  SPILL_RATE: number;
  BOWL_FOLLOW_LERP: number;
  MAX_TILT_DEG: number;
}
function computeCfg(pct: number): BowlCfg {
  return {
    TILT_SENSITIVITY: fromPercent(pct, 0.5, 2.5),
    SPILL_THRESHOLD_DEG: Math.max(fromPercent(pct, 15, 1), 0.1),
    SPILL_RATE: fromPercent(pct, 0.1, 2.0),
    BOWL_FOLLOW_LERP: fromPercent(pct, 0.05, 0.6),
    MAX_TILT_DEG: fromPercent(pct, 30, 60),
  };
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const PlayScreen: React.FC<PlayScreenProps> = ({
  settings,
  profile,
  highScores,
  onGameOver,
  isDarkMode,
  onGameActiveChange,
  onQuitGame,
}) => {
  // Lobby Settings
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(45);
  const [showMindfulTip, setShowMindfulTip] = useState(false);
  const [activeBenefitIndex, setActiveBenefitIndex] = useState(0);

  // Game Phases: 'lobby' -> 'calibrating' (3s hold in center) -> 'transitioning' -> 'playing'
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');

  // Auto-cycle through mindful benefits sequentially every 6 seconds when expanded in lobby
  useEffect(() => {
    if (!showMindfulTip || gamePhase !== 'lobby') return;
    const interval = setInterval(() => {
      setActiveBenefitIndex((prev) => (prev + 1) % MINDFUL_BENEFITS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showMindfulTip, gamePhase]);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const showQuitConfirmRef = useRef(false);
  showQuitConfirmRef.current = showQuitConfirm;

  // Stop game and return to lobby
  const stopGame = useCallback(() => {
    if (animationReqRef.current) {
      cancelAnimationFrame(animationReqRef.current);
      animationReqRef.current = null;
    }
    setShowQuitConfirm(false);
    showQuitConfirmRef.current = false;
    walkingDetector.stop();
    walkingDetector.reset();
    setIsWalking(true);
    isWalkingRef.current = true;
    setWalkingSteps(0);
    walkingStepsRef.current = 0;
    setGamePhase('lobby');
    gamePhaseRef.current = 'lobby';
    setWaterLeft(100);
    setTimeLeft(selectedDuration);
    setTiltX(0);
    setTiltY(0);
    setIsSpilling(false);
    setSpillWarning(null);
    setHoldProgress(0);
    holdProgressRef.current = 0;
    lastTickSecRef.current = 4;
    rawBetaRef.current = 0;
    rawGammaRef.current = 0;
    bowlTiltXRef.current = 0;
    bowlTiltZRef.current = 0;
    onGameActiveChange?.(false);
    onQuitGame?.();
  }, [selectedDuration, onGameActiveChange, onQuitGame]);

  const handleQuitRequest = useCallback(() => {
    if (gamePhaseRef.current !== 'lobby') {
      setShowQuitConfirm(true);
      showQuitConfirmRef.current = true;
      if (settings.soundEnabled) soundService.playClick();
    }
  }, [settings.soundEnabled]);

  const handleCancelQuit = useCallback(() => {
    setShowQuitConfirm(false);
    showQuitConfirmRef.current = false;
    if (settings.soundEnabled) soundService.playClick();
  }, [settings.soundEnabled]);

  const handleConfirmQuit = useCallback(() => {
    stopGame();
  }, [stopGame]);

  // Notify parent component about game active status (to hide bottom tabs)
  useEffect(() => {
    onGameActiveChange?.(gamePhase !== 'lobby');
  }, [gamePhase, onGameActiveChange]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
    };
  }, [onGameActiveChange]);

  // Game State
  const [waterLeft, setWaterLeft] = useState(100);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [tiltX, setTiltX] = useState(0); // normalized -1..1, for the UI dot + bowl visual only
  const [tiltY, setTiltY] = useState(0); // (real gameplay math runs on bowlTiltXRef/bowlTiltZRef, in true degrees/radians)
  const [spillWarning, setSpillWarning] = useState<string | null>(null);
  const [isSpilling, setIsSpilling] = useState(false);

  // Calibration State
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 3 seconds
  const [isDotCentered, setIsDotCentered] = useState(false);

  // References for fast animation/interval loop
  const waterLeftRef = useRef(100);
  const timeLeftRef = useRef<number>(30);
  const gamePhaseRef = useRef<GamePhase>('lobby');
  const holdProgressRef = useRef(0);
  const lastTickSecRef = useRef(4);
  const lastSpillSoundTime = useRef(0);
  const animationReqRef = useRef<number | null>(null);

  // WaterBowlProject-equivalent physics state: raw device tilt in degrees,
  // and the bowl's actual (lerped/"follow") tilt in radians — the same two-
  // stage model as updateKeyboardTilt()/updateBowlTiltFollow() in the source
  // game. Everything gameplay-relevant (spill %, calibration "centered")
  // reads bowlTiltXRef/bowlTiltZRef, never the UI-facing normalized tiltX/Y.
  const rawBetaRef = useRef(0);
  const rawGammaRef = useRef(0);
  const bowlTiltXRef = useRef(0);
  const bowlTiltZRef = useRef(0);
  const cfgRef = useRef<BowlCfg>(computeCfg(DIFFICULTY_PCT[selectedDifficulty]));
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Mind-Body Steadiness Index tracking refs
  const safeZoneTimeRef = useRef(0);
  const totalPlayTimeRef = useRef(0);
  const tiltSamplesRef = useRef<{ sumTilt: number; count: number }>({ sumTilt: 0, count: 0 });

  // Walking Status State (user must walk to advance timer)
  const [isWalking, setIsWalking] = useState(true);
  const [walkingSteps, setWalkingSteps] = useState(0);
  const [walkingState, setWalkingState] = useState(() => walkingDetector.getState());
  const isWalkingRef = useRef(true);
  const walkingStepsRef = useRef(0);

  // Keep refs in sync
  waterLeftRef.current = waterLeft;
  timeLeftRef.current = timeLeft;
  gamePhaseRef.current = gamePhase;
  holdProgressRef.current = holdProgress;
  isWalkingRef.current = isWalking;
  walkingStepsRef.current = walkingSteps;

  // Request Motion & Orientation Sensor permissions (iOS/Android mobile)
  const requestMotionPermission = async () => {
    try {
      await walkingDetector.requestPermission();
    } catch {
      // Ignore
    }
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
      } catch {
        // Fallback to touch/drag
      }
    }
  };

  // Device orientation event listener — writes raw degrees only; the main
  // loop below applies TILT_SENSITIVITY + BOWL_FOLLOW_LERP, exactly like
  // WaterBowlProject's handleOrientation() + updateBowlTiltFollow().
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (gamePhaseRef.current === 'lobby') return;
      if (e.gamma === null || e.beta === null) return;
      const maxDeg = cfgRef.current.MAX_TILT_DEG;
      rawBetaRef.current = clamp(e.beta, -maxDeg, maxDeg);
      rawGammaRef.current = clamp(e.gamma, -maxDeg, maxDeg);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Keyboard fallback (Arrow keys or WASD) + calibration/quit shortcuts.
  // Just tracks which keys are down / handles one-shot key events here —
  // the actual per-frame raw-tilt integration happens in the main loop
  // below (updateKeyboardTilt()-equivalent), same structure as the source game.
  useEffect(() => {
    const keysPressed = keysPressedRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'escape'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        if (gamePhaseRef.current === 'playing') {
          walkingDetector.simulateStep();
        }
      }
      if (e.key === ' ' && gamePhaseRef.current === 'lobby') {
        startCalibration();
      }
      if (e.key === 'Escape' && gamePhaseRef.current !== 'lobby') {
        if (showQuitConfirmRef.current) {
          handleCancelQuit();
        } else {
          handleQuitRequest();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Walking motion sensor listener (steps & walking/paused status)
  useEffect(() => {
    const unsubStep = walkingDetector.onStep((state) => {
      setWalkingSteps(state.steps);
      walkingStepsRef.current = state.steps;
      setWalkingState(state);
      setIsWalking(true);
      isWalkingRef.current = true;
    });

    const unsubState = walkingDetector.onStateChange((walking, state) => {
      setIsWalking(walking);
      isWalkingRef.current = walking;
      setWalkingState(state);
      if (gamePhaseRef.current === 'playing') {
        if (!walking && settings.soundEnabled) {
          soundService.playWalkingPause();
        } else if (walking && settings.soundEnabled) {
          soundService.playWalkingResume();
        }
      }
    });

    return () => {
      unsubStep();
      unsubState();
      walkingDetector.stop();
    };
  }, [settings.soundEnabled]);

  // Finish Game Handler: Computes Mind-Body Steadiness Index (0 - 100%)
  const finishGame = useCallback(
    (won: boolean, finalWater: number, durationElapsed: number) => {
      walkingDetector.stop();
      setGamePhase('lobby');
      gamePhaseRef.current = 'lobby';
      if (animationReqRef.current) {
        cancelAnimationFrame(animationReqRef.current);
      }

      const totalTime = Math.max(1, durationElapsed);
      const safeZoneTime = safeZoneTimeRef.current;
      const safeZoneRatio = clamp(safeZoneTime / totalTime, 0, 1);
      const safeZonePct = safeZoneRatio * 100;

      // 1. Stillness Score (fluid composure & safe zone presence)
      const stillnessScore = Math.round(clamp(0.55 * finalWater + 0.45 * safeZonePct, 0, 100));

      // 2. Rhythm Score (walking cadence & stride smoothness)
      const walkingState = walkingDetector.getState();
      const actualCadence =
        walkingState.currentCadenceStepsPerMin ||
        (durationElapsed > 5 && walkingState.steps > 0
          ? (walkingState.steps / (durationElapsed / 60))
          : 0);

      let rhythmScore = 85;
      if (walkingState.steps > 0) {
        // Optimal mindful walking cadence is 38 - 65 steps/min
        const cadenceDev = Math.abs(actualCadence - 50);
        rhythmScore = Math.round(clamp(96 - cadenceDev * 0.7, 50, 100));
      } else {
        rhythmScore = Math.round(clamp(stillnessScore, 65, 95));
      }

      // 3. Posture Score (hand calm & micro-tilt control)
      const avgTilt =
        tiltSamplesRef.current.count > 0
          ? tiltSamplesRef.current.sumTilt / tiltSamplesRef.current.count
          : 0;
      const spillThresh = cfgRef.current.SPILL_THRESHOLD_DEG || 4;
      const tiltRatio = clamp(avgTilt / spillThresh, 0, 2);
      const postureScore = Math.round(clamp(100 - tiltRatio * 35, 45, 100));

      // 4. Overall Body Steadiness Index (0 - 100%)
      let rawSteadiness = Math.round(
        0.50 * stillnessScore + 0.30 * rhythmScore + 0.20 * postureScore
      );
      if (!won || finalWater <= 0) {
        rawSteadiness = Math.min(38, Math.round(rawSteadiness * 0.4));
      }
      const steadinessScore = Math.min(100, Math.max(5, rawSteadiness));

      // 5. Mind-Body Grade & Feedback
      let gradeTitle = 'Restless Stride';
      let gradeIcon = '💧';
      let feedback = 'Excess physical sway or hurried pace. Slow your steps and center your breath.';

      if (won && steadinessScore >= 95) {
        gradeTitle = 'Flow State';
        gradeIcon = '🪷';
        feedback = 'Pristine mind-body equilibrium. Minimal physical sway and rhythmic, peaceful stride.';
      } else if (won && steadinessScore >= 85) {
        gradeTitle = 'Mindful Balance';
        gradeIcon = '🌊';
        feedback = 'Strong postural awareness. Smooth stride with minimal involuntary sway.';
      } else if (won && steadinessScore >= 70) {
        gradeTitle = 'Grounded Focus';
        gradeIcon = '🍃';
        feedback = 'Steady physical balance with deliberate, intentional walking rhythm.';
      } else if (won && steadinessScore >= 50) {
        gradeTitle = 'Active Alignment';
        gradeIcon = '🌾';
        feedback = 'Moderate tilt variance. Focus on relaxing your shoulders and softening your steps.';
      }

      const currentBest = highScores[selectedDifficulty] || 0;
      const isNewBest = won && steadinessScore > currentBest;

      onGameOver({
        isWin: won,
        finalScore: steadinessScore,
        steadinessScore,
        steadinessBreakdown: {
          stillnessScore,
          rhythmScore,
          postureScore,
          timeInSafeZoneSec: Math.round(safeZoneTime * 10) / 10,
          totalTimeSec: Math.round(totalTime * 10) / 10,
          safeZoneRatio,
          gradeTitle,
          gradeIcon,
          feedback,
        },
        waterRemaining: finalWater,
        totalDuration: durationElapsed,
        targetDuration: selectedDuration,
        difficulty: selectedDifficulty,
        spilledAmount: 100 - finalWater,
        isNewBest,
        stepsTaken: walkingState.steps,
        distanceMeters: walkingState.distanceMeters,
        distanceFeet: walkingState.distanceFeet,
        cadence: Math.round(actualCadence),
        streakBonus: won ? Math.round(profile.streak * 0.5) : 0,
      });
    },
    [selectedDifficulty, selectedDuration, profile.streak, highScores, onGameOver]
  );

  // Start Calibration (Hold for 3s in center) -- only reached once GPS
  // permission is granted and location services are actually turned on,
  // via startCalibration below.
  const beginRound = () => {
    requestMotionPermission();
    walkingDetector.setSensitivity(settings.walkingSensitivity || 'high');
    walkingDetector.setGpsEnabled(settings.gpsEnabled !== false);
    walkingDetector.reset();
    walkingDetector.start();
    walkingDetector.startCalibrationRecording();
    setIsWalking(true);
    isWalkingRef.current = true;
    setWalkingSteps(0);
    walkingStepsRef.current = 0;
    if (settings.soundEnabled) soundService.playClick();
    cfgRef.current = computeCfg(DIFFICULTY_PCT[selectedDifficulty]);
    rawBetaRef.current = 0;
    rawGammaRef.current = 0;
    bowlTiltXRef.current = 0;
    bowlTiltZRef.current = 0;
    setWaterLeft(100);
    setTimeLeft(selectedDuration);
    setTiltX(0);
    setTiltY(0);
    setIsSpilling(false);
    setSpillWarning(null);
    setHoldProgress(0);
    holdProgressRef.current = 0;
    lastTickSecRef.current = 4;
    setGamePhase('calibrating');
    gamePhaseRef.current = 'calibrating';
  };

  // Gate for the lobby's START button: mindful walking mode needs GPS to
  // fuse step detection with real displacement, so a round can't begin
  // until location permission is granted AND the device's GPS is actually
  // on -- surfacing Android's native one-tap "Turn on GPS" dialog when it
  // isn't, rather than dropping the player straight into calibration.
  const startCalibration = async () => {
    if (settings.gpsEnabled === false || !Capacitor.isNativePlatform()) {
      beginRound();
      return;
    }

    setLocationDenied(false);
    setIsResolvingLocation(true);
    try {
      const result = await LocationResolver.ensureLocationReady();
      setIsResolvingLocation(false);
      if (result.granted && result.gpsEnabled) {
        beginRound();
      } else {
        setLocationDenied(true);
      }
    } catch {
      setIsResolvingLocation(false);
      setLocationDenied(true);
    }
  };

  // Main Loop: handles calibration 3s countdown & main physics — this is
  // the WaterBowlProject tick(): updateKeyboardTilt() + updateBowlTiltFollow()
  // + computeTiltAndSpill(), every frame, for both calibration and play.
  useEffect(() => {
    if (gamePhase === 'lobby') return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (showQuitConfirmRef.current) {
        animationReqRef.current = requestAnimationFrame(loop);
        return;
      }

      const cfg = cfgRef.current;
      const sensExtra = settings.sensitivity || 1;

      // 1. Keyboard fallback -> raw degrees (decays toward 0 when no key held)
      const keys = keysPressedRef.current;
      if (keys.has('arrowup') || keys.has('w')) rawBetaRef.current -= KEYBOARD_TILT_SPEED * dt;
      else if (keys.has('arrowdown') || keys.has('s')) rawBetaRef.current += KEYBOARD_TILT_SPEED * dt;
      else rawBetaRef.current *= 0.9;
      if (keys.has('arrowleft') || keys.has('a')) rawGammaRef.current -= KEYBOARD_TILT_SPEED * dt;
      else if (keys.has('arrowright') || keys.has('d')) rawGammaRef.current += KEYBOARD_TILT_SPEED * dt;
      else rawGammaRef.current *= 0.9;
      rawBetaRef.current = clamp(rawBetaRef.current, -cfg.MAX_TILT_DEG, cfg.MAX_TILT_DEG);
      rawGammaRef.current = clamp(rawGammaRef.current, -cfg.MAX_TILT_DEG, cfg.MAX_TILT_DEG);

      // 2. No artificial "walk simulation" wobble here — WaterBowlProject's
      // thresholds are tuned for genuine physical tilt from actually walking
      // with a real device, not a synthetic oscillation layered on top (that
      // combination made the bowl spill constantly from frame one). The
      // Settings toggle for it stays in the UI but is a no-op against this
      // physics model.
      const effectiveBeta = clamp(rawBetaRef.current, -cfg.MAX_TILT_DEG, cfg.MAX_TILT_DEG);
      const effectiveGamma = clamp(rawGammaRef.current, -cfg.MAX_TILT_DEG, cfg.MAX_TILT_DEG);

      // 3. Bowl follows tilt input with its own lerp — real liquid/rigid-bowl
      // lag, and (critically) what spill/calibration math reads, not the raw
      // input directly.
      const targetX = effectiveBeta * DEG2RAD * cfg.TILT_SENSITIVITY * sensExtra;
      const targetZ = effectiveGamma * DEG2RAD * cfg.TILT_SENSITIVITY * sensExtra;
      bowlTiltXRef.current = lerp(bowlTiltXRef.current, targetX, cfg.BOWL_FOLLOW_LERP);
      bowlTiltZRef.current = lerp(bowlTiltZRef.current, targetZ, cfg.BOWL_FOLLOW_LERP);

      const tiltMagRad = Math.hypot(bowlTiltXRef.current, bowlTiltZRef.current);
      const tiltDeg = tiltMagRad / DEG2RAD;
      let spillPercent = ((tiltDeg - cfg.SPILL_THRESHOLD_DEG) / (cfg.MAX_TILT_DEG - cfg.SPILL_THRESHOLD_DEG)) * 100;
      spillPercent = clamp(spillPercent, 0, 100);

      // Normalized -1..1 purely for the existing UI conventions (radar dot
      // position + ThreeBowlCanvas's own visual tilt scale) — decoupled from
      // the real degree-based gameplay math above.
      const maxRotRad = cfg.MAX_TILT_DEG * DEG2RAD * cfg.TILT_SENSITIVITY * sensExtra || 1;
      const normX = clamp(bowlTiltZRef.current / maxRotRad, -1, 1);
      const normY = clamp(bowlTiltXRef.current / maxRotRad, -1, 1);
      setTiltX(normX);
      setTiltY(normY);

      // 4. CALIBRATION PHASE — "centered" now means the same thing spilling
      // does: inside the real SPILL_THRESHOLD_DEG cone, not an arbitrary UI radius.
      if (gamePhaseRef.current === 'calibrating') {
        const isCenter = tiltDeg <= cfg.SPILL_THRESHOLD_DEG;
        setIsDotCentered(isCenter);

        if (isCenter) {
          const nextHold = Math.min(3.0, holdProgressRef.current + dt);
          holdProgressRef.current = nextHold;
          setHoldProgress(nextHold);

          const remainingSec = Math.ceil(3.0 - nextHold);
          if (remainingSec > 0 && remainingSec !== lastTickSecRef.current && remainingSec <= 3) {
            lastTickSecRef.current = remainingSec;
            if (settings.soundEnabled) {
              soundService.playCountdownTick(remainingSec);
            }
          }

          if (nextHold >= CALIB_HOLD_SECONDS) {
            walkingDetector.finishCalibrationRecording();
            walkingDetector.armStartupGrace(3400);
            if (settings.soundEnabled) soundService.playCalibrationReady();
            if (settings.vibrationEnabled && 'vibrate' in navigator) {
              navigator.vibrate([40, 60, 40]);
            }

            setGamePhase('transitioning');
            gamePhaseRef.current = 'transitioning';

            setTimeout(() => {
              safeZoneTimeRef.current = 0;
              totalPlayTimeRef.current = 0;
              tiltSamplesRef.current = { sumTilt: 0, count: 0 };
              setGamePhase('playing');
              gamePhaseRef.current = 'playing';
            }, 600);
            return;
          }
        } else {
          if (holdProgressRef.current > 0) {
            holdProgressRef.current = 0;
            setHoldProgress(0);
            lastTickSecRef.current = 4;
          }
        }

        animationReqRef.current = requestAnimationFrame(loop);
        return;
      }

      // 5. PLAYING PHASE — spill%/water-drain formula straight from
      // WaterBowlProject's tick(): rate = SPILL_RATE * (spill%/100) * BOOST.
      if (gamePhaseRef.current === 'playing') {
        totalPlayTimeRef.current += dt;
        if (spillPercent <= 0) {
          safeZoneTimeRef.current += dt;
        }
        tiltSamplesRef.current.sumTilt += tiltDeg;
        tiltSamplesRef.current.count += 1;

        const isWalkingRequired = settings.walkingModeEnabled !== false;
        const isCurrentlyWalking = isWalkingRef.current;

        // Walking Status enforcement: Timer ONLY runs while the user is actively walking!
        // If the user stops walking, the timer pauses and prompts them to keep moving.
        if (!isWalkingRequired || isCurrentlyWalking) {
          const newTime = Math.max(0, timeLeftRef.current - dt);
          timeLeftRef.current = newTime;
          setTimeLeft(newTime);

          if (newTime <= 0) {
            const finalWater = waterLeftRef.current;
            finishGame(finalWater >= 50, finalWater, selectedDuration);
            return;
          }
        }

        setIsSpilling(spillPercent > 0);

        if (spillPercent > 0) {
          const rate = cfg.SPILL_RATE * (spillPercent / 100) * SPILL_RATE_BOOST; // fraction-per-second (0..1 scale)
          const nextWater = Math.max(0, waterLeftRef.current - rate * dt * 100); // -> percent-per-second
          waterLeftRef.current = nextWater;
          setWaterLeft(nextWater);

          const angle = Math.atan2(normY, normX);
          let directionAdvice = 'Tilt device ';
          if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
            directionAdvice += 'left';
          } else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
            directionAdvice += 'forward';
          } else if (angle > (3 * Math.PI) / 4 || angle <= (-3 * Math.PI) / 4) {
            directionAdvice += 'right';
          } else {
            directionAdvice += 'back';
          }
          setSpillWarning(directionAdvice);

          if (now - lastSpillSoundTime.current > 350) {
            lastSpillSoundTime.current = now;
            if (settings.soundEnabled) soundService.playSpill();
            if (settings.vibrationEnabled && 'vibrate' in navigator) {
              navigator.vibrate(25);
            }
          }

          if (nextWater <= 0) {
            finishGame(false, 0, selectedDuration - timeLeftRef.current);
            return;
          }
        } else {
          setSpillWarning(null);
        }
      }

      animationReqRef.current = requestAnimationFrame(loop);
    };

    animationReqRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationReqRef.current) {
        cancelAnimationFrame(animationReqRef.current);
      }
    };
  }, [gamePhase, selectedDifficulty, selectedDuration, settings, finishGame]);

  // Difficulty change
  const handleDifficultySelect = (diff: DifficultyLevel) => {
    if (settings.soundEnabled) soundService.playClick();
    setSelectedDifficulty(diff);
  };

  // Duration change
  const handleDurationSelect = (dur: DurationOption) => {
    if (settings.soundEnabled) soundService.playClick();
    setSelectedDuration(dur);
  };

  const remainingHoldSec = Math.max(1, Math.ceil(3.0 - holdProgress));
  const holdFraction = Math.min(1, holdProgress / 3.0);
  const circleCircumference = 2 * Math.PI * 92; // for 200px container (r=92)
  const strokeOffset = circleCircumference * (1 - holdFraction);

  // Difficulty display label
  const difficultyDisplay = selectedDifficulty.toUpperCase();

  // Current Best Score (Mind-Body Steadiness %)
  const currentBestScore =
    highScores[selectedDifficulty] || (selectedDifficulty === 'easy' ? 94 : selectedDifficulty === 'medium' ? 91 : 88);

  // Safe-zone circle size for the current difficulty, in each dial context.
  const innerDiaPlayPx = RADAR_INNER_DIA_PX[selectedDifficulty];
  const innerDiaCalibPx = innerDiaPlayPx * (CALIB_DIAL_PX / PLAY_DIAL_PX);

  // ----------------------------------------------------
  // RENDER: GAMEPLAY & CALIBRATION VIEW
  // ----------------------------------------------------
  if (gamePhase !== 'lobby') {
    const isCalibrating = gamePhase === 'calibrating';
    const isTransitioning = gamePhase === 'transitioning';
    const isActuallyPlaying = gamePhase === 'playing';

    return (
      <div className="flex flex-col w-full max-w-sm mx-auto h-[calc(100vh-80px)] min-h-[580px] p-2 relative select-none gap-2">
        {/* Main 3D Gameplay Container */}
        <div className="w-full flex-1 min-h-0 relative rounded-3xl overflow-hidden bg-[#f7f9fc] dark:bg-[#191c1e] neumorphic-raised border border-white/80 dark:border-white/10 flex flex-col justify-between p-5">
          {/* 3D Liquid Canvas (Always active and sloshing with user rotation!) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <ThreeBowlCanvas
              tiltX={tiltX}
              tiltY={tiltY}
              waterLevel={waterLeft}
              isSpilling={isSpilling}
              interactive={true}
              onInteractiveTilt={(x, y) => {
                const maxDeg = cfgRef.current.MAX_TILT_DEG;
                rawGammaRef.current = x * maxDeg;
                rawBetaRef.current = y * maxDeg;
              }}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Ambient Lighting Vignette Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#f7f9fc]/60 via-transparent to-[#f7f9fc]/70 dark:from-[#191c1e]/80 dark:via-transparent dark:to-[#191c1e]/90 pointer-events-none" />

          {/* DIMMED SCRIM OVERLAY DURING CALIBRATION */}
          <div
            className={`absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-none ${
              isCalibrating ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* TOP HUD: BACK BUTTON + WATER LEFT & TIME */}
          <div className="relative z-30 flex items-center justify-between gap-2">
            {/* Exit / Back button during active game or calibration */}
            <button
              onClick={handleQuitRequest}
              className="h-10 px-3.5 rounded-xl bg-white/90 dark:bg-[#191c1e]/90 text-[#191c1e] dark:text-[#eff1f4] neumorphic-raised hover:bg-white dark:hover:bg-[#252c34] active:neumorphic-inset flex items-center gap-1.5 text-xs font-bold transition-all border border-white/80 dark:border-white/10 shadow-sm cursor-pointer shrink-0"
              aria-label="Stop game and go back"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Score / Status indicators */}
            <div
              className={`flex items-center gap-2 pointer-events-none transition-opacity duration-300 shrink-0 ${
                isActuallyPlaying ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {/* Water Left Card */}
              <div className="flex flex-col items-start px-3 py-1.5 rounded-xl bg-[#f7f9fc]/85 dark:bg-[#2d3133]/85 backdrop-blur-md border border-white/80 dark:border-white/10 neumorphic-raised min-w-[78px]">
                <span className="text-[10px] font-bold text-[#404751] dark:text-[#c0c7d3] tracking-wider uppercase">
                  WATER
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#005f9e] dark:text-[#9dcaff] drop-shadow-[0_2px_4px_rgba(0,95,158,0.2)]">
                  {Math.round(waterLeft)}%
                </span>
              </div>

              {/* Time Card */}
              <div className="flex flex-col items-end px-3 py-1.5 rounded-xl bg-[#f7f9fc]/85 dark:bg-[#2d3133]/85 backdrop-blur-md border border-white/80 dark:border-white/10 neumorphic-raised min-w-[78px]">
                <span className="text-[10px] font-bold text-[#404751] dark:text-[#c0c7d3] tracking-wider uppercase">
                  TIME
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#7c5800] dark:text-[#f4be57] drop-shadow-[0_2px_4px_rgba(124,88,0,0.2)]">
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* FULL SCREEN BIG ZOOMING COUNTDOWN OVERLAY */}
          {isCalibrating && isDotCentered && (
            <div
              key={`countdown-${remainingHoldSec}`}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Shockwave ripple rings */}
              <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border-4 border-[#38bdf8]/50 dark:border-[#38bdf8]/60 animate-countdown-ripple" />
              <div
                className="absolute w-40 h-40 rounded-full border-2 border-amber-400/60 animate-countdown-ripple"
                style={{ animationDelay: '0.12s' }}
              />

              {/* Radiant aura bloom */}
              <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-[#005f9e]/50 via-[#38bdf8]/40 to-[#f59e0b]/30 blur-3xl opacity-80" />

              {/* Huge Zooming Number */}
              <div className="relative flex flex-col items-center animate-countdown-zoom">
                <span className="text-8xl sm:text-9xl md:text-[130px] font-black leading-none tracking-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] filter drop-shadow-[0_0_25px_rgba(56,189,248,0.7)] select-none">
                  {remainingHoldSec}
                </span>
                <span className="mt-3 px-4 py-1.5 rounded-full bg-[#005f9e]/90 text-white text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase backdrop-blur-md shadow-xl border border-white/30">
                  KEEP STEADY
                </span>
              </div>
            </div>
          )}

          {/* Big GO! Burst when transitioning into active play */}
          {isTransitioning && (
            <div
              key="countdown-go"
              className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="absolute w-64 h-64 rounded-full border-4 border-[#f59e0b]/70 animate-countdown-ripple" />
              <div className="relative flex flex-col items-center animate-countdown-zoom">
                <span className="text-8xl sm:text-9xl md:text-[130px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#f97316] drop-shadow-[0_10px_35px_rgba(249,115,22,0.8)] select-none">
                  GO!
                </span>
                <span className="mt-3 px-5 py-1.5 rounded-full bg-[#f97316]/95 text-white text-xs sm:text-sm font-black tracking-[0.25em] uppercase backdrop-blur-md shadow-2xl border border-white/40">
                  BALANCE THE BOWL!
                </span>
              </div>
            </div>
          )}

          {/* Virtual Tilt Controller / Touch Helper Area */}
          <div
            className="absolute inset-x-4 top-28 bottom-32 z-25 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
              const maxDeg = cfgRef.current.MAX_TILT_DEG;
              rawGammaRef.current = clamp(nx * 1.2, -1, 1) * maxDeg;
              rawBetaRef.current = clamp(ny * 1.2, -1, 1) * maxDeg;
            }}
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
                const ny = ((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1;
                const maxDeg = cfgRef.current.MAX_TILT_DEG;
                rawGammaRef.current = clamp(nx * 1.2, -1, 1) * maxDeg;
                rawBetaRef.current = clamp(ny * 1.2, -1, 1) * maxDeg;
              }
            }}
          >
            {/* Instructional hint during gameplay */}
            {isActuallyPlaying && (
              <div className="text-[#404751]/30 dark:text-white/20 text-xs font-bold tracking-wider pointer-events-none uppercase">
                Drag or Tilt Device to Balance
              </div>
            )}
          </div>

          {/* CALIBRATION CENTER MARK CIRCLE (Animated to corner upon hold complete) */}
          <div
            className={`transition-all duration-500 ease-out z-30 pointer-events-none ${
              isCalibrating
                ? 'absolute inset-0 flex flex-col items-center justify-center'
                : isTransitioning || isActuallyPlaying
                ? 'absolute bottom-5 right-5 flex flex-col items-end justify-end'
                : 'hidden'
            }`}
          >
            {/* Center Prompt during calibration if dot is not centered */}
            {isCalibrating && !isDotCentered && (
              <div className="mb-4 flex flex-col items-center animate-fade-in text-center px-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#d1e4ff] bg-[#005f9e]/80 px-3 py-1 rounded-full backdrop-blur-md shadow-md mb-1.5">
                  CALIBRATION
                </span>
                <h3 className="text-xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Center the Dot to Start
                </h3>
                <p className="text-xs text-white/80 mt-0.5 font-medium">
                  Tilt device or drag cursor into center target
                </p>
              </div>
            )}

            {/* Tactical Dial View (Scaled 200px in center when calibrating, 96px in corner during play) */}
            <div
              className={`relative rounded-full transition-all duration-500 ease-out flex items-center justify-center ${
                isCalibrating
                  ? isDotCentered
                    ? 'w-44 h-44 opacity-40 bg-[#f7f9fc]/80 dark:bg-[#191c1e]/80 shadow-[0_10px_35px_rgba(0,0,0,0.5)] border border-white/50'
                    : 'w-52 h-52 bg-[#f7f9fc] dark:bg-[#191c1e] shadow-[0_10px_35px_rgba(0,0,0,0.5),-6px_-6px_16px_#ffffff,6px_6px_16px_#d1d9e6] dark:shadow-[0_10px_35px_rgba(0,0,0,0.8),-6px_-6px_16px_#162B3B,6px_6px_16px_#050B10] border-2 border-white/90 dark:border-white/20'
                  : 'w-24 h-24 bg-[#f7f9fc] dark:bg-[#162B3B] neumorphic-inset border border-black/5 dark:border-white/5'
              }`}
            >
              {/* Circular Progress Arc during Calibration */}
              {isCalibrating && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 200 200">
                  {/* Track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="none"
                    stroke="#d1d9e6"
                    strokeWidth="5"
                    className="opacity-40"
                  />
                  {/* Active Progress Fill */}
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="none"
                    stroke={isDotCentered ? '#005f9e' : '#cb4830'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: circleCircumference,
                      strokeDashoffset: strokeOffset,
                      transition: 'stroke-dashoffset 0.08s linear, stroke 0.2s ease',
                    }}
                  />
                </svg>
              )}

              {/* Inset Depth Surface */}
              <div className="absolute inset-2 rounded-full neumorphic-inset flex items-center justify-center overflow-hidden">
                {/* Subtle Grid / Crosshairs */}
                <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-[#191c1e] dark:text-white" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-[#191c1e] dark:text-white" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.6" className="text-[#191c1e] dark:text-white" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.6" className="text-[#191c1e] dark:text-white" />
                </svg>

                {/* Safe Target Zone Circle — sized per difficulty, straight
                    from WaterBowlProject's radarInnerDiaPx (bigger on Easy,
                    barely-bigger-than-the-dot on Master). */}
                <div
                  className={`rounded-full border transition-all pointer-events-none ${
                    isCalibrating
                      ? isDotCentered
                        ? 'border-[#005f9e] bg-[#005f9e]/15 animate-pulse'
                        : 'border-[#cb4830] bg-[#cb4830]/10'
                      : isSpilling
                      ? 'border-[#cb4830]/80 bg-[#cb4830]/15'
                      : 'border-[#005f9e]/40 bg-[#005f9e]/10'
                  }`}
                  style={{
                    width: isCalibrating ? innerDiaCalibPx : innerDiaPlayPx,
                    height: isCalibrating ? innerDiaCalibPx : innerDiaPlayPx,
                  }}
                />

                {/* Dynamic Position Dot */}
                <div
                  className={`rounded-full absolute transition-transform duration-75 ease-out shadow-[0_0_12px_rgba(0,95,158,0.7)] ${
                    isCalibrating
                      ? 'w-5 h-5 bg-[#005f9e] dark:bg-[#9dcaff]'
                      : 'w-4 h-4 bg-[#005f9e] dark:bg-[#9dcaff]'
                  }`}
                  style={{
                    transform: `translate(${
                      tiltX * (isCalibrating ? (isDotCentered ? 55 : 68) : 36)
                    }px, ${tiltY * (isCalibrating ? (isDotCentered ? 55 : 68) : 36)}px)`,
                  }}
                />
              </div>
            </div>

            {/* Instruction reset tag if lost center */}
            {isCalibrating && !isDotCentered && (
              <div className="mt-3 px-3.5 py-1 rounded-full bg-[#cb4830]/90 text-white text-[11px] font-bold shadow-md">
                Bring dot into center target
              </div>
            )}
          </div>

          {/* BOTTOM HUD: STATUS WARNING (during active play) */}
          {isActuallyPlaying && (
            <div className="relative z-20 flex justify-between items-end">
              <div className="flex flex-col items-start pb-1">
                {isSpilling ? (
                  <>
                    <span className="text-2xl font-extrabold text-[#cb4830] dark:text-[#ffb4a5] animate-pulse flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(203,72,48,0.3)]">
                      <ShieldAlert className="w-6 h-6 text-[#cb4830] dark:text-[#ffb4a5]" />
                      Spilling!
                    </span>
                    <span className="text-sm font-bold text-[#191c1e] dark:text-white/90 mt-0.5">
                      {spillWarning}
                    </span>
                  </>
                ) : !isWalking && settings.walkingModeEnabled !== false ? (
                  <div className="bg-amber-500/20 dark:bg-amber-400/25 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-amber-500/40 animate-pulse flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce shrink-0" />
                    <span className="text-xs font-extrabold tracking-wide text-amber-800 dark:text-amber-200 uppercase">
                      TIMER PAUSED • KEEP WALKING
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#f7f9fc]/90 dark:bg-[#191c1e]/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full neumorphic-raised border border-white/80 dark:border-white/10">
                    <span className="text-xs font-bold tracking-widest text-[#005f9e] dark:text-[#9dcaff] uppercase">
                      KEEP IT LEVEL
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* CONFIRM QUIT DIALOG MODAL */}
          {showQuitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-[#f7f9fc] dark:bg-[#1e2328] border border-white/90 dark:border-white/10 p-6 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] neumorphic-raised">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-inner">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
                  Quit Current Game?
                </h3>

                <p className="text-sm text-[#5a626f] dark:text-[#a0a8b4] mt-2 mb-6 leading-relaxed">
                  Are you sure you want to exit? Your current water balance and round progress will be lost.
                </p>

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    onClick={handleCancelQuit}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#005f9e] hover:bg-[#004f84] text-white font-extrabold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Keep Playing
                  </button>

                  <button
                    onClick={handleConfirmQuit}
                    className="w-full py-3 px-5 rounded-2xl bg-white dark:bg-[#252c34] text-[#cb4830] dark:text-[#ff8570] hover:bg-[#ffece8] dark:hover:bg-[#341d1a] border border-[#cb4830]/25 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Quit Game
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DEDICATED WALKING STATUS STRIP: Positioned BELOW the bowl card — never overlaps the bowl */}
        {settings.walkingModeEnabled !== false && isActuallyPlaying && (
          <div className="w-full shrink-0 z-30">
            <div
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl backdrop-blur-md border transition-all duration-300 shadow-sm ${
                isWalking
                  ? 'bg-white/95 dark:bg-[#191c1e]/95 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 neumorphic-raised'
                  : 'bg-white/95 dark:bg-[#191c1e]/95 border-amber-500/40 text-amber-800 dark:text-amber-200 neumorphic-raised'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-xl shrink-0 ${
                    isWalking
                      ? 'bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 dark:bg-amber-400/25 text-amber-600 dark:text-amber-400 animate-bounce'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      isWalking
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse'
                    }`}
                  >
                    {isWalking ? 'WALKING' : 'PAUSED'}
                  </span>
                  <span className="text-xs font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
                    {formatWalkingDistance(walkingSteps, settings.distanceUnit, walkingState.distanceMeters).formatted}
                  </span>
                  {walkingState.gpsStatus === 'active' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center gap-0.5 shrink-0" title="GPS Fusion Active">
                      <Navigation className="w-2.5 h-2.5 fill-current" />
                      <span>GPS</span>
                    </span>
                  )}
                  {isWalking && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0" title="Live Motion Energy">
                      <Activity className="w-2.5 h-2.5" />
                      <span>{Math.max(12, Math.round(walkingState.motionEnergy * 100))}%</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className="text-[11px] font-bold text-[#404751] dark:text-[#c0c7d3]">
                  {walkingSteps} {walkingSteps === 1 ? 'step' : 'steps'}
                </span>
                {!isWalking ? (
                  <button
                    type="button"
                    onClick={() => walkingDetector.simulateStep()}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1"
                    title="Simulate step or press 'W'"
                  >
                    <span>Step</span>
                    <span className="text-[9px] opacity-80 bg-white/20 px-1 py-0.2 rounded font-mono">W</span>
                  </button>
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: LOBBY VIEW (matching exact light mode design)
  // ----------------------------------------------------
  return (
    <div className="flex flex-col w-full max-w-sm mx-auto items-center justify-between min-h-[calc(100vh-160px)] px-6 pt-4 pb-[calc(140px+env(safe-area-inset-bottom,0px))] gap-5 select-none">
      {/* Best Steadiness Record Card */}
      <div className="w-full bg-white dark:bg-[#191c1e] rounded-2xl p-4 flex flex-col items-center justify-center card-raised border border-white/60 dark:border-transparent">
        <span className="text-[12px] font-bold text-[#404751] dark:text-[#c0c7d3] mb-0.5 tracking-[0.1em] uppercase">
          {difficultyDisplay} STEADINESS RECORD
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[46px] leading-[52px] font-[800] text-[#005f9e] dark:text-[#9dcaff] tracking-tight">
            {Math.round(currentBestScore)}
          </span>
          <span className="text-xl font-bold text-[#005f9e] dark:text-[#9dcaff]">
            %
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#707882] dark:text-[#a0a8b4] tracking-wide mt-0.5">
          Body & Posture Stability
        </span>
      </div>

      {/* Mindful Walking Mode Status Banner */}
      <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#191c1e] card-raised border border-white/60 dark:border-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Footprints className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left min-w-0 flex-1">
            <span className="text-xs font-bold text-[#191c1e] dark:text-[#eff1f4] leading-snug">
              {settings.walkingModeEnabled !== false ? 'Walking Required' : 'Walking Status'}
            </span>
            <p className="text-[11px] text-[#707882] dark:text-[#a0a8b4] leading-normal mt-0.5">
              {settings.walkingModeEnabled !== false
                ? 'Walk steadily to keep the timer running'
                : 'Seated mode: Timer runs without walking'}
            </p>
          </div>
        </div>
        <span
          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 self-center ${
            settings.walkingModeEnabled !== false
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
              : 'bg-black/5 dark:bg-white/10 text-[#707882] dark:text-[#a0a8b4]'
          }`}
        >
          {settings.walkingModeEnabled !== false ? 'ACTIVE' : 'OFF'}
        </span>
      </div>

      {/* Option 3: Collapsible Mindful Health Card with Sequential Carousel */}
      <div className="w-full">
        <button
          onClick={() => {
            if (settings.soundEnabled) soundService.playClick();
            setShowMindfulTip((prev) => !prev);
          }}
          className="w-full p-2.5 px-3.5 rounded-2xl bg-[#eef4fb] dark:bg-[#152331] border border-[#005f9e]/15 dark:border-[#9dcaff]/20 flex items-center justify-between transition-all hover:bg-[#e4effa] dark:hover:bg-[#1b2e40] text-left cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#005f9e] dark:text-[#9dcaff] shrink-0" />
            <span className="text-xs font-bold text-[#005f9e] dark:text-[#9dcaff]">
              Why Steady Hands? ({activeBenefitIndex + 1}/{MINDFUL_BENEFITS.length} Mind & Body)
            </span>
          </div>
          {showMindfulTip ? (
            <ChevronUp className="w-4 h-4 text-[#005f9e] dark:text-[#9dcaff]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#005f9e] dark:text-[#9dcaff]" />
          )}
        </button>

        {showMindfulTip && (
          <div className="mt-2 p-4 rounded-2xl bg-white dark:bg-[#191c1e] card-raised border border-white/60 dark:border-transparent flex flex-col gap-3 text-left animate-in fade-in duration-200">
            {/* Active Sequential Benefit Card */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#eef4fb] dark:bg-[#152331] border border-[#005f9e]/10 dark:border-[#9dcaff]/15 shrink-0 shadow-inner">
                {MINDFUL_BENEFITS[activeBenefitIndex].icon('w-4 h-4 text-[#005f9e] dark:text-[#9dcaff]')}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#005f9e]/10 dark:bg-[#9dcaff]/15 text-[#005f9e] dark:text-[#9dcaff] shrink-0">
                    {MINDFUL_BENEFITS[activeBenefitIndex].tagline}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-[#191c1e] dark:text-[#eff1f4] leading-snug">
                  {MINDFUL_BENEFITS[activeBenefitIndex].title}
                </h4>
                <p className="text-xs text-[#5a626f] dark:text-[#a0a8b4] leading-relaxed mt-1.5">
                  {MINDFUL_BENEFITS[activeBenefitIndex].description}
                </p>
              </div>
            </div>

            {/* Sequential Carousel Controls & Progress Dots */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1 max-w-[170px] overflow-hidden">
                {MINDFUL_BENEFITS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (settings.soundEnabled) soundService.playClick();
                      setActiveBenefitIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === activeBenefitIndex
                        ? 'w-5 bg-[#005f9e] dark:bg-[#9dcaff]'
                        : 'w-1.5 bg-black/15 dark:bg-white/15 hover:bg-black/30 dark:hover:bg-white/30'
                    }`}
                    aria-label={`Go to benefit ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (settings.soundEnabled) soundService.playClick();
                    setActiveBenefitIndex(
                      (prev) => (prev - 1 + MINDFUL_BENEFITS.length) % MINDFUL_BENEFITS.length
                    );
                  }}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#404751] dark:text-[#c0c7d3] active:scale-95 transition-all cursor-pointer"
                  aria-label="Previous insight"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (settings.soundEnabled) soundService.playClick();
                    setActiveBenefitIndex((prev) => (prev + 1) % MINDFUL_BENEFITS.length);
                  }}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#404751] dark:text-[#c0c7d3] active:scale-95 transition-all cursor-pointer"
                  aria-label="Next insight"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center Stylish Start Button with Ambient Glow & Rotating Circle Orbit */}
      <div className="flex-1 w-full flex items-center justify-center py-4 relative my-1">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Radiant Ambient Glow Behind Button */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-[#005f9e]/35 via-[#00a8ff]/30 to-[#f59e0b]/25 dark:from-[#0078c6]/50 dark:via-[#38bdf8]/40 dark:to-[#fbbf24]/30 blur-2xl animate-pulse-glow pointer-events-none" />

          {/* Primary Rotating Orbit Ring with Particles */}
          <div className="absolute inset-0 w-full h-full pointer-events-none animate-spin-slow flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 224 224">
              <defs>
                <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#005f9e" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle
                cx="112"
                cy="112"
                r="100"
                fill="none"
                stroke="url(#orbitGrad)"
                strokeWidth="2"
                strokeDasharray="14 10 28 8"
                strokeLinecap="round"
                opacity="0.85"
              />
              <circle
                cx="212"
                cy="112"
                r="4.5"
                fill="#38bdf8"
                className="drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
              />
              <circle
                cx="12"
                cy="112"
                r="3.5"
                fill="#f59e0b"
                className="drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]"
              />
            </svg>
          </div>

          {/* Secondary Counter-Rotating Accent Ring */}
          <div className="absolute inset-4 rounded-full border border-dashed border-[#005f9e]/30 dark:border-[#9dcaff]/30 animate-spin-reverse-slow pointer-events-none" />

          {/* Interactive Start Button */}
          <button
            onClick={startCalibration}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full relative z-10 bg-white dark:bg-[#191c1e] card-raised dark:neumorphic-raised flex flex-col items-center justify-center gap-1 text-[#005f9e] dark:text-[#9dcaff] cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/90 dark:border-white/10 active:neumorphic-inset"
            aria-label="Start Game"
          >
            {/* Subtle Inner Concentric Ring */}
            <div className="absolute inset-2.5 rounded-full border border-[#005f9e]/15 dark:border-[#9dcaff]/15 pointer-events-none" />

            <div className="w-10 h-10 rounded-full bg-[#005f9e]/10 dark:bg-[#9dcaff]/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>

            <span className="text-[18px] sm:text-[20px] font-[800] tracking-[0.16em] uppercase text-[#005f9e] dark:text-[#9dcaff] drop-shadow-sm">
              START
            </span>

            <span className="text-[9px] font-bold text-[#707882] dark:text-[#a0a8b4] tracking-[0.12em] uppercase">
              {selectedDuration}s · {selectedDifficulty}
            </span>
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="w-full flex flex-col gap-5">
        {/* Difficulty Selector */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[12px] font-bold text-[#404751] dark:text-[#c0c7d3] pl-2 tracking-[0.1em] uppercase">
            DIFFICULTY
          </span>

          <div className="w-full bg-[#e9edf2] dark:bg-[#162B3B] rounded-full p-1.5 neumorphic-inset flex items-center justify-between">
            {[
              { key: 'easy', label: 'Easy' },
              { key: 'medium', label: 'Medium' },
              { key: 'hard', label: 'Hard' },
            ].map(({ key, label }) => {
              const isActive = selectedDifficulty === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key as DifficultyLevel)}
                  className={`flex-1 py-2.5 rounded-full font-medium text-base transition-all duration-200 cursor-pointer text-center mx-1 relative ${
                    isActive
                      ? 'neumorphic-inset bg-[#ffdea8] dark:bg-[#5e4200] text-[#5e4200] dark:text-[#ffdea8] font-bold shadow-inner'
                      : 'bg-white dark:bg-[#191c1e] text-[#404751] dark:text-[#c0c7d3] shadow-[0_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-none dark:neumorphic-raised hover:text-[#005f9e] dark:hover:text-[#9dcaff]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Selector */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[12px] font-bold text-[#404751] dark:text-[#c0c7d3] pl-2 tracking-[0.1em] uppercase">
            DURATION
          </span>
          <div className="w-full bg-[#e9edf2] dark:bg-[#162B3B] rounded-full p-1.5 neumorphic-inset flex items-center justify-between">
            {([45, 60, 90] as DurationOption[]).map((dur) => {
              const isActive = selectedDuration === dur;
              return (
                <button
                  key={dur}
                  onClick={() => handleDurationSelect(dur)}
                  className={`flex-1 py-2.5 rounded-full font-medium text-base transition-all duration-200 cursor-pointer text-center mx-1 relative ${
                    isActive
                      ? 'neumorphic-inset bg-[#d1e4ff] dark:bg-[#004778] text-[#004778] dark:text-[#d1e4ff] font-extrabold shadow-[0_0_15px_rgba(0,95,158,0.35),inset_0_2px_4px_rgba(0,0,0,0.15)] dark:shadow-[0_0_18px_rgba(56,189,248,0.35),inset_0_2px_4px_rgba(0,0,0,0.4)] border border-[#005f9e]/30 dark:border-[#38bdf8]/40 scale-[1.02]'
                      : 'bg-white dark:bg-[#191c1e] text-[#404751] dark:text-[#c0c7d3] shadow-[0_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-none dark:neumorphic-raised hover:text-[#005f9e] dark:hover:text-[#9dcaff]'
                  }`}
                >
                  {dur}s
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOCATION REQUIRED DIALOG -- shown when the player denied location
          permission or dismissed the native "Turn on GPS" prompt without
          enabling it, blocking round start. */}
      {locationDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-[#f7f9fc] dark:bg-[#1e2328] border border-white/90 dark:border-white/10 p-6 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] neumorphic-raised">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <MapPin className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
              Location Required
            </h3>

            <p className="text-sm text-[#5a626f] dark:text-[#a0a8b4] mt-2 mb-6 leading-relaxed">
              Mindful Walking Mode needs location permission and GPS turned on to track your steps. Enable both to start the round.
            </p>

            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={() => {
                  setLocationDenied(false);
                  startCalibration();
                }}
                className="w-full py-3 rounded-2xl bg-[#005f9e] dark:bg-[#9dcaff] text-white dark:text-[#003258] font-extrabold text-sm uppercase tracking-wide cursor-pointer transition-transform active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={() => setLocationDenied(false)}
                className="w-full py-3 rounded-2xl bg-transparent text-[#5a626f] dark:text-[#a0a8b4] font-bold text-sm cursor-pointer transition-transform active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightweight spinner overlay while the native GPS/permission check
          (and, if needed, the "Turn on GPS" dialog) is in flight. */}
      {isResolvingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
};
