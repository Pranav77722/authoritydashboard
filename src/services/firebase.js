import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

let app = null;
let auth = null;
let db = null;

// Promise that resolves when auth is ready
let authReadyPromise = Promise.resolve();

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Resolve when auth is ready, but fail fast on auth errors to avoid silent loading hangs.
  authReadyPromise = new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe = null;

    const doneResolve = (user) => {
      if (settled) return;
      settled = true;
      if (unsubscribe) unsubscribe();
      clearTimeout(timeoutId);
      resolve(user);
    };

    const doneReject = (error) => {
      if (settled) return;
      settled = true;
      if (unsubscribe) unsubscribe();
      clearTimeout(timeoutId);
      reject(error);
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        doneResolve(user);
      }
    });

    const timeoutId = setTimeout(() => {
      doneReject(new Error('Firebase auth timed out. Check Anonymous Auth and Vercel environment variables.'));
    }, 10000);

    // Sign in anonymously if not already signed in.
    signInAnonymously(auth).catch((error) => {
      console.error('Anonymous auth failed:', error);
      doneReject(new Error(`Anonymous auth failed: ${error.message}`));
    });
  });
}

export { app, auth, db, hasFirebaseConfig, authReadyPromise };
