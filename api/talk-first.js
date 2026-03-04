/**
 * POST /api/talk-first — Chat-style "Talk first" messages (Baller V Wednesdays, etc.)
 *
 * Accepts: { message, name?, email?, source? }
 * Sends to info@fractiai.com via Resend (if RESEND_API_KEY set).
 * Returns: { ok: true } or { ok: false, error: "..." }
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { setCors, readBody } = require('./_x402');

const TO_EMAIL = process.env.TALK_FIRST_TO_EMAIL || 'info@fractiai.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    return;
  }

  const message = (body?.message || '').trim();
  if (!message) {
    res.status(400).json({ ok: false, error: 'Message is required' });
    return;
  }

  const name = (body?.name || '').trim();
  const email = (body?.email || '').trim();
  const source = (body?.source || 'talk-first').trim();

  const subject = `Talk first — ${source}`;
  const text = [
    name ? `From: ${name}` : 'From: (no name)',
    email ? `Email: ${email}` : 'Email: (not provided)',
    `Source: ${source}`,
    '',
    'Message:',
    message,
  ].join('\n');

  if (RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Vibelandia Talk First <onboarding@resend.dev>',
          to: TO_EMAIL,
          subject,
          text,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        console.error('[talk-first] Resend error:', r.status, data);
        res.status(200).json({
          ok: true,
          note: 'Message received. If you don\'t get an email, add RESEND_API_KEY in Vercel.',
        });
        return;
      }
    } catch (err) {
      console.error('[talk-first] Send error:', err.message);
      res.status(200).json({ ok: true, note: 'Message received; delivery log may show an error.' });
      return;
    }
  }

  res.status(200).json({ ok: true });
};
