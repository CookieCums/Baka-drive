#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'app');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function json(file) { return JSON.parse(read(file)); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(path.relative(root, full));
    return entry.isFile() ? [full] : [];
  });
}

const config = json('app/src-tauri/tauri.conf.json');
const packageJson = json('app/package.json');
const cargo = read('app/src-tauri/Cargo.toml');
const desktop = json('app/src-tauri/capabilities/default.json');
const mobile = json('app/src-tauri/capabilities/mobile.json');

assert(config.productName === 'Baka Drive', 'Tauri productName must be Baka Drive.');
assert(config.identifier === 'com.bakadrive.app', 'Tauri identifier must be com.bakadrive.app.');
assert(packageJson.name === 'baka-drive', 'npm package name must be baka-drive.');
assert(packageJson.version === config.version, 'npm and Tauri versions must match.');
assert(/^name\s*=\s*"baka-drive"$/m.test(cargo), 'Rust package must be named baka-drive.');
assert(config.bundle?.android?.minSdkVersion >= 24, 'Android minSdkVersion must be >= 24.');
assert(!config.plugins?.updater, 'No updater plugin may be configured.');
assert(!Object.keys(config.bundle || {}).some(key => /updater/i.test(key)), 'Updater bundle generation must stay disabled.');
assert(!packageJson.dependencies?.['@tauri-apps/plugin-updater'] && !packageJson.devDependencies?.['@tauri-apps/plugin-updater'], 'Updater npm plugin must be absent.');
assert(!cargo.includes('tauri-plugin-updater'), 'Updater Rust plugin must be absent.');
assert(!desktop.permissions.includes('updater:default') && !mobile.permissions.includes('updater:default'), 'Updater capability must be absent.');
assert(!/frame-src[^;]*https:/i.test(config.app.security.csp), 'WebView frames must not allow arbitrary external HTTPS content.');
const csp = new Map(config.app.security.csp.split(';').map(value => value.trim()).filter(Boolean).map(value => {
  const parts = value.split(/\s+/); return [parts[0], parts.slice(1)];
}));
assert((csp.get('script-src') || []).includes("'self'"), 'CSP must allow self-hosted scripts.');
assert(!(csp.get('script-src') || []).some(value => ["'unsafe-eval'", "'unsafe-inline'", '*'].includes(value)), 'CSP must disallow inline/eval/wildcard scripts.');
for (const [name, expected] of [['object-src', "'none'"], ['base-uri', "'self'"], ['form-action', "'self'"]]) {
  const values = csp.get(name) || [];
  assert(values.length === 1 && values[0] === expected, 'CSP ' + name + ' must be restricted to ' + expected + '.');
}
assert(mobile.platforms?.length === 1 && mobile.platforms[0] === 'android', 'Mobile permissions must only target Android.');
assert(['linux', 'macOS', 'windows'].every(value => desktop.platforms.includes(value)), 'Desktop permissions must target desktop OSes.');

const forbiddenPatterns = [
  /https?:\/\/[^\s"'<>]*(?:effectivecpmnetwork\.com|highperformanceformat\.com)/i,
  /https?:\/\/telegram-drive\.com\/updates/i,
  /github\.com\/caamer20\/Telegram-Drive\/releases/i,
  /TELEGRAM_DRIVE_(?:SUPPORTER_SERVICE_URL|SUPPORTER_PUBLIC_KEY|CRASH_REPORT_ENDPOINT)/i,
  /(?:PAYPAL_CLIENT_SECRET|CLOUDFLARE_API_TOKEN|R2_SECRET_ACCESS_KEY)/i,
  /\b(?:tauri-plugin-updater|tauri_plugin_updater|updater:default)\b/i,
];
const inspectDirs = ['app/src', 'app/src-tauri/src', '.github/workflows', 'app/scripts', 'scripts'];
const files = inspectDirs.flatMap(walk).filter(file => /\.(?:ts|tsx|rs|js|cjs|mjs|sh|ps1|yml|yaml|json|jsonc|toml|html|css)$/.test(file) && !file.includes(path.sep + 'node_modules' + path.sep) && path.resolve(file) !== path.join(root, 'scripts', 'check-app-security.cjs'));
for (const file of files) {
  const body = fs.readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(body), 'Forbidden ad/payment/updater endpoint or credential setting in ' + path.relative(root, file) + ' (pattern ' + pattern + ').');
  }
}

const workflowDir = path.join(root, '.github', 'workflows');
const workflowFiles = fs.existsSync(workflowDir) ? fs.readdirSync(workflowDir).filter(file => /\.ya?ml$/i.test(file)) : [];
assert(workflowFiles.length === 1 && workflowFiles[0] === 'ci.yml', 'Only the CI-only workflow should remain.');
const workflow = fs.readFileSync(path.join(workflowDir, 'ci.yml'), 'utf8');
for (const forbidden of [/contents:\s*write/i, /pages:\s*write/i, /id-token:\s*write/i, /wrangler\s+deploy/i, /gh\s+release\s+(?:create|upload|edit)/i, /tauri-apps\/tauri-action/i, /CLOUDFLARE_API_TOKEN|PAYPAL_CLIENT_SECRET|TAURI_SIGNING_PRIVATE_KEY/i]) {
  assert(!forbidden.test(workflow), 'CI workflow contains a publishing/deployment or secret-sensitive operation: ' + forbidden + '.');
}
const actionRefs = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)\s*(?:#.*)?$/gm)].map(match => match[1]);
assert(actionRefs.length > 0, 'CI must use reviewed actions.');
for (const ref of actionRefs) {
  const at = ref.lastIndexOf('@');
  assert(at > 0 && /^[0-9a-f]{40}$/i.test(ref.slice(at + 1)), 'GitHub Action must be pinned to a full commit SHA: ' + ref + '.');
}

const obviousSecrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];
for (const file of ['README.md', 'PRIVACY.md', 'SECURITY.md', 'CHANGES.md', 'app/package.json', 'app/src-tauri/tauri.conf.json', 'app/src-tauri/capabilities/default.json', 'app/src-tauri/capabilities/mobile.json']) {
  const body = read(file);
  for (const pattern of obviousSecrets) assert(!pattern.test(body), 'Possible credential material found in ' + file + '.');
}

assert(fs.existsSync(path.join(appRoot, 'src-tauri', 'api', 'openapi-v1.json')), 'The local REST API contract is missing.');
assert(!fs.existsSync(path.join(root, 'supporter-service')), 'Retired payment/supporter service directory must not exist.');
console.log('[app-security] Product identity, Android floor, CSP, capability split, no-ads/no-payment/no-updater policy, CI-only permissions, action pins and secret checks passed.');
