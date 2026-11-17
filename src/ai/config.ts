import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';

const env: Record<string, string | undefined> = import.meta.env ?? {};

export const CLOUD_MODEL: string = env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
export const GEMINI_API_KEY: string | undefined = env.VITE_GEMINI_API_KEY || undefined;
export const FACTCHECK_API_KEY: string | undefined = env.VITE_FACTCHECK_API_KEY || undefined;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
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
