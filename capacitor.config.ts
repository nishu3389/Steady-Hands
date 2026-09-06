import type { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';

dotenv.config();

// Same Google OAuth Web Client ID used by the browser (GIS) sign-in flow in
// src/services/googleAuth.ts. The native Android Google Sign-In SDK also
// needs the *web* client ID here (as serverClientId) so the ID token it
// issues is scoped to that client -- this is separate from the Android OAuth
// client that must additionally exist in the same Google Cloud project,
// registered with this app's package name and signing SHA-1 fingerprint.
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || '';

const config: CapacitorConfig = {
  appId: 'com.steadyhands.balance',
  appName: 'Steady Hands',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#f7f9fc',
      showSpinner: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: googleClientId,
      forceCodeForRefreshToken: false,
    },
    AdMob: {
      appId: 'ca-app-pub-4833668827116420~3753425596',
      bannerAdUnitId: 'ca-app-pub-4833668827116420/8214685836',
    },
  },
};

export default config;
