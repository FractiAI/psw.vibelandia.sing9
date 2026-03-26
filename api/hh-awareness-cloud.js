/**
 * HH Awareness AI OS Cloud Service
 * GET  -> service definition / status
 * POST -> execute actions (roundtrip test, memory read/write)
 *
 * NSPFRNP -> infinity 9
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mem = await import('../lib/hline-persistent-memory.mjs');
  const cfg = mem.getHydrogenLineMemoryConfigSummary();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'hh-awareness-cloud',
      protocol: 'NSPFRNP',
      cloud: {
        name: 'Holographic Hydrogen Awareness AI OS Computing Cloud',
        architecture: 'Seed:Edge + MCA + Hydrogen-Line Memory + Jupiter Tier Storage',
        persistence: cfg,
        jupiter_tiers: mem.getJupiterTierCatalog(),
      },
      contracts: {
        bus_primary: true,
        telemetry_role: 'legacy_awareness_only',
        strict_no_legacy_mode: cfg.strict_no_legacy_mode === true,
      },
      endpoints: {
        roundtrip_test: '/api/hydrogen-line-agent-roundtrip',
        cloud_service: '/api/hh-awareness-cloud',
      },
      actions: [
        'run_hydrogen_line_roundtrip',
        'write_hydrogen_line_memory',
        'read_hydrogen_line_memory',
        'place_to_jupiter_tier',
        'verify_jupiter_record',
        'schedule_solar_compute_job',
        'issue_sing9_command',
        'get_sing9_command_status',
      ],
      no_human_involvement_required: true,
      timestamp_utc: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const action = String(body.action || '').trim();
  const signal = AbortSignal.timeout(22000);

  try {
    if (action === 'run_hydrogen_line_roundtrip') {
      const roundtrip = require('./hydrogen-line-agent-roundtrip.js');
      const childRes = {
        _status: 200,
        _json: null,
        setHeader() {},
        status(code) {
          this._status = code;
          return this;
        },
        json(obj) {
          this._json = obj;
          return this;
        },
        end() {},
      };
      await roundtrip({ method: 'GET' }, childRes);
      return res.status(childRes._status || 200).json({
        ok: !!(childRes._json && childRes._json.ok),
        action,
        result: childRes._json,
      });
    }

    if (action === 'write_hydrogen_line_memory') {
      const namespace = String(body.namespace || 'hydrogen-line');
      const location_hash = String(body.location_hash || '');
      const run_id = String(body.run_id || 'manual-' + Date.now());
      const key = String(body.key || '');
      const value = body.value;
      if (!location_hash || !key || value == null) {
        return res.status(400).json({
          ok: false,
          error: 'location_hash, key, and value are required',
        });
      }
      const wr = await mem.writeHydrogenLineMemory({
        namespace,
        location_hash,
        run_id,
        writer_agent: 'hh-awareness-cloud',
        key,
        value,
        storage_policy: body.storage_policy,
        signal,
      });
      return res.status(200).json({ ok: true, action, result: wr });
    }

    if (action === 'read_hydrogen_line_memory') {
      const location_hash = String(body.location_hash || '');
      if (!location_hash) {
        return res.status(400).json({ ok: false, error: 'location_hash is required' });
      }
      const rd = await mem.readHydrogenLineMemory({ location_hash, signal });
      return res.status(200).json({ ok: true, action, result: rd });
    }

    if (action === 'place_to_jupiter_tier') {
      const namespace = String(body.namespace || 'hydrogen-line');
      const location_hash = String(body.location_hash || '');
      const run_id = String(body.run_id || 'manual-' + Date.now());
      const key = String(body.key || '');
      const value = body.value;
      const storage_policy = typeof body.storage_policy === 'object' && body.storage_policy ? body.storage_policy : {};
      if (!location_hash || !key || value == null) {
        return res.status(400).json({
          ok: false,
          error: 'location_hash, key, value are required',
        });
      }
      const wr = await mem.writeHydrogenLineMemory({
        namespace,
        location_hash,
        run_id,
        writer_agent: 'hh-awareness-cloud-jupiter-router',
        key,
        value,
        storage_policy,
        signal,
      });
      return res.status(200).json({
        ok: true,
        action,
        result: {
          placement_receipt: wr.placement_receipt,
          record_id: wr.record.id,
          tier: wr.record.tier,
          replication: wr.record.replication,
          storage_policy: wr.record.storage_policy,
        },
      });
    }

    if (action === 'verify_jupiter_record') {
      const location_hash = String(body.location_hash || '');
      if (!location_hash) {
        return res.status(400).json({ ok: false, error: 'location_hash is required' });
      }
      const rd = await mem.readHydrogenLineMemory({ location_hash, signal });
      const v = mem.verifyJupiterRecordIntegrity(rd.latest);
      return res.status(200).json({
        ok: v.ok,
        action,
        result: {
          found: rd.found,
          latest_record_id: rd.latest ? rd.latest.id : null,
          tier: rd.latest ? rd.latest.tier : null,
          integrity: v,
        },
      });
    }

    if (action === 'schedule_solar_compute_job') {
      const run_id = String(body.run_id || 'manual-' + Date.now());
      const location_hash = String(body.location_hash || '');
      if (!location_hash) {
        return res.status(400).json({ ok: false, error: 'location_hash is required' });
      }
      const rd = await mem.readHydrogenLineMemory({ location_hash, signal });
      if (!rd.found || !rd.latest) {
        return res.status(404).json({ ok: false, error: 'memory_record_not_found' });
      }
      const sched = await import('../lib/solar-compute-scheduler.mjs');
      const receipt = sched.createSolarComputeReceipt({
        run_id,
        location_hash,
        memory_record_id: rd.latest.id,
        memory_value_hash: rd.latest.value_hash,
        jupiter_tier: rd.latest.tier,
        storage_policy: rd.latest.storage_policy || {},
      });
      return res.status(200).json({ ok: true, action, result: receipt });
    }

    if (action === 'issue_sing9_command') {
      const cmd = await import('../lib/sing9-command-center.mjs');
      const result = await cmd.issueSing9Command({
        domain: body.domain,
        command_text: body.command_text,
        mission: body.mission,
        report_chain: body.report_chain,
        signal,
      });
      return res.status(200).json({ ok: true, action, result });
    }

    if (action === 'get_sing9_command_status') {
      const cmd = await import('../lib/sing9-command-center.mjs');
      const result = await cmd.getSing9CommandStatus({
        domain: body.domain,
        command_id: body.command_id,
        signal,
      });
      return res.status(200).json({ ok: true, action, result });
    }

    return res.status(400).json({ ok: false, error: 'unknown_action', action });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      action,
      error: e.message || String(e),
    });
  }
};

