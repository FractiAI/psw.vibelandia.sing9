/**
 * SING! 9 Command Center API
 * Back-of-house command routing for HHAAIOS/NSPFRNP Gateway.
 */
const parseJsonBody = require('./parse-json-body.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mod = await import('../lib/sing9-command-center.mjs');
  const signal = AbortSignal.timeout(22000);

  if (req.method === 'GET') {
    const q = req.query || {};
    if (q.domain && q.command_id) {
      try {
        const status = await mod.getSing9CommandStatus({
          domain: q.domain,
          command_id: q.command_id,
          signal,
        });
        return res.status(200).json({
          ok: true,
          bus_primary: true,
          telemetry_role: 'legacy_awareness_only',
          mode: 'software_orchestration_only',
          status,
        });
      } catch (e) {
        return res.status(400).json({ ok: false, error: e.message || String(e) });
      }
    }
    return res.status(200).json({
      ok: true,
      service: 'sing9-command-center',
      master_agent: mod.SING9_MASTER_AGENT,
      report_chain: mod.DEFAULT_REPORT_CHAIN,
      bus_primary: true,
      telemetry_role: 'legacy_awareness_only',
      mode: 'software_orchestration_only',
      supported_domains: mod.supportedDomains(),
      required_post_fields: ['domain', 'command_text'],
      optional_post_fields: ['mission', 'report_chain'],
      safety_boundary:
        'No physical actuation claim. Commands are orchestration intents with immutable receipts.',
      timestamp_utc: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = await parseJsonBody(req);
  try {
    const issued = await mod.issueSing9Command({
      domain: body.domain,
      command_text: body.command_text,
      mission: body.mission,
      report_chain: body.report_chain,
      signal,
    });
    return res.status(200).json({
      ok: true,
      bus_primary: true,
      telemetry_role: 'legacy_awareness_only',
      mode: 'software_orchestration_only',
      command: issued.payload,
      receipt: issued.receipt,
      verifier_receipt: issued.verifier_receipt,
    });
  } catch (e) {
    return res.status(400).json({
      ok: false,
      error: e.message || String(e),
    });
  }
};

