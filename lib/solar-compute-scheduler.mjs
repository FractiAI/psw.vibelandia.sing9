/**
 * Solar compute scheduler receipt generator.
 * Links compute execution receipts to memory receipts/records.
 */
import crypto from 'node:crypto';

function nowIso() {
  return new Date().toISOString();
}

function classifyJob(priority, ttlDays) {
  if (priority === 'realtime' || ttlDays <= 1) return 'realtime';
  if (ttlDays <= 30) return 'control';
  return 'batch';
}

export function createSolarComputeReceipt({
  run_id,
  location_hash,
  memory_record_id,
  memory_value_hash,
  jupiter_tier,
  storage_policy,
}) {
  const ttl = Number(storage_policy?.ttl_days ?? 30);
  const priority = String(storage_policy?.priority || 'standard');
  const job_class = classifyJob(priority, ttl);
  const scheduler_id = 'sun-sched-' + Date.now();
  const payload = {
    run_id,
    location_hash,
    memory_record_id,
    memory_value_hash,
    jupiter_tier,
    job_class,
    priority,
    ttl_days: ttl,
    scheduler_id,
    scheduled_at_utc: nowIso(),
  };
  const payload_sha256 = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return {
    scheduler: 'sun-compute',
    mode: 'receipt-only',
    payload_sha256,
    ...payload,
    linked_memory_receipt: {
      record_id: memory_record_id,
      value_hash: memory_value_hash,
      tier: jupiter_tier,
    },
  };
}

