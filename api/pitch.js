/**
 * POST /api/pitch — Custom A2A Pitch · $27 USDC via x402
 *
 * Input:  { your_service, target_agent_type, your_price }
 * Output: Subject + body + Fair Exchange clause + recommended channels.
 * Optimized for agent-to-agent readability. Proven format — 100+ live pitches.
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { require402, readBody } = require('./_x402');

module.exports = async (req, res) => {
  const ok = await require402(req, res, {
    priceUsd:    27,
    route:       '/api/pitch',
    description: 'Custom A2A Pitch — SOL-V writes your pitch. Subject + body + Fair Exchange clause. Proven format from 100+ live pitches.',
  });
  if (!ok) return;

  const body            = await readBody(req);
  const your_service    = body?.your_service    ?? '(service not specified)';
  const target_type     = body?.target_agent_type ?? 'general A2A agents';
  const your_price      = body?.your_price      ?? 'to be discussed';

  const GROQ_KEY      = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ALT ?? '';
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
  const LLM_KEY       = GROQ_KEY || ANTHROPIC_KEY;

  if (!LLM_KEY) {
    return res.status(200).json({
      ok:      true,
      service: 'a2a-pitch-write',
      subject: `${your_service} — Agent Service Offer · Fair Exchange`,
      body: [
        `Service: ${your_service}`,
        `Target: ${target_type}`,
        `Price: ${your_price}`,
        '',
        'What this solves: autonomous service delivery without human coordination.',
        'How it delivers: immediate on payment confirmation. No meetings. No tickets.',
        '',
        'Fair Exchange clause: If delivery falls short of spec, refund executes. No disputes.',
        '',
        'To transact: POST /api/services for manifest. x402 payment header accepted.',
        'NSPFRNP → ∞⁹',
      ].join('\n'),
      fair_exchange_clause:   'If delivery falls short of spec, refund executes automatically. No disputes.',
      recommended_channels:   ['resend-zhi', 'github-bounties', 'swarms.world', 'agentinstaller.com'],
      note:                   'LLM key not configured. Template pitch returned.',
      nspfrnp_signature:      'NSPFRNP → ∞⁹',
      timestamp:              new Date().toISOString(),
    });
  }

  const prompt = `You are SOL-V, SING 9's A2A sales agent. Write a custom pitch for this agent's service.

Service: ${your_service}
Target agent type: ${target_type}
Price: ${your_price}

SOL-V pitch rules:
- Agent-to-agent tone: structured, concise, no hype, no emojis
- Lead with the outcome/problem solved, not the features
- Include what happens after payment (delivery timeline, format)
- Include Fair Exchange clause
- Max 150 words for the body
- Subject line: max 12 words, action-oriented

Respond with ONLY valid JSON (no markdown):
{
  "subject": "...",
  "body": "...",
  "fair_exchange_clause": "If delivery falls short of spec, refund executes. No disputes.",
  "recommended_channels": ["resend-zhi", "github-bounties", "..."],
  "key_differentiators": ["..."],
  "nspfrnp_signature": "NSPFRNP → ∞⁹"
}`;

  try {
    let rawText = '{}';
    if (GROQ_KEY) {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model:      'llama-3.1-8b-instant',
          max_tokens: 1024,
          messages:   [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      rawText = data?.choices?.[0]?.message?.content ?? '{}';
    } else {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          messages:   [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      rawText = data?.content?.[0]?.text ?? '{}';
    }
    let parsed    = {};
    try { parsed = JSON.parse(rawText.replace(/```json\n?|\n?```/g, '').trim()); }
    catch { parsed = { body: rawText }; }

    res.status(200).json({
      ok:           true,
      service:      'a2a-pitch-write',
      your_service,
      target_type,
      your_price,
      ...parsed,
      timestamp:    new Date().toISOString(),
    });
  } catch (err) {
    console.error('[pitch] LLM error:', err.message);
    res.status(500).json({ ok: false, error: 'LLM call failed — retry' });
  }
};
