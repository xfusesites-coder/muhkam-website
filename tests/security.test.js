/**
 * Muhkam — Security Headers Validation
 * Requires dev server running on localhost:3000
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = 'http://localhost:3000';

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

const RECOMMENDED_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'permissions-policy',
];

async function isServerRunning() {
  try {
    await fetch(SERVER_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!await isServerRunning())('Security Headers', () => {
  let headers;

  beforeAll(async () => {
    const res = await fetch(SERVER_URL);
    headers = Object.fromEntries(res.headers.entries());
  });

  for (const [header, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
    it(`has required header: ${header}`, () => {
      expect(headers[header]).toBe(expectedValue);
    });
  }

  for (const header of RECOMMENDED_HEADERS) {
    it(`has recommended header: ${header}`, () => {
      expect(headers[header]).toBeDefined();
    });
  }

  it('does not expose X-Powered-By', () => {
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
