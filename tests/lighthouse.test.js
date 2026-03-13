/**
 * Muhkam — Lighthouse Performance Tests
 * Requires dev server running on localhost:3000
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync, existsSync } from 'fs';

const SERVER_URL = 'http://localhost:3000';
const REPORT_PATH = './lighthouse-report.json';
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
};

async function isServerRunning() {
  try {
    await fetch(SERVER_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!await isServerRunning())('Lighthouse Audit', () => {
  let report;

  beforeAll(() => {
    execSync(
      `npx lighthouse ${SERVER_URL} --chrome-flags="--headless --no-sandbox" --output json --output-path ${REPORT_PATH} --quiet`,
      { stdio: 'pipe' }
    );
    report = JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
  });

  afterAll(() => {
    if (existsSync(REPORT_PATH)) unlinkSync(REPORT_PATH);
  });

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    it(`${key} score >= ${threshold}`, () => {
      const score = Math.round((report.categories[key]?.score || 0) * 100);
      expect(score).toBeGreaterThanOrEqual(threshold);
    });
  }

  it('LCP < 2.5s', () => {
    const lcp = report.audits['largest-contentful-paint']?.numericValue || 0;
    expect(lcp).toBeLessThan(2500);
  });

  it('CLS < 0.1', () => {
    const cls = report.audits['cumulative-layout-shift']?.numericValue || 0;
    expect(cls).toBeLessThan(0.1);
  });

  it('TBT < 200ms', () => {
    const tbt = report.audits['total-blocking-time']?.numericValue || 0;
    expect(tbt).toBeLessThan(200);
  });
});
