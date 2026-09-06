import { initializeApp, getApps } from 'firebase/app';

// Values from the Android app's google-services.json (android/app/), plus
// the conventional authDomain derived from the Firebase project id. These
// aren't secret -- they identify the Firebase project, not grant access to
// it (that's controlled by Firebase Security Rules) -- so it's fine for them
// to live in source rather than .env.
//
// appId below is borrowed from the Android app registration since no
// separate Web app has been registered in the Firebase console yet. That's
// fine for Authentication (it only really needs apiKey/authDomain/projectId)
// but if a Web app is registered later, swap in its own appId here for
// correctness with Firebase Analytics/other web-specific services.
const firebaseConfig = {
  apiKey: 'AIzaSyAyF3TwVo-o2kNj1j7TfooaYdVtF54V6XE',
  authDomain: 'steadyhands-5cf12.firebaseapp.com',
  projectId: 'steadyhands-5cf12',
  storageBucket: 'steadyhands-5cf12.firebasestorage.app',
  messagingSenderId: '235232628807',
  appId: '1:235232628807:android:53069bab611971ba1e6162',
};

// The @capacitor-firebase/authentication plugin uses the Firebase JS SDK as
// its shared interface layer on every platform (native sign-in results get
// synced into it), so this must run before any FirebaseAuthentication call,
// regardless of whether we're on native Android or in a browser.
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
