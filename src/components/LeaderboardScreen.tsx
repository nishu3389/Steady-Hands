import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { soundService } from '../services/audio';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  onPlayNow: () => void;
  soundEnabled: boolean;
}

type FilterType = 'all' | 'easy' | 'medium' | 'hard';

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  entries,
  onPlayNow,
  soundEnabled,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'easy') return entry.difficulty === 'easy';
    if (filter === 'medium') return entry.difficulty === 'medium' || (entry.difficulty as string) === 'normal';
    if (filter === 'hard') return entry.difficulty === 'hard' || (entry.difficulty as string) === 'expert' || (entry.difficulty as string) === 'master';
    return true;
  });

  const handleFilterClick = (newFilter: FilterType) => {
    if (soundEnabled) soundService.playClick();
    setFilter(newFilter);
  };

  // Soft luminous radial rank badges matching the design
  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-br from-[#ffe29a] via-[#f7cb68] to-[#f4be57]/80 text-[#7c5800] dark:from-[#ffe29a] dark:to-[#f4be57] dark:text-[#5e4200] shadow-[0_2px_10px_rgba(244,190,87,0.35)]';
    }
    if (rank === 2) {
      return 'bg-gradient-to-br from-[#ffffff] via-[#e5e9f0] to-[#cbd5e1] text-[#475569] dark:from-[#2d3748] dark:to-[#1a202c] dark:text-[#e2e8f0] shadow-[0_2px_8px_rgba(203,213,225,0.4)] dark:shadow-none';
    }
    if (rank === 3) {
      return 'bg-gradient-to-br from-[#ffe3dc] via-[#fcc5b8] to-[#f8a896] text-[#a9301b] dark:from-[#4a2418] dark:to-[#2e140d] dark:text-[#ffb4a5] shadow-[0_2px_8px_rgba(248,168,150,0.35)] dark:shadow-none';
    }
    return 'bg-gradient-to-br from-[#f8fafc] via-[#edf2f7] to-[#e2e8f0] text-[#64748b] dark:from-[#242b35] dark:to-[#191c1e] dark:text-[#94a3b8]';
  };

  const getDifficultyTag = (entry: LeaderboardEntry) => {
    switch (entry.difficulty) {
      case 'easy':
        return <span className="text-[12px] font-bold text-[#707882] dark:text-[#a0a8b4] tracking-[0.08em] uppercase">EASY</span>;
      case 'medium':
      case 'normal' as any:
        return <span className="text-[12px] font-bold text-[#005f9e] dark:text-[#9dcaff] tracking-[0.08em] uppercase">MED</span>;
      case 'hard':
      case 'expert' as any:
      case 'master' as any:
        return <span className="text-[12px] font-bold text-[#7c5800] dark:text-[#f4be57] tracking-[0.08em] uppercase">HARD</span>;
      default:
        return <span className="text-[12px] font-bold text-[#707882] tracking-[0.08em] uppercase">MED</span>;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto px-5 pt-6 pb-28 gap-5 select-none">
      {/* Segmented Filter Control */}
      <div className="w-full bg-[#e9edf2] dark:bg-[#162B3B] rounded-full p-1.5 flex items-center justify-between neumorphic-inset">
        {[
          { id: 'all', label: 'ALL' },
          { id: 'easy', label: 'EASY' },
          { id: 'medium', label: 'MED' },
          { id: 'hard', label: 'HARD' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterClick(tab.id as FilterType)}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-[0.1em] transition-all duration-200 cursor-pointer text-center ${
                isActive
                  ? 'bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] shadow-[0_2px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] font-extrabold'
                  : 'text-[#64748b] dark:text-[#c0c7d3] hover:text-[#005f9e]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="flex flex-col gap-4 mt-0.5">
        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-[#191c1e] rounded-2xl p-8 card-raised flex flex-col items-center justify-center text-center gap-4 mt-2 border border-white/60 dark:border-transparent">
            <span className="text-4xl">🏆</span>
            <p className="text-base text-[#404751] dark:text-[#c0c7d3]">
              No scores recorded yet for this category!
            </p>
            <button
              onClick={onPlayNow}
              className="px-6 py-3 rounded-full bg-[#005f9e] text-white font-bold text-xs tracking-wider shadow-md hover:bg-[#0078c6] transition-all cursor-pointer"
            >
              PLAY NOW
            </button>
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.id}
                className="w-full bg-white dark:bg-[#191c1e] rounded-2xl px-5 py-4 card-raised flex items-center justify-between transition-transform duration-200 border border-white/60 dark:border-transparent"
              >
                <div className="flex items-center gap-4">
                  {/* Circular Rank Badge */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${getRankBadgeClass(
                      rank
                    )}`}
                  >
                    {rank}
                  </div>

                  {/* Player Name & Difficulty */}
                  <div className="flex flex-col">
                    <span className="font-bold text-[17px] text-[#191c1e] dark:text-[#eff1f4] tracking-tight">
                      {entry.name}
                    </span>
                    <div className="mt-0.5">
                      {getDifficultyTag(entry)}
                    </div>
                  </div>
                </div>

                {/* Steadiness Score */}
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline">
                    <span
                      className={`text-[24px] font-extrabold tracking-tight ${
                        rank === 1
                          ? 'text-[#005f9e] dark:text-[#9dcaff]'
                          : 'text-[#191c1e] dark:text-[#eff1f4]'
                      }`}
                    >
                      {entry.score.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-[#005f9e] dark:text-[#9dcaff] ml-0.5">
                      %
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#707882] dark:text-[#8d98a7]">
                    Steadiness
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
