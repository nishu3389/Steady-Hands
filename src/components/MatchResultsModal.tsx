import React, { useEffect } from 'react';
import { GameResult } from '../types';
import { Trophy, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audio';

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
      <div className="card-raised bg-white dark:bg-[#191c1e] rounded-3xl w-full p-6 sm:p-8 flex flex-col items-center gap-6 relative z-10 transition-transform animate-in fade-in zoom-in-95 duration-300 border border-white/60 dark:border-transparent">
        {/* Celebration Header */}
        <div className="relative w-32 h-32 flex items-center justify-center">
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
            className={`w-24 h-24 rounded-full neumorphic-raised flex items-center justify-center relative z-10 ${
              result.isWin
                ? 'bg-[#fdc65e] text-[#745200]'
                : 'bg-[#ffdad6] text-[#93000a] dark:bg-[#93000a] dark:text-[#ffdad6]'
            }`}
          >
            {result.isWin ? (
              <Trophy className="w-12 h-12 fill-current" />
            ) : (
              <AlertCircle className="w-12 h-12" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2
            className={`text-3xl font-extrabold tracking-tight ${
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
          <div className="text-7xl font-extrabold tracking-tighter text-[#7c5800] dark:text-[#f4be57]">
            {result.finalScore}
          </div>
        </div>

        {/* Stats */}
        <p className="text-base text-[#404751] dark:text-[#c0c7d3] text-center px-2">
          You kept{' '}
          <span className="font-bold text-[#005f9e] dark:text-[#9dcaff]">
            {Math.round(result.waterRemaining)}%
          </span>{' '}
          of the water over{' '}
          <span className="font-bold text-[#191c1e] dark:text-[#eff1f4]">
            {result.totalDuration.toFixed(1)}s
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-3 mt-2">
          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onTryAgain();
            }}
            className="w-full py-4 rounded-2xl bg-[#005f9e] hover:bg-[#0078c6] active:scale-98 text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={() => {
              if (soundEnabled) soundService.playClick();
              onOpenLeaderboard();
            }}
            className="w-full py-4 rounded-2xl bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] font-bold text-lg active:scale-98 transition-all flex items-center justify-center gap-2 card-raised border border-[#0078c6]/30 cursor-pointer"
          >
            <BarChart2 className="w-5 h-5" />
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
