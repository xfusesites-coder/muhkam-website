/**
 * Muhkam — Accessibility Tests (axe-core)
 * Requires: npm i -D @axe-core/cli
 * Requires dev server running on localhost:3000
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const SERVER_URL = 'http://localhost:3000';

async function isServerRunning() {
  try {
    await fetch(SERVER_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!await isServerRunning())('Accessibility (axe-core)', () => {
  it('has no accessibility violations', () => {
    const output = execSync(`npx axe ${SERVER_URL} --exit`, { encoding: 'utf-8' });
    expect(output).toContain('0 violations found');
  });
});
