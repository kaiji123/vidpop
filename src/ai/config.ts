import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';

// Reference each variable individually: Vite inlines only what is named, and reading the
// whole import.meta.env object would copy every VITE_* value into the bundle.
export const CLOUD_MODEL: string = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
// Dev-only: a raw key would be visible to every visitor. Vite removes this branch from
// production builds, so the key can't ship even if it is set when you deploy.
export const GEMINI_API_KEY: string | undefined = import.meta.env.DEV
  ? import.meta.env.VITE_GEMINI_API_KEY || undefined
  : undefined;
// Fact Check API keys are browser keys by design; restrict it by HTTP referrer in Cloud Console.
export const FACTCHECK_API_KEY: string | undefined = import.meta.env.VITE_FACTCHECK_API_KEY || undefined;

// Firebase web config is public by design; access is protected by App Check + API restrictions.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | undefined;
let ai: AI | undefined;

export function getFirebaseAI(): AI | undefined {
  if (!firebaseConfigured) return undefined;
  if (!ai) {
    app = initializeApp(firebaseConfig);
    ai = getAI(app, { backend: new GoogleAIBackend() });
  }
  return ai;
}

export type CloudBackend = 'firebase' | 'gemini-api' | 'none';
export const cloudBackend: CloudBackend = firebaseConfigured ? 'firebase' : GEMINI_API_KEY ? 'gemini-api' : 'none';
