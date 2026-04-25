// Round-trip smoke test for the portal launch protocol.
//
// Mirrors the portal's `src/utils/appendSessionToUrl.ts` exactly:
//   - AES-GCM-256, 12-byte IV prepended to ciphertext, base64url output
//   - Key from VITE_LAUNCH_AES_KEY (64-char hex OR 32-byte base64)
//   - Dev fallback: SHA-256("aa2000-portal-launch-dev-v1")
//
// Encrypts a sample sessionToken and accountId, then decrypts them with the
// same recipe the KPI app uses in src/utils/portalSession.ts. Also runs
// tamper + wrong-key tests.
//
// Run: node scripts/verify-portal-session.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

let aesKeyEnv = process.env.VITE_LAUNCH_AES_KEY;
if (!aesKeyEnv) {
  try {
    const env = readFileSync(envPath, 'utf8');
    const m = env.match(/^VITE_LAUNCH_AES_KEY\s*=\s*(.+)\s*$/m);
    if (m) aesKeyEnv = m[1].trim();
  } catch {
    // ignore
  }
}

const LAUNCH_DEV_KEY_DERIVATION_STRING = 'aa2000-portal-launch-dev-v1';
const AES_IV_LEN = 12;
const AES_KEY_LEN = 32;

function parseAesKeyMaterial(raw) {
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const out = new Uint8Array(AES_KEY_LEN);
    for (let i = 0; i < AES_KEY_LEN; i++) out[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== AES_KEY_LEN) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function resolveKeyMaterial(raw) {
  const fromEnv = parseAesKeyMaterial(raw);
  if (fromEnv) return { material: fromEnv, source: 'env' };
  // Dev fallback (no env key set)
  const enc = new TextEncoder().encode(LAUNCH_DEV_KEY_DERIVATION_STRING);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return { material: new Uint8Array(digest), source: 'dev-fallback' };
}

async function importKey(material) {
  return crypto.subtle.importKey(
    'raw',
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToB64url(bytes) {
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return new Uint8Array(Buffer.from(b64 + pad, 'base64'));
}

async function encryptValue(plain, key) {
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LEN));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bytesToB64url(combined);
}

async function decryptValue(token, key) {
  const raw = b64urlToBytes(token);
  if (raw.length < AES_IV_LEN + 16) throw new Error('token too short');
  const iv = raw.slice(0, AES_IV_LEN);
  const data = raw.slice(AES_IV_LEN);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(plain);
}

const { material, source } = await resolveKeyMaterial(aesKeyEnv);
console.log(`Using key from: ${source}`);
const key = await importKey(material);

let allPass = true;
const samples = [
  { sessionToken: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', accountId: '42' },
  { sessionToken: 'short-session', accountId: '1' },
  { sessionToken: 'long-session-' + 'x'.repeat(120), accountId: '987654' },
];

for (const { sessionToken, accountId } of samples) {
  const launchTok = await encryptValue(sessionToken, key);
  const actorTok = await encryptValue(accountId, key);
  const sBack = await decryptValue(launchTok, key);
  const aBack = await decryptValue(actorTok, key);
  const ok = sBack === sessionToken && aBack === accountId;
  console.log(ok ? '[PASS]' : '[FAIL]', `round-trip session=${sessionToken.slice(0, 12)}... acc=${accountId}`);
  console.log('  __launch =', launchTok);
  console.log('  __actor  =', actorTok);
  if (!ok) {
    allPass = false;
    console.log('  expected', { sessionToken, accountId }, 'got', { sBack, aBack });
  }
}

// Tamper test
{
  const tok = await encryptValue('tamper-target', key);
  const bytes = b64urlToBytes(tok);
  bytes[bytes.length - 1] ^= 0x01;
  let rejected = false;
  try { await decryptValue(bytesToB64url(bytes), key); } catch { rejected = true; }
  console.log(rejected ? '[PASS]' : '[FAIL]', 'tampered ciphertext rejected');
  if (!rejected) allPass = false;
}

// Wrong-key test
{
  const otherMaterial = parseAesKeyMaterial('00'.repeat(32));
  const otherKey = await importKey(otherMaterial);
  const tok = await encryptValue('wrong-key-target', key);
  let rejected = false;
  try { await decryptValue(tok, otherKey); } catch { rejected = true; }
  console.log(rejected ? '[PASS]' : '[FAIL]', 'wrong-key rejected');
  if (!rejected) allPass = false;
}

// Build a sample launch URL the way the portal would:
const sampleSession = 'demo-session-token-abc123';
const sampleAcc = '7';
const launchTok = await encryptValue(sampleSession, key);
const actorTok = await encryptValue(sampleAcc, key);
console.log('\nSample launch URL the portal would emit:');
console.log(`  /?__launch=${encodeURIComponent(launchTok)}&__actor=${encodeURIComponent(actorTok)}`);

if (!allPass) {
  console.error('\nOne or more checks failed.');
  process.exit(1);
}
console.log('\nAll round-trip checks passed.');
