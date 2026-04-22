export const RUN_MODES = ['user', 'developer'] as const;

export type RunMode = typeof RUN_MODES[number];

export function isRunMode(value: unknown): value is RunMode {
  return typeof value === 'string' && (RUN_MODES as readonly string[]).includes(value);
}

export function parseRunMode(value: unknown, fallback: RunMode = 'user'): RunMode {
  return isRunMode(value) ? value : fallback;
}

export function getModeLabel(mode: RunMode): string {
  return mode === 'developer' ? 'Developer Mode' : 'User Mode';
}
