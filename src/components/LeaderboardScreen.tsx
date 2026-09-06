import React, { useState, useMemo, useEffect } from 'react';
import { LeaderboardEntry, UserProfile, DifficultyLevel } from '../types';
import { soundService } from '../services/audio';
import { regionService, RegionInfo } from '../services/regionService';
import { AdMimicBanner } from './AdMimicBanner';
import {
  Trophy,
  Flame,
  Target,
  UserPlus,
  Play,
  Sparkles,
  Check,
  Crown,
  ChevronRight,
} from 'lucide-react';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  onPlayNow: () => void;
  soundEnabled: boolean;
  profile?: UserProfile;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

interface ExtendedLeaderboardItem {
  id: string;
  name: string;
  initials: string;
  score: number;
  difficulty: DifficultyLevel;
  streakDays?: number;
  lastPlayed: string;
  isUser: boolean;
  deltaPB?: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  entries,
  onPlayNow,
  soundEnabled,
  profile,
}) => {
  const [currentRegion, setCurrentRegion] = useState<RegionInfo>(regionService.getRegion());
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Subscribe to regionService updates (region picks which player name pool
  // to display, but is never shown in the UI itself) and refresh on mount.
  useEffect(() => {
    const unsub = regionService.subscribe((newReg) => {
      setCurrentRegion(newReg);
    });

    regionService.fetchAndSaveLocation();

    return unsub;
  }, []);

  const userName = profile?.name || 'You';
  const userInitials = useMemo(() => {
    if (!userName || userName.trim() === '' || userName === 'Guest Player') return 'YOU';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  }, [userName]);

  // Real recorded rounds have an id like "lb-<timestamp>" (see
  // storageService.addLeaderboardEntry) -- the bundled seed data ("Alex
  // Chen" etc, shown before the player has ever recorded a real score) uses
  // short ids like "lb-1".."lb-6". This is the only reliable way to tell
  // "the player actually played" apart from "nothing saved yet, seed
  // fallback returned" -- the seed entries are otherwise indistinguishable
  // (one of them even sets isUser: true).
  const hasPlayed = useMemo(() => entries.some((e) => /^lb-\d{10,}$/.test(e.id)), [entries]);

  // Combined dataset: Regional roster + user's best recorded score
  const allEntries: ExtendedLeaderboardItem[] = useMemo(() => {
    if (!hasPlayed) return [];

    const userBest = entries.filter((e) => /^lb-\d{10,}$/.test(e.id));
    const highestUserScore = Math.max(...userBest.map((e) => e.score));
    const userDiff: DifficultyLevel = userBest[0].difficulty;

    // Regional simulated players list
    const regionalPlayers: ExtendedLeaderboardItem[] = currentRegion.players.map((p) => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      score: p.score,
      difficulty: p.difficulty,
      streakDays: p.streakDays,
      lastPlayed: p.lastPlayed,
      isUser: false,
      deltaPB: p.deltaPB,
    }));

    // Insert user entry into ranking list
    const userEntry: ExtendedLeaderboardItem = {
      id: 'user-self',
      name: userName === 'Guest Player' ? 'You' : userName,
      initials: userInitials,
      score: highestUserScore,
      difficulty: userDiff,
      streakDays: profile?.streak || 4,
      lastPlayed: 'Just now',
      isUser: true,
      deltaPB: '+1.8% PB',
    };

    const combined = [...regionalPlayers, userEntry].sort((a, b) => b.score - a.score);
    return combined;
  }, [hasPlayed, currentRegion, entries, userName, userInitials, profile]);

  // Apply Difficulty filter (ALL / EASY / MED / HARD)
  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (difficulty !== 'all') {
      result = result.filter((e) => e.difficulty === difficulty);
    }
    return result;
  }, [allEntries, difficulty]);

  // Separate Top 3 Podium and Contenders (4+)
  const podium = filteredEntries.slice(0, 3);
  const contenders = filteredEntries.slice(3);

  const handleDifficultyChange = (newDiff: DifficultyFilter) => {
    if (soundEnabled) soundService.playClick();
    setDifficulty(newDiff);
  };

  const handleInvite = async () => {
    if (soundEnabled) soundService.playClick();
    const shareData = {
      title: 'Steady Hands — Leaderboard',
      text: 'Check out my steadiness ranking! Can you balance the water bowl better?',
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(
        `Compare your steady hands score with other walkers! ${window.location.origin}`
      );
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      // Ignore
    }
  };

  const renderDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/20">
            EASY
          </span>
        );
      case 'medium':
        return (
          <span className="text-[9px] font-bold text-sky-400 bg-sky-950/70 px-1.5 py-0.5 rounded border border-sky-500/20">
            MED
          </span>
        );
      case 'hard':
        return (
          <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/20">
            HARD
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-bold text-sky-400 bg-sky-950/70 px-1.5 py-0.5 rounded">
            MED
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2 pb-24 text-slate-100 flex flex-col gap-3 select-none">
      {/* ========================================================================= */}
      {/* 1. Header Section with Geolocation / Mobile Network Detection             */}
      {/* ========================================================================= */}
      <header className="px-1 pt-1 pb-1 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              Leaderboard
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            </h1>
            <p className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
              BODY STEADINESS RANKINGS
            </p>
          </div>

          {/* Live Sync Notification Pill */}
          <div className="neu-inset px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-black/5 dark:border-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Live Sync</span>
          </div>
        </div>

        {/* Active Presence Pill & Reset Timer */}
        <div className="flex items-center justify-between px-0.5">
          <div className="neu-flat px-3 py-1 rounded-xl flex items-center gap-1.5 border border-black/5 dark:border-white/[0.03]">
            <span className="text-xs">👥</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">
              {currentRegion.activeWalkers.toLocaleString()} Walkers Active
            </span>
          </div>

          <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-xl border border-sky-500/20">
            Reset in {currentRegion.timeframeReset}
          </span>
        </div>

        {/* Difficulty Filter Pills: ALL / EASY / MED / HARD */}
        <div className="neu-inset p-1.5 rounded-2xl flex justify-between items-center text-xs mt-0.5">
          {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((diffKey) => {
            const isActive = difficulty === diffKey;
            const label = diffKey.toUpperCase();
            return (
              <button
                key={diffKey}
                onClick={() => handleDifficultyChange(diffKey)}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold tracking-wider transition-all text-center cursor-pointer ${
                  isActive
                    ? 'neu-active-glow text-sky-700 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {label === 'MEDIUM' ? 'MED' : label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Main Content: Empty State OR Podium + Rows                            */}
      {/* ========================================================================= */}
      {!hasPlayed ? (
        /* Empty State Hero Card */
        <main className="neu-raised rounded-3xl p-5 w-full flex flex-col items-center text-center relative overflow-hidden my-2 border border-white/5">
          <div className="relative w-36 h-36 my-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 ripple-ring-1 blur-md" />
            <div className="absolute inset-2 rounded-full border border-[#2F8FE0]/20 ripple-ring-2" />

            <div className="relative w-24 h-24 rounded-full neu-inset flex items-center justify-center border border-sky-400/20 shadow-inner">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#243342] to-[#16212b] shadow-lg flex items-center justify-center border border-[#2F8FE0]/30">
                <svg
                  className="w-8 h-8 text-[#9dcaff] drop-shadow-[0_0_8px_rgba(157,202,255,0.6)]"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  <path d="M7 16c2.5-1 7.5-1 10 0" stroke="#9dcaff" strokeWidth="1.4" />
                </svg>
              </div>
            </div>

            <div className="absolute top-2 right-4 text-amber-400 animate-pulse">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mt-1 mb-2">
            No Runs Recorded Yet
          </h2>
          <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-xs px-2 mb-4">
            Complete your first mindful walking session to calibrate your{' '}
            <span className="text-sky-300 font-semibold">Body Steadiness Index</span> and establish
            your rank.
          </p>

          <div className="neu-inset w-full rounded-2xl p-3.5 mb-5 flex justify-around items-center border border-white/5">
            <div className="text-left px-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Community Avg
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-white">
                {currentRegion.communityAvg.toFixed(1)}
                <span className="text-xs text-sky-400 font-semibold">%</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-left px-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Top 10 Benchmark
              </span>
              <span className="text-base font-extrabold text-amber-400">
                {currentRegion.top10Benchmark.toFixed(1)}
                <span className="text-xs font-semibold">%+</span>
              </span>
            </div>
          </div>

          <button
            onClick={onPlayNow}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#207ecc] to-[#2F8FE0] hover:from-[#268de3] hover:to-[#389ef3] text-white font-bold text-sm tracking-wide shadow-[0_4px_18px_rgba(47,143,224,0.38)] flex items-center justify-center space-x-2.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Your First Run</span>
          </button>
        </main>
      ) : (
        /* Active Leaderboard: Podium + Competitive Insights + Contenders */
        <main className="flex-1 space-y-4 pt-1">
          {/* Top 3 Podium Standings Card */}
          {podium.length > 0 && (
            <section
              aria-label="Top 3 Podium"
              className="neu-card-podium rounded-3xl p-4 border border-white/[0.05]"
            >
              <div className="flex items-end justify-between gap-2 pt-2">
                {/* #2 Place (Left) */}
                {podium[1] ? (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="mb-1 flex flex-col items-center">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 mb-1">
                        {podium[1].deltaPB || '+1.4% PB'}
                      </span>

                      <div className="relative">
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500 shadow-[0_0_12px_rgba(203,213,225,0.4)]">
                          <div className="w-full h-full rounded-full bg-slate-100 dark:bg-[#1c2127] flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 text-base">
                            {podium[1].initials}
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-950 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                          2
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-2 flex items-center gap-0.5 truncate max-w-[85px]">
                      {podium[1].isUser ? 'You' : podium[1].name}
                      {podium[1].isUser && <Crown className="w-3 h-3 text-amber-500" />}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                      {podium[1].score.toFixed(1)}%
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {renderDifficultyBadge(podium[1].difficulty)}
                    </div>

                    <div className="w-full h-16 neu-inset rounded-t-xl mt-3 flex items-center justify-center border-t border-slate-400/30">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">2nd</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* #1 Place (Center, Elevated) */}
                {podium[0] && (
                  <div className="flex-1 flex flex-col items-center -translate-y-2">
                    <div className="mb-1 flex flex-col items-center">
                      <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400 drop-shadow-[0_0_8px_#facc15] mb-0.5 animate-bounce" />

                      <div className="relative">
                        <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 shadow-[0_0_18px_rgba(250,204,21,0.5)]">
                          <div className="w-full h-full rounded-full bg-amber-50 dark:bg-[#201d12] flex items-center justify-center font-extrabold text-amber-600 dark:text-amber-300 text-lg">
                            {podium[0].initials}
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-yellow-200">
                          1
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-2 truncate max-w-[95px]">
                      {podium[0].isUser ? 'You' : podium[0].name}
                    </span>
                    <span className="text-base font-black text-amber-600 dark:text-amber-300 mt-0.5 tracking-tight">
                      {podium[0].score.toFixed(1)}%
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {renderDifficultyBadge(podium[0].difficulty)}
                      {podium[0].streakDays && (
                        <span className="text-[9px] font-bold text-orange-500">
                          🔥 {podium[0].streakDays}d
                        </span>
                      )}
                    </div>

                    <div className="w-full h-24 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-[#21262d] dark:to-[#161a1d] rounded-t-xl mt-3 flex flex-col items-center justify-center border-t-2 border-amber-400/50 shadow-inner">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-300">1st</span>
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                        LEADER
                      </span>
                    </div>
                  </div>
                )}

                {/* #3 Place (Right) */}
                {podium[2] ? (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="mb-1 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-500/20 mb-1">
                        🔥 {podium[2].streakDays || 5}d streak
                      </span>

                      <div className="relative">
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-700 via-orange-300 to-yellow-800 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
                          <div className="w-full h-full rounded-full bg-orange-50 dark:bg-[#201815] flex items-center justify-center font-bold text-orange-600 dark:text-orange-200 text-base">
                            {podium[2].initials}
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                          3
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-[85px]">
                      {podium[2].isUser ? 'You' : podium[2].name}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                      {podium[2].score.toFixed(1)}%
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {renderDifficultyBadge(podium[2].difficulty)}
                    </div>

                    <div className="w-full h-12 neu-inset rounded-t-xl mt-3 flex items-center justify-center border-t border-orange-500/30">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">3rd</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </section>
          )}

          {/* Competitive Feed Card */}
          <section
            aria-label="Competitive Insights"
            className="neu-inset rounded-2xl p-3.5 border border-white/[0.03] relative overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                <Flame className="w-5 h-5 fill-current" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">
                    You passed {podium[2]?.name || 'Contender'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    +0.6%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {difficulty === 'all' ? 'Hard' : difficulty.toUpperCase()} Mode
                </p>

                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Target className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <strong className="text-sky-600 dark:text-sky-300">
                      {(Math.max(0.1, (podium[0]?.score || 98.7) - (podium[1]?.score || 97.4))).toFixed(1)}% behind
                    </strong>{' '}
                    {podium[0]?.name || 'Leader'} for #1!
                  </span>

                  <button
                    onClick={onPlayNow}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Play Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Next Contenders List (Ranks 4+) */}
          {contenders.length > 0 && (
            <section aria-label="Contenders" className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Contenders
                </h2>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Steadiness Score</span>
              </div>

              {contenders.map((item, idx) => {
                const rankNumber = idx + 4;
                return (
                  <article
                    key={item.id}
                    className="neu-card rounded-2xl p-3 flex items-center justify-between transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-300 dark:to-slate-500 flex items-center justify-center text-slate-900 dark:text-slate-950 font-extrabold text-sm shadow-inner shrink-0">
                        {rankNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                            {item.isUser ? 'You' : item.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {renderDifficultyBadge(item.difficulty)}
                          <span className="text-slate-400 dark:text-slate-600">•</span>
                          {item.streakDays ? (
                            <span className="text-[10px] font-bold text-orange-500 dark:text-orange-400">
                              🔥 {item.streakDays}d streak
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              Last played: {item.lastPlayed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {item.score.toFixed(1)}
                        <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Steadiness
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* AdMob Banner Preview */}
          <AdMimicBanner placement="leaderboard" />

          {/* Invite Friends Action */}
          <section className="pt-2 pb-1 flex justify-center">
            <button
              onClick={handleInvite}
              className="w-full py-3.5 px-5 rounded-2xl neu-flat hover:bg-slate-100 dark:hover:bg-[#1f2429] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-sky-500/20 group shadow-lg cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400 group-hover:scale-110 transition-transform">
                {copiedInvite ? (
                  <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-bold tracking-wide text-sky-600 dark:text-sky-300">
                {copiedInvite ? 'Invite Link Copied!' : 'Invite Friends to Compete'}
              </span>
            </button>
          </section>
        </main>
      )}
    </div>
  );
};
