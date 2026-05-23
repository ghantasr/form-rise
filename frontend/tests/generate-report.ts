#!/usr/bin/env npx tsx
/**
 * FormRise Launch Readiness Report Generator
 * Run: npx playwright test --reporter=json | npx tsx tests/generate-report.ts
 * Or:  npx playwright test --reporter=json,list 2>&1 | npx tsx tests/generate-report.ts
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = join(__dirname, '..', 'playwright-report', 'results.json');
const REPORT_PATH = join(__dirname, '..', '..', 'LAUNCH-READINESS-REPORT.md');

// ── Run tests and capture JSON output ────────────────────────────────────────

console.log('\n🧪  Running FormRise test suite...\n');
console.log('='.repeat(60));

let jsonOutput = '';
try {
  jsonOutput = execSync(
    'npx playwright test --reporter=json',
    {
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'inherit'],
      timeout: 600_000,
    }
  );
} catch (err: any) {
  // Playwright exits non-zero when tests fail — output is still in stdout
  jsonOutput = err.stdout ?? '';
}

if (!jsonOutput.trim()) {
  console.error('❌  No JSON output from Playwright. Make sure dev server is running.');
  process.exit(1);
}

// ── Parse results ─────────────────────────────────────────────────────────────

interface PWSuite {
  title: string;
  file?: string;
  specs: PWSpec[];
  suites?: PWSuite[];
}

interface PWSpec {
  title: string;
  ok: boolean;
  tests: PWTest[];
}

interface PWTest {
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors?: { message?: string }[];
}

interface PWReport {
  suites: PWSuite[];
  stats: {
    expected: number;
    skipped: number;
    unexpected: number;
    flaky: number;
    duration: number;
  };
}

let report: PWReport;
try {
  report = JSON.parse(jsonOutput);
} catch {
  console.error('❌  Could not parse Playwright JSON output.');
  process.exit(1);
}

// ── Flatten all specs ─────────────────────────────────────────────────────────

interface FlatTest {
  area: string;
  suite: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
}

function flattenSuite(suite: PWSuite, area: string): FlatTest[] {
  const results: FlatTest[] = [];
  const suiteName = suite.title || area;

  for (const spec of suite.specs ?? []) {
    const test = spec.tests?.[0];
    if (!test) continue;
    results.push({
      area,
      suite: suiteName,
      title: spec.title,
      status: test.status,
      duration: test.duration,
      error: test.errors?.[0]?.message?.split('\n')[0],
    });
  }

  for (const child of suite.suites ?? []) {
    results.push(...flattenSuite(child, area));
  }

  return results;
}

// Map file names to product areas
const AREA_MAP: Record<string, string> = {
  'auth.spec.ts':              '🔐 Authentication',
  'auth-edge.spec.ts':         '🔐 Authentication — Edge Cases',
  'dashboard.spec.ts':         '📋 Dashboard',
  'dashboard-edge.spec.ts':    '📋 Dashboard — Edge Cases',
  'form-builder.spec.ts':      '🔧 Form Builder',
  'form-builder-edge.spec.ts': '🔧 Form Builder — Edge Cases',
  'form-fill.spec.ts':         '📝 Form Fill',
  'form-fill-edge.spec.ts':    '📝 Form Fill — Edge Cases',
  'quiz-mode.spec.ts':         '🏆 Quiz Mode',
  'quiz-edge.spec.ts':         '🏆 Quiz Mode — Edge Cases',
  'assignments.spec.ts':       '📌 Assignments',
  'assignments-edge.spec.ts':  '📌 Assignments — Edge Cases',
  'org.spec.ts':               '🏢 Organisation',
  'org-edge.spec.ts':          '🏢 Organisation — Edge Cases',
  'org-everyone.spec.ts':      '👥 Org — Everyone Group',
  'responses.spec.ts':         '📊 Responses',
  'responses-edge.spec.ts':    '📊 Responses — Edge Cases',
  'qr.spec.ts':                '📷 QR Codes',
  'templates.spec.ts':         '📄 Templates',
  'templates-edge.spec.ts':    '📄 Templates — Edge Cases',
  'settings.spec.ts':          '⚙️  Settings',
  'settings-edge.spec.ts':     '⚙️  Settings — Edge Cases',
  'security.spec.ts':          '🛡️  Security',
  'security-edge.spec.ts':     '🛡️  Security — Edge Cases',
  'privacy.spec.ts':           '🔏 Privacy Policy',
};

const allTests: FlatTest[] = [];

for (const topSuite of report.suites) {
  const fileName = topSuite.file?.split('/').pop() ?? topSuite.title;
  const area = AREA_MAP[fileName] ?? `📁 ${fileName}`;
  allTests.push(...flattenSuite(topSuite, area));
}

// ── Compute stats ─────────────────────────────────────────────────────────────

const passed  = allTests.filter(t => t.status === 'passed');
const failed  = allTests.filter(t => t.status === 'failed' || t.status === 'timedOut');
const skipped = allTests.filter(t => t.status === 'skipped');

const total       = allTests.length;
const passRate    = total > 0 ? Math.round((passed.length / total) * 100) : 0;
const durationSec = Math.round((report.stats?.duration ?? 0) / 1000);

const isReady = failed.length === 0 && total > 0;

// Group by area
const byArea = new Map<string, FlatTest[]>();
for (const t of allTests) {
  if (!byArea.has(t.area)) byArea.set(t.area, []);
  byArea.get(t.area)!.push(t);
}

// ── Build markdown ────────────────────────────────────────────────────────────

const now = new Date().toLocaleString('en-GB', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});

const verdictBanner = isReady
  ? '## ✅ VERDICT: READY TO LAUNCH'
  : `## ❌ VERDICT: NOT READY — ${failed.length} test${failed.length !== 1 ? 's' : ''} failing`;

const verdictNote = isReady
  ? '_All test cases passed. The product meets launch criteria._'
  : '_Fix the failing tests below before deploying to production._';

let md = `# FormRise — Launch Readiness Report

**Generated:** ${now} IST
**Test suite:** Playwright e2e (Chromium)
**Environment:** \`http://localhost:5173\` → \`http://localhost:5001/api\`

---

${verdictBanner}

${verdictNote}

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | **${total}** |
| ✅ Passed | **${passed.length}** |
| ❌ Failed | **${failed.length}** |
| ⏭️ Skipped | **${skipped.length}** |
| Pass rate | **${passRate}%** |
| Duration | **${durationSec}s** |

---

## Coverage by area

`;

for (const [area, tests] of byArea) {
  const areaPass   = tests.filter(t => t.status === 'passed').length;
  const areaFail   = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
  const areaSkip   = tests.filter(t => t.status === 'skipped').length;
  const areaStatus = areaFail > 0 ? '❌' : '✅';

  md += `### ${areaStatus} ${area}\n\n`;
  md += `| Status | Test case |\n|--------|-----------|\n`;

  for (const t of tests) {
    const icon = t.status === 'passed' ? '✅'
               : t.status === 'skipped' ? '⏭️'
               : '❌';
    md += `| ${icon} | ${t.title} |\n`;
  }

  md += `\n_${areaPass} passed · ${areaFail} failed · ${areaSkip} skipped_\n\n`;
}

// ── Failed tests detail ───────────────────────────────────────────────────────

if (failed.length > 0) {
  md += `---\n\n## ❌ Failing tests — action required\n\n`;
  for (const t of failed) {
    md += `### ${t.area} › ${t.title}\n\n`;
    if (t.error) {
      md += `\`\`\`\n${t.error}\n\`\`\`\n\n`;
    }
  }
}

// ── Launch checklist ──────────────────────────────────────────────────────────

md += `---

## Launch checklist

${isReady ? '✅' : '☐'} All e2e tests pass
☐ \`.env\` secrets set on production server (JWT_SECRET, DB_PASSWORD, BREVO credentials)
☐ DNS A record for \`formrise.fyi\` pointing to \`95.216.199.142\`
☐ Google OAuth origins include \`https://formrise.fyi\`
☐ \`VITE_API_URL\` in \`frontend/.env.production\` points to correct domain
☐ \`App__BaseUrl\` env var set to \`https://formrise.fyi\` on server
☐ Caddy Caddyfile updated with correct domain (not \`:80\`)
☐ Privacy Policy contact email updated in \`Privacy.tsx\`
☐ At least one real user tested the full sign-up → form → response flow manually

---

_Report generated by \`tests/generate-report.ts\` · FormRise v${new Date().getFullYear()}_
`;

// ── Write report ──────────────────────────────────────────────────────────────

writeFileSync(REPORT_PATH, md, 'utf8');

// ── Console summary ───────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log(`\n${verdictBanner.replace('## ', '')}\n`);
console.log(`  Total:   ${total} tests`);
console.log(`  Passed:  ${passed.length} ✅`);
console.log(`  Failed:  ${failed.length} ${failed.length > 0 ? '❌' : ''}`);
console.log(`  Skipped: ${skipped.length}`);
console.log(`  Pass rate: ${passRate}%`);
console.log(`  Duration:  ${durationSec}s`);
console.log(`\n  Report written to: LAUNCH-READINESS-REPORT.md`);

if (failed.length > 0) {
  console.log('\n  Failing tests:');
  for (const t of failed) {
    console.log(`    ❌  [${t.area}] ${t.title}`);
    if (t.error) console.log(`        ${t.error.slice(0, 100)}`);
  }
}

console.log('\n' + '='.repeat(60) + '\n');

process.exit(failed.length > 0 ? 1 : 0);
