/**
 * Google Sign-In Service
 *
 * - Native (packaged Android app via Capacitor): uses the
 *   @codetrix-studio/capacitor-google-auth plugin, which drives the real
 *   Google Sign-In SDK. This is required because Google blocks OAuth
 *   sign-in inside embedded WebViews (Error 403: disallowed_useragent),
 *   which is what the web GIS flow below runs in when packaged as an app.
 * - Web (e.g. `vite dev` in a browser): uses the official Google Identity
 *   Services (GIS) client-side SDK directly.
 *
 * Both paths resolve to the same GoogleUserProfile shape (name, photo, email).
 */

import { Capacitor } from '@capacitor/core';
import { GoogleAuth as CapacitorGoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export interface GoogleUserProfile {
  id: string;
  name: string;
  givenName?: string;
  familyName?: string;
  email: string;
  picture: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (error: { message?: string; type?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke: (accessToken: string, done?: () => void) => void;
        };
        id?: {
          initialize: (config: unknown) => void;
          prompt: (notification?: unknown) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

let lastAccessToken: string | null = null;
let gsiLoadPromise: Promise<void> | null = null;

/**
 * Ensures the Google Identity Services client library is loaded
 */
export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if script element already exists
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script. Please check your internet connection.'));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

/**
 * Returns the Google Client ID configured in environment variables
 */
export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

/**
 * Checks if a Google Client ID is configured
 */
export function isGoogleAuthConfigured(): boolean {
  const clientId = getGoogleClientId();
  return typeof clientId === 'string' && clientId.trim().length > 0 && !clientId.includes('YOUR_GOOGLE_CLIENT_ID');
}

let nativeGoogleAuthInitialized = false;

function ensureNativeGoogleAuthInitialized(): void {
  if (nativeGoogleAuthInitialized) return;
  CapacitorGoogleAuth.initialize({
    clientId: getGoogleClientId() || undefined,
    scopes: ['profile', 'email'],
    grantOfflineAccess: false,
  });
  nativeGoogleAuthInitialized = true;
}

async function signInWithGoogleNative(): Promise<GoogleUserProfile> {
  ensureNativeGoogleAuthInitialized();

  const user = await CapacitorGoogleAuth.signIn();

  return {
    id: user.id,
    name: user.name || user.givenName || 'Google User',
    givenName: user.givenName,
    familyName: user.familyName,
    email: user.email || '',
    picture: user.imageUrl || '',
  };
}

/**
 * Initiates Google OAuth Sign-In flow using Google Identity Services (GSI)
 * and retrieves the user's name, profile photo, and email.
 */
async function signInWithGoogleWeb(): Promise<GoogleUserProfile> {
  const clientId = getGoogleClientId();

  if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    throw new Error(
      'Google Client ID is not configured. Please define VITE_GOOGLE_CLIENT_ID in your environment variables to enable Google Sign-In.'
    );
  }

  await loadGoogleIdentityServices();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is unavailable. Please check your network or ad blocker and try again.');
  }

  return new Promise<GoogleUserProfile>((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google Sign-In failed'));
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token received from Google'));
            return;
          }

          lastAccessToken = tokenResponse.access_token;

          try {
            // Fetch the user's Google profile information (name, picture, email)
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!userInfoResponse.ok) {
              throw new Error(`Failed to fetch Google profile (${userInfoResponse.status}: ${userInfoResponse.statusText})`);
            }

            const data = await userInfoResponse.json();

            const profile: GoogleUserProfile = {
              id: data.sub || '',
              name: data.name || data.given_name || 'Google User',
              givenName: data.given_name,
              familyName: data.family_name,
              email: data.email || '',
              picture: data.picture || '',
            };

            resolve(profile);
          } catch (err: unknown) {
            const error = err as Error;
            reject(new Error(error.message || 'Failed to fetch user profile data from Google'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google Sign-In prompt was closed or encountered an error'));
        },
      });

      // Request token with consent prompt to ensure fresh account selection
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: unknown) {
      const error = err as Error;
      reject(new Error(error.message || 'Could not launch Google Sign-In'));
    }
  });
}

/**
 * Initiates Google Sign-In, using the native Google Sign-In SDK when running
 * as a packaged Capacitor app and the web GIS flow otherwise.
 */
export async function signInWithGoogle(): Promise<GoogleUserProfile> {
  if (Capacitor.isNativePlatform()) {
    return signInWithGoogleNative();
  }
  return signInWithGoogleWeb();
}

/**
 * Signs out of Google, revoking access token if available
 */
export async function signOutFromGoogle(userEmail?: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await CapacitorGoogleAuth.signOut();
    return;
  }

  if (lastAccessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(lastAccessToken);
    } catch {
      // Best-effort token revocation
    }
  }
  lastAccessToken = null;

  if (window.google?.accounts?.id?.disableAutoSelect) {
    try {
      window.google.accounts.id.disableAutoSelect();
    } catch {
      // Ignore
    }
  }
}
