// Refuses to deploy without App Check: the Firebase web config is public, so without App Check
// anyone could call Gemini on this project's (Blaze) billing.
import { existsSync, readFileSync } from 'node:fs';

const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const get = (k) => process.env[k] ?? env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();

if (!get('VITE_RECAPTCHA_ENTERPRISE_SITE_KEY')) {
  console.error(`
✗ Deploy blocked: App Check is not configured.

  1. Create a reCAPTCHA Enterprise key (Website; domains: localhost, <project>.web.app, <project>.firebaseapp.com; no checkbox).
  2. Firebase console → App Check → Apps → your web app → reCAPTCHA Enterprise → paste the key ID.
  3. Set VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=<key ID> in .env.
  4. Firebase console → App Check → APIs → Firebase AI Logic → Enforce.
`);
  process.exit(1);
}
console.log('✓ App Check site key present. Make sure enforcement is ON for Firebase AI Logic.');
