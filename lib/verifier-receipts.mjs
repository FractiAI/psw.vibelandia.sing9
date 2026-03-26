/**
 * Verifier receipt signing with rotating Ed25519 keypairs.
 *
 * Keyring persistence:
 * - data/verifier-keyring.json (default)
 * - override via VERIFIER_KEYRING_FILE
 *
 * Rotation:
 * - default 30 days
 * - override via VERIFIER_KEY_ROTATE_DAYS
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function nowIso() {
  return new Date().toISOString();
}

function keyringPath() {
  return path.resolve(process.cwd(), process.env.VERIFIER_KEYRING_FILE || 'data/verifier-keyring.json');
}

function rotateDays() {
  const n = Number(process.env.VERIFIER_KEY_ROTATE_DAYS || 30);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

async function readKeyring() {
  const p = keyringPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    const k = JSON.parse(raw);
    if (!k || !Array.isArray(k.keys) || !k.active_kid) throw new Error('invalid');
    return k;
  } catch {
    return null;
  }
}

async function writeKeyring(keyring) {
  const p = keyringPath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(keyring, null, 2), 'utf8');
}

function genKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    kid: 'vk-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
    created_at_utc: nowIso(),
    public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    private_key_pem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

function needsRotation(activeKey) {
  if (!activeKey || !activeKey.created_at_utc) return true;
  const ageMs = Date.now() - new Date(activeKey.created_at_utc).getTime();
  return ageMs > rotateDays() * 24 * 60 * 60 * 1000;
}

async function ensureKeyring() {
  let kr = await readKeyring();
  if (!kr) {
    const k = genKeypair();
    kr = {
      version: 'verifier-keyring-v1',
      active_kid: k.kid,
      rotated_at_utc: nowIso(),
      keys: [k],
    };
    await writeKeyring(kr);
    return kr;
  }

  const active = kr.keys.find((k) => k.kid === kr.active_kid);
  if (needsRotation(active)) {
    const next = genKeypair();
    kr.active_kid = next.kid;
    kr.rotated_at_utc = nowIso();
    kr.keys.push(next);
    // keep short history
    if (kr.keys.length > 5) kr.keys = kr.keys.slice(kr.keys.length - 5);
    await writeKeyring(kr);
  }
  return kr;
}

export async function signVerifierReceipt(payload) {
  const keyring = await ensureKeyring();
  const active = keyring.keys.find((k) => k.kid === keyring.active_kid);
  const serialized = JSON.stringify(payload);
  const signature = crypto.sign(null, Buffer.from(serialized), active.private_key_pem).toString('base64');
  return {
    alg: 'ed25519',
    kid: active.kid,
    signed_at_utc: nowIso(),
    payload_sha256: crypto.createHash('sha256').update(serialized).digest('hex'),
    signature_b64: signature,
    public_key_pem: active.public_key_pem,
    key_rotation: {
      active_kid: keyring.active_kid,
      key_count: keyring.keys.length,
      rotate_days: rotateDays(),
      rotated_at_utc: keyring.rotated_at_utc || null,
    },
  };
}

