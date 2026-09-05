import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Footprints,
  Droplets,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { soundService } from '../services/audio';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  soundEnabled: boolean;
}

// ----------------------------------------------------
// STEP 1 ANIMATION: Calibration & Hold Flat
// ----------------------------------------------------
const CalibrateAnimation: React.FC = () => {
  const [phase, setPhase] = useState<'tilting' | 'centering' | 'locked'>('tilting');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const cycle = () => {
      setPhase('tilting');
      setProgress(0);

      // Transition to centering after 1.2s
      timer = setTimeout(() => {
        setPhase('centering');
        // Fill progress ring over 2.4s
        const startTime = Date.now();
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const p = Math.min(100, Math.round((elapsed / 2200) * 100));
          setProgress(p);
          if (p >= 100) {
            clearInterval(progressInterval);
            setPhase('locked');
          }
        }, 50);
      }, 1200);
    };

    cycle();
    const loopInterval = setInterval(cycle, 5200);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(loopInterval);
    };
  }, []);

  const dotX = phase === 'tilting' ? 24 : phase === 'centering' ? (100 - progress) * 0.12 : 0;
  const dotY = phase === 'tilting' ? -18 : phase === 'centering' ? (100 - progress) * -0.09 : 0;
  const phoneTilt = phase === 'tilting' ? -10 : 0;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* 3D Phone and Dial Visual */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
        {/* Phone silhouette background tilting into level */}
        <div
          className="absolute w-36 h-48 rounded-2xl border-2 border-white/20 dark:border-white/10 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 shadow-2xl transition-transform duration-700 ease-out flex flex-col items-center p-2"
          style={{ transform: `rotate(${phoneTilt}deg) scale(0.95)` }}
        >
          {/* Phone speaker notch */}
          <div className="w-10 h-1 rounded-full bg-white/30 mb-2" />
        </div>

        {/* Central Calibration Dial */}
        <div className="relative z-10 w-36 h-36 rounded-full bg-[#f0f4f9] dark:bg-[#191c1e] neumorphic-raised border-2 border-white/80 dark:border-white/10 flex items-center justify-center shadow-lg">
          {/* Progress SVG Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r="64"
              fill="none"
              stroke="#d1d9e6"
              strokeWidth="5"
              className="opacity-25"
            />
            <circle
              cx="72"
              cy="72"
              r="64"
              fill="none"
              stroke={phase === 'locked' ? '#22c55e' : '#0078c6'}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 64}
              strokeDashoffset={2 * Math.PI * 64 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          {/* Crosshairs */}
          <div className="absolute inset-4 rounded-full neumorphic-inset flex items-center justify-center overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.8" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.8" />
            </svg>

            {/* Target safe circle */}
            <div
              className={`w-14 h-14 rounded-full border transition-all duration-300 flex items-center justify-center ${
                phase === 'locked'
                  ? 'border-green-500 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : phase === 'centering'
                  ? 'border-[#0078c6] bg-[#0078c6]/15'
                  : 'border-red-400 bg-red-400/10'
              }`}
            >
              {phase === 'locked' && (
                <CheckCircle2 className="w-6 h-6 text-green-500 animate-scale-in" />
              )}
            </div>

            {/* Simulated Balance Dot */}
            {phase !== 'locked' && (
              <div
                className="absolute w-4 h-4 rounded-full bg-[#005f9e] dark:bg-[#9dcaff] shadow-[0_0_10px_rgba(0,95,158,0.8)] transition-all duration-200 ease-out"
                style={{
                  transform: `translate(${dotX}px, ${dotY}px)`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Real-time guidance badge */}
      <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1e2328]/90 neumorphic-raised border border-white/80 dark:border-white/10 shadow-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            phase === 'locked'
              ? 'bg-green-500 shadow-[0_0_8px_#22c55e]'
              : phase === 'centering'
              ? 'bg-sky-500 animate-ping'
              : 'bg-amber-500'
          }`}
        />
        <span className="text-xs font-bold text-[#191c1e] dark:text-[#eff1f4]">
          {phase === 'locked'
            ? 'Steady! Calibration Complete'
            : phase === 'centering'
            ? 'Centering Dot • Hold 3 Seconds...'
            : 'Hold Phone Flat & Level'}
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 2 ANIMATION: Mindful Walking Rhythm
// ----------------------------------------------------
const WalkingAnimation: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isWalking, setIsWalking] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState(60.0);

  useEffect(() => {
    // Stepping cadence: alternate footsteps
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % 4);
    }, 650);

    // Timer countdown while walking
    const timerInterval = setInterval(() => {
      setIsWalking((walk) => {
        if (walk) {
          setSimulatedTime((t) => (t > 54.0 ? +(t - 0.2).toFixed(1) : 60.0));
        }
        return walk;
      });
    }, 200);

    // Pause & Resume demo toggle every 3.5s
    const stateToggle = setInterval(() => {
      setIsWalking((prev) => !prev);
    }, 3200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
      clearInterval(stateToggle);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Visual walking track */}
      <div className="relative w-full max-w-[240px] h-44 rounded-2xl bg-gradient-to-b from-black/5 to-transparent dark:from-white/5 flex flex-col items-center justify-between p-3.5 border border-white/60 dark:border-white/10 shadow-inner overflow-hidden">
        {/* Animated footprints lane */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Footprints path */}
          <div className="absolute inset-0 flex flex-col items-center justify-around py-1">
            {/* Step 1 - Left Foot */}
            <div
              className={`flex items-center gap-6 transition-all duration-300 ${
                isWalking && stepIndex % 2 === 0
                  ? 'scale-110 opacity-100 text-[#005f9e] dark:text-[#9dcaff]'
                  : 'opacity-35 text-[#5a626f]'
              }`}
            >
              <div className="w-5 h-8 rounded-t-full rounded-b-lg border-2 border-current flex items-center justify-center shadow-sm -rotate-6">
                <span className="text-[8px] font-bold">L</span>
              </div>
              <div className="w-5 h-8" />
            </div>

            {/* Step 2 - Right Foot */}
            <div
              className={`flex items-center gap-6 transition-all duration-300 ${
                isWalking && stepIndex % 2 === 1
                  ? 'scale-110 opacity-100 text-[#005f9e] dark:text-[#9dcaff]'
                  : 'opacity-35 text-[#5a626f]'
              }`}
            >
              <div className="w-5 h-8" />
              <div className="w-5 h-8 rounded-t-full rounded-b-lg border-2 border-current flex items-center justify-center shadow-sm rotate-6">
                <span className="text-[8px] font-bold">R</span>
              </div>
            </div>
          </div>

          {/* Stepping ripple waves */}
          {isWalking && (
            <div className="absolute w-20 h-20 rounded-full border border-sky-400/40 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Dynamic Status Capsule (Walking vs Paused) */}
        <div
          className={`w-full py-1.5 px-3 rounded-xl flex items-center justify-between border transition-all duration-300 shadow-md ${
            isWalking
              ? 'bg-emerald-600/90 border-emerald-400/40 text-white'
              : 'bg-amber-500/95 border-amber-300/50 text-white animate-pulse'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Footprints
              className={`w-4 h-4 ${isWalking ? 'animate-bounce' : 'opacity-70'}`}
            />
            <span className="text-[11px] font-black uppercase tracking-wide">
              {isWalking ? 'Walking Active' : 'Timer Paused'}
            </span>
          </div>

          <span className="text-xs font-black tabular-nums tracking-tight">
            {simulatedTime.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Explanatory subtitle */}
      <div className="mt-3 text-center">
        <span className="text-xs font-semibold text-[#5a626f] dark:text-[#a0a8b4]">
          {isWalking
            ? 'Timer counts down while taking continuous strides'
            : 'If you stop walking, the timer pauses automatically'}
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 3 ANIMATION: Fluid Dynamics & Spill Prevention
// ----------------------------------------------------
const SpillAnimation: React.FC = () => {
  const [tiltAngle, setTiltAngle] = useState(0);
  const [isSpilling, setIsSpilling] = useState(false);
  const [waterLevel, setWaterLevel] = useState(94);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 60;
      // Oscillate tilt smoothly
      const angle = Math.sin((step / 60) * Math.PI * 2) * 16;
      setTiltAngle(angle);

      // Spill threshold around 10 degrees
      if (Math.abs(angle) > 9.5) {
        setIsSpilling(true);
        setWaterLevel((w) => Math.max(68, w - 0.4));
      } else {
        setIsSpilling(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Interactive Bowl Visualization */}
      <div className="relative w-full max-w-[260px] h-44 rounded-2xl bg-white/80 dark:bg-[#191c1e]/80 neumorphic-raised p-3 flex flex-col items-center justify-center border border-white/80 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Spill Warning Float */}
        {isSpilling && (
          <div className="absolute top-2 z-20 px-3 py-1 rounded-full bg-[#cb4830] text-white flex items-center gap-1.5 shadow-md animate-bounce">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Spilling! Tilt Back!
            </span>
          </div>
        )}

        {/* Rocking Bowl with Liquid */}
        <div
          className="relative w-36 h-24 transition-transform duration-75 ease-out flex items-center justify-center"
          style={{ transform: `rotate(${tiltAngle}deg)` }}
        >
          {/* Bowl Rim & Body */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 140 90">
            {/* Outer ceramic bowl */}
            <path
              d="M 10,15 Q 15,85 70,85 Q 125,85 130,15 Z"
              fill="currentColor"
              className={`transition-colors duration-200 ${
                isSpilling ? 'text-[#cb4830]/30' : 'text-slate-300 dark:text-slate-700'
              }`}
              stroke={isSpilling ? '#cb4830' : '#005f9e'}
              strokeWidth="3.5"
            />

            {/* Water fluid mass */}
            <path
              d={`M 16,35 Q 70,${35 - tiltAngle * 0.9} 124,35 Q 120,78 70,78 Q 20,78 16,35 Z`}
              fill="#0078c6"
              className="opacity-85"
            />

            {/* Water specular reflection arc */}
            <ellipse
              cx="70"
              cy="35"
              rx="54"
              ry="7"
              fill="#38bdf8"
              className="opacity-70"
            />

            {/* Droplets flying out during high tilt */}
            {isSpilling && (
              <>
                <circle cx={tiltAngle > 0 ? 134 : 6} cy="22" r="3.5" fill="#38bdf8" className="animate-ping" />
                <circle cx={tiltAngle > 0 ? 142 : -2} cy="32" r="2.5" fill="#0078c6" />
              </>
            )}
          </svg>
        </div>

        {/* Bottom Tactical Radar Preview */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/90 dark:bg-[#1e2328]/90 border border-white/80 dark:border-white/10 shadow-sm">
          <div className="relative w-5 h-5 rounded-full neumorphic-inset flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border border-sky-400/50" />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#005f9e] dark:bg-[#9dcaff] transition-transform"
              style={{
                transform: `translate(${tiltAngle * 0.35}px, 0px)`,
              }}
            />
          </div>
          <span className="text-[10px] font-black text-[#005f9e] dark:text-[#9dcaff] tabular-nums">
            {Math.round(waterLevel)}%
          </span>
        </div>
      </div>

      {/* Explanatory subtitle */}
      <div className="mt-3 text-center">
        <span className="text-xs font-semibold text-[#5a626f] dark:text-[#a0a8b4]">
          Avoid sudden turns or tilting past the safe zone to keep water inside
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 4 ANIMATION: Steadiness Score & Flow State
// ----------------------------------------------------
const SteadinessAnimation: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Victory / Flow State Card */}
      <div className="w-full max-w-[260px] rounded-2xl bg-white/90 dark:bg-[#191c1e]/90 neumorphic-raised p-4 flex flex-col items-center gap-3 border border-white/80 dark:border-white/10 shadow-lg">
        {/* Top badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-[#005f9e] dark:text-[#9dcaff]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Flow State Achieved
          </span>
        </div>

        {/* Score dial */}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-[#005f9e] dark:text-[#9dcaff] tracking-tight">
            96
          </span>
          <span className="text-lg font-bold text-[#005f9e] dark:text-[#9dcaff]">%</span>
        </div>
        <span className="text-[11px] font-bold text-[#5a626f] dark:text-[#a0a8b4] -mt-2">
          Mind-Body Steadiness
        </span>

        {/* Metric bars */}
        <div className="w-full flex flex-col gap-2 pt-1 border-t border-black/5 dark:border-white/10">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-bold text-[#191c1e] dark:text-[#eff1f4]">
              <span>Stillness (Water Held)</span>
              <span className="text-emerald-500">98%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-bold text-[#191c1e] dark:text-[#eff1f4]">
              <span>Walking Cadence</span>
              <span className="text-sky-500">94%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full w-[94%]" />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-bold text-[#191c1e] dark:text-[#eff1f4]">
              <span>Posture Balance</span>
              <span className="text-amber-500">96%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[96%]" />
            </div>
          </div>
        </div>

        {/* Streak bonus */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Keep 50%+ water after 60s to win</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN INTERACTIVE TUTORIAL MODAL
// ----------------------------------------------------
export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  soundEnabled,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tutorialSteps = [
    {
      num: 1,
      tagline: 'Step 1 of 4 • Phone Setup',
      title: 'Hold Flat to Calibrate',
      description:
        'Hold your phone flat with both hands before each round. Keep the balance dot steady inside the target circle for 3 seconds to lock in your neutral balance.',
      component: <CalibrateAnimation />,
    },
    {
      num: 2,
      tagline: 'Step 2 of 4 • Mindful Stride',
      title: 'Walk to Advance the Timer',
      description:
        'Steady Hands is a walking meditation. The 60-second timer only counts down while you take steady, active steps. If you stop moving, the timer pauses automatically.',
      component: <WalkingAnimation />,
    },
    {
      num: 3,
      tagline: 'Step 3 of 4 • Spill Prevention',
      title: 'Smooth Movement Prevents Spills',
      description:
        'Sudden jerks, abrupt turns, or tilting past the safe zone will slosh water over the bowl rim. Watch the tactical balance dial in the bottom-right corner to stay centered.',
      component: <SpillAnimation />,
    },
    {
      num: 4,
      tagline: 'Step 4 of 4 • Finish & Steadiness',
      title: 'Survive 60s to Win',
      description:
        'Finish the 60-second walk with at least 50% water preserved to win! Your session calculates a somatic Steadiness Score based on Stillness, Rhythm, and Posture.',
      component: <SteadinessAnimation />,
    },
  ];

  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (soundEnabled) soundService.playClick();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (soundEnabled) soundService.playClick();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    if (soundEnabled) soundService.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#f7f9fc] dark:bg-[#191c1e] border border-white/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden neumorphic-raised">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {tutorialSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (soundEnabled) soundService.playClick();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentStep === idx
                    ? 'w-6 bg-[#005f9e] dark:bg-[#9dcaff]'
                    : currentStep > idx
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Close / Skip Button */}
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-full text-[#5a626f] dark:text-[#a0a8b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Skip Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Animated Graphic Container */}
        <div className="w-full bg-[#f0f4f9] dark:bg-[#15181b] border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center min-h-[220px]">
          {step.component}
        </div>

        {/* Text Details Container */}
        <div className="p-5 flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#005f9e] dark:text-[#9dcaff]">
            {step.tagline}
          </span>
          <h2 className="text-xl font-black text-[#191c1e] dark:text-[#eff1f4] leading-tight">
            {step.title}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[#5a626f] dark:text-[#a0a8b4] leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation Actions Footer */}
        <div className="p-4 pt-1 flex items-center gap-2.5">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="h-12 px-4 rounded-2xl bg-white dark:bg-[#1e2328] text-[#191c1e] dark:text-[#eff1f4] font-bold text-sm neumorphic-raised active:neumorphic-inset border border-white/80 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 h-12 rounded-2xl bg-[#005f9e] dark:bg-[#9dcaff] text-white dark:text-[#003258] font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <span>Start 60s Walk</span>
                <Play className="w-4 h-4 fill-current" />
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
