/**
 * Cloud backup of the signed-in player's own best scores, backed by Firebase
 * Firestore. One document per user in the `leaderboard` collection.
 *
 * There is no real global leaderboard to query here -- every *other* row
 * shown on the Rank screen is simulated data (see regionService.ts), so
 * there is nothing worth reading Firestore for besides this player's own
 * doc. That keeps usage to exactly:
 * - One read per app launch (fetchMyBestScores, only if signed in).
 * - One write per completed round, and only when it's actually a new best
 *   (see App.tsx/MatchResultsModal.tsx, which compare against the locally
 *   cached best -- see localBest.ts -- before ever calling submitScore).
 */

import { getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './firebase';
import { DifficultyLevel } from '../types';

const db = getFirestore(getApp());

function scoreField(difficulty: DifficultyLevel): 'bestScoreEasy' | 'bestScoreMedium' | 'bestScoreHard' {
  return `bestScore${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}` as
    | 'bestScoreEasy'
    | 'bestScoreMedium'
    | 'bestScoreHard';
}

export interface CloudBestScores {
  easy: number;
  medium: number;
  hard: number;
}

/**
 * Reads the signed-in player's saved best scores. Call this once, right
 * after sign-in / on app launch -- never from the Rank screen itself.
 */
export async function fetchMyBestScores(uid: string): Promise<CloudBestScores | null> {
  const snap = await getDoc(doc(db, 'leaderboard', uid));
  if (!snap.exists()) return null;

  const data = snap.data() as Record<string, unknown>;
  return {
    easy: typeof data.bestScoreEasy === 'number' ? data.bestScoreEasy : 0,
    medium: typeof data.bestScoreMedium === 'number' ? data.bestScoreMedium : 0,
    hard: typeof data.bestScoreHard === 'number' ? data.bestScoreHard : 0,
  };
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
 * Saves a new personal-best score. The caller is responsible for already
 * having established (against the locally cached best -- see localBest.ts)
 * that this score actually beats the previous one; this function always
 * writes unconditionally, with no read, since that comparison already
 * happened client-side.
 */
export async function submitScore(params: SubmitScoreParams): Promise<void> {
  const field = scoreField(params.difficulty);

  await setDoc(
    doc(db, 'leaderboard', params.uid),
    {
      uid: params.uid,
      displayName: params.displayName,
      photoUrl: params.photoUrl,
      countryCode: params.countryCode,
      streak: params.streak,
      [field]: params.score,
      lastPlayedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
