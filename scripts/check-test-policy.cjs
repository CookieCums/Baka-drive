#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'app');
const manifest = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

check(manifest.scripts?.test === 'playwright test', 'npm test must run the Playwright E2E suite.');
check(manifest.scripts?.['test:e2e'] === 'playwright test', 'test:e2e must remain an alias of the E2E suite.');
check(fs.existsSync(path.join(appRoot, 'playwright.config.ts')), 'Playwright configuration is missing.');
check(fs.existsSync(path.join(appRoot, 'tests', 'e2e')), 'E2E journeys are missing.');
check(!fs.existsSync(path.join(root, 'supporter-service')), 'The retired payment Worker project must not exist.');
for (const dep of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
  if (/^(vitest$|@vitest\/|@testing-library\/|jsdom$)/.test(dep)) errors.push('Unit-only dependency remains: ' + dep);
}
for (const file of [
  'app/tests/e2e/sponsor-placement.spec.ts',
  'app/tests/e2e/supporter-lifetime.spec.ts',
  'app/tests/e2e/update-recovery.spec.ts',
  'app/tests/visual/supporter-presentation.spec.ts',
]) {
  check(!fs.existsSync(path.join(root, file)), 'Obsolete monetization/updater test remains: ' + file);
}
if (errors.length) {
  console.error('[test-policy]\n' + errors.map(error => '- ' + error).join('\n'));
  process.exit(1);
}
console.log('[test-policy] E2E entrypoints and retired-feature test removal passed.');
