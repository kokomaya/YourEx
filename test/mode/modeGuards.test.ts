import { describe, expect, it } from 'vitest';
import { computeAllowDeveloperMode } from '../../src/mode/modeGuards';

const EXTENSION_MODE_PRODUCTION = 1;
const EXTENSION_MODE_DEVELOPMENT = 2;
const EXTENSION_MODE_TEST = 3;

describe('computeAllowDeveloperMode', () => {
  it('always disables developer mode in production', () => {
    expect(computeAllowDeveloperMode(true, EXTENSION_MODE_PRODUCTION)).toBe(false);
    expect(computeAllowDeveloperMode(false, EXTENSION_MODE_PRODUCTION)).toBe(false);
  });

  it('respects configuration in development mode', () => {
    expect(computeAllowDeveloperMode(true, EXTENSION_MODE_DEVELOPMENT)).toBe(true);
    expect(computeAllowDeveloperMode(false, EXTENSION_MODE_DEVELOPMENT)).toBe(false);
  });

  it('respects configuration in test mode', () => {
    expect(computeAllowDeveloperMode(true, EXTENSION_MODE_TEST)).toBe(true);
    expect(computeAllowDeveloperMode(false, EXTENSION_MODE_TEST)).toBe(false);
  });
});
