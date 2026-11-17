import type { Engine } from '../types';

export const ENGINE_LABEL: Record<Engine, { label: string; where: 'device' | 'cloud' | 'none' }> = {
  'gemini-nano': { label: 'Gemini Nano · on-device', where: 'device' },
  'firebase-on-device': { label: 'Firebase AI Logic · on-device', where: 'device' },
  'firebase-cloud': { label: 'Firebase AI Logic · cloud', where: 'cloud' },
  'gemini-api': { label: 'Gemini API · cloud', where: 'cloud' },
  heuristic: { label: 'Heuristic · no model', where: 'none' },
  'demo-cache': { label: 'Demo cache · offline', where: 'none' },
};

export function EngineBadge({ engine }: { engine: Engine }) {
  const e = ENGINE_LABEL[engine];
  return (
    <span className={`engine engine-${e.where}`}>
      <span className="dot" />
      {e.label}
    </span>
  );
}
