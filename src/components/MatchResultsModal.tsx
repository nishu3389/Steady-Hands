import React, { useEffect, useState } from 'react';
import { GameResult, UserProfile } from '../types';
import { RefreshCw, BarChart2, AlertCircle, Footprints, Droplets, Sparkles, Activity, ShieldCheck, MessageCircle, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audio';
import { MINDFUL_BENEFITS, MindfulBenefit } from '../data/mindfulBenefits';
import { AdMimicBanner } from './AdMimicBanner';
import { ShareExperienceModal } from './ShareExperienceModal';

interface MatchResultsModalProps {
  result: GameResult;
  onTryAgain: () => void;
  onOpenLeaderboard: () => void;
  soundEnabled: boolean;
  profile?: UserProfile;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  result,
  onTryAgain,
  onOpenLeaderboard,
  soundEnabled,
  profile,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  // Randomly select one mindful benefit upon mount
  const [randomBenefit] = useState<MindfulBenefit>(() => {
    const randomIndex = Math.floor(Math.random() * MINDFUL_BENEFITS.length);
    return MINDFUL_BENEFITS[randomIndex];
  });

  useEffect(() => {
    if (result.isWin) {
      if (soundEnabled) soundService.playWin();
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.55 },
          colors: ['#38bdf8', '#0078c6', '#10b981', '#2F8FE0', '#34d399'],
        });
      } catch {
        // Ignore
      }
    } else {
      if (soundEnabled) soundService.playLoss();
    }
  }, [result.isWin, soundEnabled]);

  const steadiness = Math.round(result.steadinessScore ?? result.finalScore ?? 85);
  const breakdown = result.steadinessBreakdown || {
    stillnessScore: Math.round(result.waterRemaining),
    rhythmScore: 85,
    postureScore: Math.round(Math.max(50, result.waterRemaining * 0.95)),
    timeInSafeZoneSec: Math.round(result.totalDuration * 0.85 * 10) / 10,
    totalTimeSec: Math.round(result.totalDuration * 10) / 10,
    safeZoneRatio: 0.85,
    gradeTitle: steadiness >= 90 ? 'Flow State' : steadiness >= 75 ? 'Mindful Balance' : 'Grounded Focus',
    gradeIcon: steadiness >= 90 ? '🪷' : steadiness >= 75 ? '🌊' : '🍃',
    feedback: 'Strong postural equilibrium with gentle, controlled strides.',
  };

  const waterPct = Math.max(0, Math.min(100, Math.round(result.waterRemaining)));
  const targetDuration =
    result.targetDuration || (result.totalDuration >= 75 ? 90 : result.totalDuration >= 52 ? 60 : 45);

  // SVG circular gauge math for Steadiness Index (radius 48 -> circumference ~301.59)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * steadiness) / 100;

  // Distance formatting
  const steps = result.stepsTaken ?? 0;
  const feet = result.distanceFeet ?? Math.round(steps * 1.804 * 10) / 10;
  const meters = result.distanceMeters ?? Math.round(steps * 0.55 * 10) / 10;

  return (
    <div className="flex flex-col w-full h-full items-center justify-center px-4 py-3 max-w-md mx-auto my-auto overflow-y-auto hide-scrollbar">
      <div className="card-raised bg-white dark:bg-[#191c1e] rounded-3xl w-full p-5 sm:p-6 flex flex-col items-center gap-3.5 relative z-10 transition-transform animate-in fade-in zoom-in-95 duration-300 border border-white/70 dark:border-[#2b3543]">
        {/* Status Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                result.isWin
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
              }`}
            >
              {result.isWin ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Walk Completed
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  Water Spilled
                </>
              )}
            </span>
            <span className="text-xs font-bold text-[#707882] dark:text-[#a0a8b4] uppercase tracking-wide">
              {result.difficulty.toUpperCase()} • {targetDuration}s
            </span>
          </div>

          {result.isNewBest && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#ffdea8] dark:bg-[#5e4200] text-[#745200] dark:text-[#f4be57] flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 fill-current" /> NEW BEST
            </span>
          )}
        </div>

        {/* HERO METRIC: Body Steadiness Index Gauge */}
        <div className="flex flex-col items-center justify-center my-1 relative w-full text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
              {/* Track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-[#e2e8f0] dark:text-[#223344]"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  steadiness >= 85
                    ? 'text-[#0078c6] dark:text-[#38bdf8]'
                    : steadiness >= 65
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : steadiness >= 45
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Center Content: Steadiness % */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-black tracking-tight text-[#191c1e] dark:text-[#eff1f4]">
                  {steadiness}
                </span>
                <span className="text-xl font-bold text-[#005f9e] dark:text-[#9dcaff] ml-0.5">
                  %
                </span>
              </div>
              <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#707882] dark:text-[#a0a8b4] flex items-center gap-0.5 mt-0.5">
                Steadiness
              </span>
            </div>
          </div>

          {/* Achievement Title Badge */}
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f4f8] dark:bg-[#1f2d3d] border border-black/5 dark:border-white/10">
              <span className="text-sm">{breakdown.gradeIcon}</span>
              <span className="text-xs font-black tracking-wide text-[#005f9e] dark:text-[#9dcaff]">
                {breakdown.gradeTitle}
              </span>
            </div>
          </div>

          {/* Human Biofeedback Note */}
          <p className="text-xs text-[#525a66] dark:text-[#a0a8b4] leading-relaxed max-w-xs mt-1.5">
            "{breakdown.feedback}"
          </p>
        </div>

        {/* 3 PILLARS OF MIND-BODY STABILITY */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {/* Pillar 1: Fluid Stillness */}
          <div className="p-2.5 rounded-2xl bg-[#f5f8fb] dark:bg-[#162432] border border-[#dce5ed] dark:border-[#22374c] flex flex-col justify-between text-left">
            <div className="flex items-center gap-1 text-[#005f9e] dark:text-[#9dcaff] mb-1">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Stillness</span>
            </div>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-black text-[#191c1e] dark:text-[#eff1f4]">
                  {breakdown.stillnessScore}
                </span>
                <span className="text-[11px] font-bold text-[#005f9e] dark:text-[#9dcaff]">%</span>
              </div>
              <span className="text-[10px] text-[#707882] dark:text-[#8d98a7] block truncate">
                {waterPct}% water kept
              </span>
            </div>
          </div>

          {/* Pillar 2: Walking Rhythm */}
          <div className="p-2.5 rounded-2xl bg-[#f5f8fb] dark:bg-[#162432] border border-[#dce5ed] dark:border-[#22374c] flex flex-col justify-between text-left">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <Footprints className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rhythm</span>
            </div>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-black text-[#191c1e] dark:text-[#eff1f4]">
                  {breakdown.rhythmScore}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">%</span>
              </div>
              <span className="text-[10px] text-[#707882] dark:text-[#8d98a7] block truncate">
                {result.cadence && result.cadence > 0 ? `${result.cadence} spm` : `${steps} steps`}
              </span>
            </div>
          </div>

          {/* Pillar 3: Posture Control */}
          <div className="p-2.5 rounded-2xl bg-[#f5f8fb] dark:bg-[#162432] border border-[#dce5ed] dark:border-[#22374c] flex flex-col justify-between text-left">
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Posture</span>
            </div>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-black text-[#191c1e] dark:text-[#eff1f4]">
                  {breakdown.postureScore}
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">%</span>
              </div>
              <span className="text-[10px] text-[#707882] dark:text-[#8d98a7] block truncate">
                {breakdown.timeInSafeZoneSec}s centered
              </span>
            </div>
          </div>
        </div>

        {/* Mindful Journey Distance Summary */}
        <div className="w-full px-3 py-2 rounded-xl bg-[#f0f4f8] dark:bg-[#1f2d3d]/50 flex items-center justify-between text-xs text-[#525a66] dark:text-[#a0a8b4]">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#005f9e] dark:text-[#9dcaff]" />
            <span>Path Walked</span>
          </div>
          <span className="font-bold text-[#191c1e] dark:text-[#eff1f4]">
            {feet} ft ({meters}m) • {steps} steps
          </span>
        </div>

        {/* Mindful Takeaway Box */}
        <div className="w-full p-3 rounded-2xl bg-[#eef4fb] dark:bg-[#122230] border border-[#005f9e]/15 dark:border-[#9dcaff]/20 flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white dark:bg-[#1e3448] shrink-0 shadow-sm">
              {randomBenefit.icon('w-3.5 h-3.5 text-[#005f9e] dark:text-[#9dcaff]')}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#005f9e] dark:text-[#9dcaff] truncate">
              Mindful Takeaway • {randomBenefit.title}
            </span>
          </div>
          <p className="text-xs text-[#404751] dark:text-[#a0c5e8] leading-relaxed pl-0.5">
            {randomBenefit.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2 mt-0.5">
          {/* Share with Friends (WhatsApp) Highlight Action */}
          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              setShowShareModal(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#25D366] via-[#1ea352] to-[#128C7E] hover:from-[#29df6d] hover:to-[#169f8f] active:scale-98 text-white font-black text-sm shadow-[0_4px_18px_rgba(37,211,102,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-300/30"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Share with Friends (WhatsApp)</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onTryAgain();
            }}
            className="w-full py-3 rounded-2xl bg-[#005f9e] hover:bg-[#0078c6] active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Walk Again
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onOpenLeaderboard();
            }}
            className="w-full py-2.5 rounded-2xl bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] font-bold text-sm active:scale-98 transition-all flex items-center justify-center gap-2 card-raised border border-[#0078c6]/30 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            Steadiness Leaderboard
          </button>

          {/* AdMob Banner Placement Preview */}
          <AdMimicBanner placement="results" />
        </div>
      </div>

      {/* Share Experience Screen with Animated Making UI & Automatic WhatsApp */}
      <ShareExperienceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        result={result}
        profile={profile}
        soundEnabled={soundEnabled}
      />
    </div>
  );
};
