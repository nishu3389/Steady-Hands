/**
 * Google Sign-In Service
 *
 * Uses Firebase Authentication (@capacitor-firebase/authentication), which
 * drives the real native Google Sign-In flow on Android (via
 * android/app/google-services.json + the Google Services Gradle plugin --
 * no client ID needs to live in this app's own config) and a Firebase-hosted
 * popup/redirect flow in a browser. Both resolve through the same plugin API
 * and the same GoogleUserProfile shape here (name, photo, email).
 */

import './firebase';
import { FirebaseAuthentication, type User } from '@capacitor-firebase/authentication';

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

function toProfile(user: User | null): GoogleUserProfile {
  if (!user) {
    throw new Error('No user returned from Google Sign-In');
  }
  return {
    id: user.uid,
    name: user.displayName || 'Google User',
    email: user.email || '',
    picture: user.photoUrl || '',
  };
}

/**
 * Initiates Google Sign-In and retrieves the user's name, profile photo, and
 * email.
 */
export async function signInWithGoogle(): Promise<GoogleUserProfile> {
  const result = await FirebaseAuthentication.signInWithGoogle();
  return toProfile(result.user);
}

/**
 * Signs out of Google/Firebase.
 */
export async function signOutFromGoogle(): Promise<void> {
  await FirebaseAuthentication.signOut();
}
