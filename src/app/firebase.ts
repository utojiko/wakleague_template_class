import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

let db: ReturnType<typeof getDatabase> | null = null;
let authSignedIn = false;

/** Initialize Firebase if a config is available. Returns the Database instance or null. */
export function initFirebase(config?: any) {
  const conf = config ?? (window as any).__FIREBASE_CONFIG__;
  if (!conf) return null;
  if (!getApps().length) initializeApp(conf);
    try {
      db = getDatabase();
      // Attempt anonymous sign-in once so clients can write when rules require auth
      try {
        if (!authSignedIn && typeof getAuth === 'function') {
          const auth = getAuth();
          signInAnonymously(auth).catch((err) => {
            // Log sign-in errors to help diagnose 400 responses (e.g. OPERATION_NOT_ALLOWED or API key restrictions)
            // Keep the app functional by not throwing.
            // eslint-disable-next-line no-console
            console.error('Firebase anonymous sign-in failed:', err);
          });
          authSignedIn = true;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Firebase auth init failed:', err);
      }
      return db;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Firebase database init failed:', err);
      return null;
    }
}

export function getDatabaseInstance() {
  return db;
}
