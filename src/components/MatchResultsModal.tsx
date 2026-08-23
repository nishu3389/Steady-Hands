import React, { useEffect, useState } from 'react';
import { GameResult } from '../types';
import { Trophy, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audio';
import { MINDFUL_BENEFITS, MindfulBenefit } from '../data/mindfulBenefits';

interface MatchResultsModalProps {
  result: GameResult;
  onTryAgain: () => void;
  onOpenLeaderboard: () => void;
  soundEnabled: boolean;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  result,
  onTryAgain,
  onOpenLeaderboard,
  soundEnabled,
}) => {
  // Randomly select one of the 12 mindful benefits upon mount/result
  const [randomBenefit] = useState<MindfulBenefit>(() => {
    const randomIndex = Math.floor(Math.random() * MINDFUL_BENEFITS.length);
    return MINDFUL_BENEFITS[randomIndex];
  });

  useEffect(() => {
    if (result.isWin) {
      if (soundEnabled) soundService.playWin();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f4be57', '#0078c6', '#cb4830', '#2F8FE0', '#fdc65e'],
        });
      } catch {
        // Ignore
      }
    } else {
      if (soundEnabled) soundService.playLoss();
    }
  }, [result.isWin, soundEnabled]);

  return (
    <div className="flex flex-col w-full h-full items-center justify-center px-4 py-8 max-w-sm mx-auto">
      <div className="card-raised bg-white dark:bg-[#191c1e] rounded-3xl w-full p-6 sm:p-7 flex flex-col items-center gap-5 relative z-10 transition-transform animate-in fade-in zoom-in-95 duration-300 border border-white/60 dark:border-transparent">
        {/* Celebration Header */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Burst Background */}
          {result.isWin && (
            <svg
              className="absolute inset-0 w-full h-full text-[#ffdea8] dark:text-[#5e4200] opacity-40 animate-[spin_12s_linear_infinite]"
              fill="currentColor"
              viewBox="0 0 100 100"
            >
              <path d="M50 0L55 35L90 40L60 60L70 95L50 70L30 95L40 60L10 40L45 35Z" />
            </svg>
          )}

          <div
            className={`w-22 h-22 rounded-full neumorphic-raised flex items-center justify-center relative z-10 ${
              result.isWin
                ? 'bg-[#fdc65e] text-[#745200]'
                : 'bg-[#ffdad6] text-[#93000a] dark:bg-[#93000a] dark:text-[#ffdad6]'
            }`}
          >
            {result.isWin ? (
              <Trophy className="w-11 h-11 fill-current" />
            ) : (
              <AlertCircle className="w-11 h-11" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              result.isWin
                ? 'text-[#7c5800] dark:text-[#f4be57]'
                : 'text-[#a9301b] dark:text-[#ffb4a5]'
            }`}
          >
            {result.isWin ? 'You Win!' : 'Water Spilled!'}
          </h2>
          {result.isNewBest && (
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fdc65e]/30 text-[#745200] dark:text-[#f4be57]">
              ⭐ NEW PERSONAL BEST!
            </span>
          )}
        </div>

        {/* Score Display */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-[#404751] dark:text-[#c0c7d3] uppercase tracking-widest">
            FINAL SCORE
          </span>
          <div className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-[#7c5800] dark:text-[#f4be57]">
            {result.finalScore}
          </div>
        </div>

        {/* Stats */}
        <p className="text-sm text-[#404751] dark:text-[#c0c7d3] text-center px-2">
          You kept{' '}
          <span className="font-bold text-[#005f9e] dark:text-[#9dcaff]">
            {Math.round(result.waterRemaining)}%
          </span>{' '}
          of the water over{' '}
          <span className="font-bold text-[#191c1e] dark:text-[#eff1f4]">
            {result.totalDuration.toFixed(1)}s
          </span>
        </p>

        {/* Mindful Takeaway Box */}
        <div className="w-full p-3.5 rounded-2xl bg-[#eef4fb] dark:bg-[#122230] border border-[#005f9e]/15 dark:border-[#9dcaff]/20 flex flex-col gap-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e3448] shrink-0 shadow-sm">
              {randomBenefit.icon('w-4 h-4 text-[#005f9e] dark:text-[#9dcaff]')}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#005f9e] dark:text-[#9dcaff]">
                Mindful Benefit • {randomBenefit.tagline}
              </span>
              <h4 className="text-xs font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
                {randomBenefit.title}
              </h4>
            </div>
          </div>
          <p className="text-xs text-[#404751] dark:text-[#a0c5e8] leading-relaxed pl-0.5 pt-0.5">
            {randomBenefit.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5 mt-1">
          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onTryAgain();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#005f9e] hover:bg-[#0078c6] active:scale-98 text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onOpenLeaderboard();
            }}
            className="w-full py-3 rounded-2xl bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] font-bold text-base active:scale-98 transition-all flex items-center justify-center gap-2 card-raised border border-[#0078c6]/30 cursor-pointer"
          >
            <BarChart2 className="w-5 h-5" />
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
