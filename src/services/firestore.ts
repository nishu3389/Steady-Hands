/**
 * Global leaderboard, backed by Firebase Firestore.
 *
 * One document per signed-in user in the `leaderboard` collection, holding
 * their best score per difficulty (upserted, never appended to) plus enough
 * profile info to render their row without a second lookup. Guests never
 * write here -- only signed-in players do, and only the app itself submits
 * a score (right when a round finishes), never as a user-editable action.
 */

import { getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import './firebase';
import { DifficultyLevel } from '../types';

const db = getFirestore(getApp());

function scoreField(difficulty: DifficultyLevel): 'bestScoreEasy' | 'bestScoreMedium' | 'bestScoreHard' {
  return `bestScore${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}` as
    | 'bestScoreEasy'
    | 'bestScoreMedium'
    | 'bestScoreHard';
}

export interface SubmitScoreParams {
  uid: string;
  displayName: string;
  photoUrl: string;
  countryCode: string;
  difficulty: DifficultyLevel;
  score: number;
  streak: number;
}

/**
 * Records a completed round's score for the signed-in player, keeping only
 * their personal best per difficulty (and an overall best across all three,
 * used for the "ALL" leaderboard filter). Safe to call after every
 * completed round -- it's a no-op on the ranking if the new score isn't a
 * new best.
 */
export async function submitScore(params: SubmitScoreParams): Promise<void> {
  const ref = doc(db, 'leaderboard', params.uid);
  const field = scoreField(params.difficulty);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

    const currentBest = typeof existing[field] === 'number' ? (existing[field] as number) : 0;
    const nextBest = Math.max(currentBest, params.score);

    const currentOverall = typeof existing.bestScoreOverall === 'number' ? (existing.bestScoreOverall as number) : 0;
    const nextOverall = Math.max(currentOverall, nextBest);
    // Whichever difficulty most recently raised the overall best is the one
    // shown next to it in the "ALL" filter -- otherwise keep whatever was
    // already recorded.
    const bestDifficultyOverall =
      nextBest >= currentOverall ? params.difficulty : (existing.bestDifficultyOverall as DifficultyLevel) || params.difficulty;

    tx.set(
      ref,
      {
        uid: params.uid,
        displayName: params.displayName,
        photoUrl: params.photoUrl,
        countryCode: params.countryCode,
        streak: params.streak,
        [field]: nextBest,
        bestScoreOverall: nextOverall,
        bestDifficultyOverall,
        lastPlayedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export interface GlobalLeaderboardEntry {
  uid: string;
  displayName: string;
  photoUrl: string;
  countryCode: string;
  streak: number;
  score: number;
  difficulty: DifficultyLevel;
}

/**
 * Fetches the top N players for a difficulty ('all' uses the combined best
 * across difficulties). Excludes nobody -- the caller is responsible for
 * filtering out the current user's own row if they render it separately.
 */
export async function fetchGlobalLeaderboard(
  difficulty: DifficultyLevel | 'all',
  limitCount = 25
): Promise<GlobalLeaderboardEntry[]> {
  const field = difficulty === 'all' ? 'bestScoreOverall' : scoreField(difficulty);
  const q = query(collection(db, 'leaderboard'), orderBy(field, 'desc'), limit(limitCount));

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      uid: d.id,
      displayName: (data.displayName as string) || 'Player',
      photoUrl: (data.photoUrl as string) || '',
      countryCode: (data.countryCode as string) || '',
      streak: (data.streak as number) || 0,
      score: (data[field] as number) || 0,
      difficulty: difficulty === 'all' ? ((data.bestDifficultyOverall as DifficultyLevel) || 'medium') : difficulty,
    };
  });
}
