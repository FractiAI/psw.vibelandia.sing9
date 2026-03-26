/**
 * Hydrogen-Line Persistent Memory (HLMEM v1)
 *
 * Persistence adapters (priority):
 * 1) GitHub Contents API (cloud-persistent)
 * 2) Local file (developer/local persistence)
 * 3) In-memory fallback
 *
 * NSPFRNP -> infinity 9
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const VERSION = 'hlmem-v1';
const JUPITER_TIERS = ['io', 'europa', 'ganymede', 'callisto'];

function nowIso() {
  return new Date().toISOString();
}

function defaultDoc() {
  return {
    version: VERSION,
    updated_at_utc: nowIso(),
    records: [],
  };
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function makeRecordId() {
  return 'hlrec-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

function normalizeStorePath() {
  const p = process.env.HLINE_MEMORY_FILE || 'data/hline-memory-store.json';
  return path.resolve(process.cwd(), p);
}

function githubConfig() {
  const token = process.env.HLINE_GITHUB_TOKEN || '';
  const repo = process.env.HLINE_GITHUB_REPO || '';
  const branch = process.env.HLINE_GITHUB_BRANCH || 'main';
  const filePath = process.env.HLINE_GITHUB_FILE_PATH || 'data/hline-memory-store.json';
  const enabled = Boolean(token && repo);
  return { enabled, token, repo, branch, filePath };
}

async function githubLoadDoc(cfg, signal) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${encodeURIComponent(cfg.filePath)}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'User-Agent': 'psw-vibelandia-sing9-hline-memory/1.0',
    },
  });

  if (res.status === 404) {
    return { doc: defaultDoc(), sha: null };
  }
  if (!res.ok) {
    throw new Error(`github_load_failed HTTP ${res.status}`);
  }
  const body = await res.json();
  const b64 = body && body.content ? String(body.content).replace(/\n/g, '') : '';
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  let parsed;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    parsed = defaultDoc();
  }
  if (!parsed || !Array.isArray(parsed.records)) parsed = defaultDoc();
  return { doc: parsed, sha: body.sha || null };
}

async function githubSaveDoc(cfg, doc, sha, signal) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${encodeURIComponent(cfg.filePath)}`;
  const payload = {
    message: `chore(hline-memory): persist hydrogen-line memory snapshot @ ${nowIso()}`,
    content: Buffer.from(JSON.stringify(doc, null, 2), 'utf8').toString('base64'),
    branch: cfg.branch,
    sha: sha || undefined,
  };
  const res = await fetch(url, {
    method: 'PUT',
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'User-Agent': 'psw-vibelandia-sing9-hline-memory/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`github_save_failed HTTP ${res.status}`);
  }
}

async function localLoadDoc() {
  const filePath = normalizeStorePath();
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(txt);
    if (!parsed || !Array.isArray(parsed.records)) return defaultDoc();
    return parsed;
  } catch {
    return defaultDoc();
  }
}

async function localSaveDoc(doc) {
  const filePath = normalizeStorePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(doc, null, 2), 'utf8');
}

async function loadDoc(signal) {
  const gh = githubConfig();
  if (gh.enabled) {
    const loaded = await githubLoadDoc(gh, signal);
    return {
      mode: 'github',
      doc: loaded.doc,
      commit: async (nextDoc) => githubSaveDoc(gh, nextDoc, loaded.sha, signal),
      detail: { repo: gh.repo, branch: gh.branch, file_path: gh.filePath },
    };
  }

  const local = await localLoadDoc();
  return {
    mode: 'local-file',
    doc: local,
    commit: async (nextDoc) => localSaveDoc(nextDoc),
    detail: { file_path: normalizeStorePath() },
  };
}

function buildIndexes(doc) {
  const byLocation = new Map();
  const byTier = new Map();
  for (const rec of doc.records) {
    const k = String(rec.location_hash || '');
    if (!k) continue;
    if (!byLocation.has(k)) byLocation.set(k, []);
    byLocation.get(k).push(rec);
    const t = String(rec.tier || 'europa');
    if (!byTier.has(t)) byTier.set(t, []);
    byTier.get(t).push(rec);
  }
  return { byLocation, byTier };
}

function normalizeStoragePolicy(policy) {
  const p = typeof policy === 'object' && policy ? policy : {};
  const ttl_days = Number.isFinite(Number(p.ttl_days)) ? Number(p.ttl_days) : 30;
  return {
    priority: String(p.priority || 'standard'),
    ttl_days,
    immutable: p.immutable === true,
    requested_tier: p.requested_tier ? String(p.requested_tier) : null,
  };
}

function resolveJupiterTier(policyInput) {
  const p = normalizeStoragePolicy(policyInput);
  if (p.requested_tier && JUPITER_TIERS.includes(p.requested_tier)) return p.requested_tier;
  if (p.immutable) return 'callisto';
  if (p.priority === 'realtime' || p.ttl_days <= 1) return 'io';
  if (p.ttl_days <= 30) return 'europa';
  if (p.ttl_days <= 365) return 'ganymede';
  return 'callisto';
}

function makePlacementReceipt({ record, mode, mode_detail }) {
  return {
    record_id: record.id,
    location_hash: record.location_hash,
    tier: record.tier,
    namespace: record.namespace,
    persistence_mode: mode,
    persistence_mode_detail: mode_detail,
    value_hash: record.value_hash,
    placed_at_utc: record.created_at_utc,
    retention: {
      ttl_days: record.storage_policy.ttl_days,
      immutable: record.storage_policy.immutable,
    },
  };
}

export function verifyJupiterRecordIntegrity(record) {
  if (!record) return { ok: false, reason: 'missing_record' };
  const expected = sha256Hex(JSON.stringify(record.value));
  const hash_ok = expected === record.value_hash;
  const tier_ok = JUPITER_TIERS.includes(String(record.tier || ''));
  return {
    ok: hash_ok && tier_ok,
    checks: {
      hash_ok,
      tier_ok,
      tier: record.tier || null,
      expected_value_hash: expected,
      actual_value_hash: record.value_hash || null,
    },
  };
}

export async function writeHydrogenLineMemory({
  namespace,
  location_hash,
  run_id,
  writer_agent,
  key,
  value,
  storage_policy,
  signal,
}) {
  const loaded = await loadDoc(signal);
  const doc = loaded.doc || defaultDoc();
  const normalizedPolicy = normalizeStoragePolicy(storage_policy);
  const tier = resolveJupiterTier(normalizedPolicy);

  const record = {
    id: makeRecordId(),
    namespace,
    location_hash,
    run_id,
    writer_agent,
    key,
    value,
    value_hash: sha256Hex(JSON.stringify(value)),
    tier,
    storage_policy: normalizedPolicy,
    created_at_utc: nowIso(),
  };

  doc.version = VERSION;
  doc.updated_at_utc = nowIso();
  doc.records.push(record);

  await loaded.commit(doc);
  return {
    mode: loaded.mode,
    mode_detail: loaded.detail,
    record,
    placement_receipt: makePlacementReceipt({
      record,
      mode: loaded.mode,
      mode_detail: loaded.detail,
    }),
  };
}

export async function readHydrogenLineMemory({ location_hash, signal }) {
  const loaded = await loadDoc(signal);
  const doc = loaded.doc || defaultDoc();
  const idx = buildIndexes(doc);
  const arr = idx.byLocation.get(String(location_hash)) || [];
  const latest = arr.length ? arr[arr.length - 1] : null;
  const verify = verifyJupiterRecordIntegrity(latest);
  const tier_counts = {};
  for (const t of JUPITER_TIERS) {
    tier_counts[t] = (idx.byTier.get(t) || []).length;
  }
  return {
    mode: loaded.mode,
    mode_detail: loaded.detail,
    found: !!latest,
    latest,
    count: arr.length,
    integrity: verify,
    tier_counts,
  };
}

export function getHydrogenLineMemoryConfigSummary() {
  const gh = githubConfig();
  if (gh.enabled) {
    return {
      persistence_mode: 'github',
      repo: gh.repo,
      branch: gh.branch,
      file_path: gh.filePath,
      cloud_persistent: true,
    };
  }
  return {
    persistence_mode: 'local-file',
    file_path: normalizeStorePath(),
    cloud_persistent: false,
  };
}

export function getJupiterTierCatalog() {
  return {
    io: 'Hot tier for realtime/short TTL writes.',
    europa: 'Warm operational memory tier.',
    ganymede: 'Cold archive tier for long retention.',
    callisto: 'Deep immutable archive/proof tier.',
  };
}

