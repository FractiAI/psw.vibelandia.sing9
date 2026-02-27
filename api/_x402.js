/**
 * api/_x402.js — Shared x402 payment utilities for SING 9 Vercel functions
 *
 * Implements the Coinbase x402 protocol (https://x402.org) using pure Node.js
 * fetch (available in Node 18+ Vercel functions). No npm deps required.
 *
 * Protocol:
 *   1. No X-PAYMENT header → return 402 with payment requirements JSON
 *   2. X-PAYMENT present → verify with Coinbase facilitator
 *   3. Verification OK → settle, return 200 + service response
 *
 * References:
 *   https://docs.x402.org/getting-started/quickstart-for-sellers
 *   https://github.com/coinbase/x402
 *
 * NSPFRNP → ∞⁹
 */

'use strict';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL
  ?? 'https://x402.org/facilitator';

// Receiving wallet (Base EVM)
const EVM_ADDRESS = process.env.WALLET_USDC_BASE
  ?? '0x3563388d0e1c2d66a004e5e57717dc6d7e568be3';

// USDC contract addresses
const USDC_BASE_MAINNET  = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_BASE_SEPOLIA  = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Network IDs (EIP-155 chain IDs)
const NETWORK_BASE_MAINNET = 'eip155:8453';
const NETWORK_BASE_SEPOLIA = 'eip155:84532';

// Use mainnet by default; set X402_TESTNET=true for testnet
const USE_TESTNET = process.env.X402_TESTNET === 'true';
const NETWORK     = USE_TESTNET ? NETWORK_BASE_SEPOLIA : NETWORK_BASE_MAINNET;
const USDC_ASSET  = USE_TESTNET ? USDC_BASE_SEPOLIA    : USDC_BASE_MAINNET;

const VERCEL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psw-vibelandia-sing9.vercel.app');

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * usdcAmount(dollars) → string of USDC units (6 decimals)
 * $5 → "5000000"
 */
function usdcAmount(dollars) {
  return String(Math.round(dollars * 1_000_000));
}

/**
 * setCors(res) — set permissive CORS so agents from any origin can call us
 */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, X-PAYMENT, X-402-Payment, Authorization, Payment');
  res.setHeader('Access-Control-Expose-Headers',
    'X-PAYMENT-RESPONSE, X-402-Receipt');
}

/**
 * buildPaymentRequirements(options) → the "accepts" array for the 402 body
 */
function buildPaymentRequirements(options) {
  const { priceUsd, route, description, mimeType = 'application/json' } = options;
  return [{
    scheme:             'exact',
    network:            NETWORK,
    maxAmountRequired:  usdcAmount(priceUsd),
    resource:           `${VERCEL_URL}${route}`,
    description,
    mimeType,
    payTo:              EVM_ADDRESS,
    maxTimeoutSeconds:  300,
    asset:              USDC_ASSET,
    extra: {
      name:    'USD Coin',
      version: '2',
    },
  }];
}

/**
 * require402(req, res, options) → true if payment verified, false if 402 returned
 *
 * options: { priceUsd, route, description }
 *
 * Usage:
 *   if (!await require402(req, res, { priceUsd: 5, route: '/api/space-cloud', description: '...' })) return;
 *   // ... serve paid content
 */
async function require402(req, res, options) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  const paymentHeader = req.headers['x-payment']
    ?? req.headers['x-402-payment']
    ?? req.headers['payment'];

  const accepts = buildPaymentRequirements(options);

  if (!paymentHeader) {
    res.status(402).json({
      x402Version: 1,
      error:       'Payment Required — include X-PAYMENT header with signed USDC authorization',
      accepts,
      provider:    'FractiAI SING 9 · NSPFRNP',
      docs:        'https://docs.x402.org/getting-started/quickstart-for-buyers',
      manifest:    `${VERCEL_URL}/services.json`,
    });
    return false;
  }

  // ── Verify with Coinbase facilitator ───────────────────────────────────────
  const verifyBody = {
    x402Version:         1,
    paymentHeader,
    paymentRequirements: accepts[0],
  };

  let verifyResult;
  try {
    const vResp = await fetch(`${FACILITATOR_URL}/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(verifyBody),
    });
    verifyResult = await vResp.json();
  } catch (err) {
    console.error('[x402] facilitator verify error:', err.message);
    res.status(402).json({
      x402Version: 1,
      error:       'Payment verification temporarily unavailable. Retry.',
      accepts,
    });
    return false;
  }

  if (!verifyResult?.isValid) {
    res.status(402).json({
      x402Version: 1,
      error:       verifyResult?.invalidReason ?? 'Payment invalid',
      accepts,
    });
    return false;
  }

  // ── Settle ─────────────────────────────────────────────────────────────────
  try {
    const sResp = await fetch(`${FACILITATOR_URL}/settle`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(verifyBody),
    });
    const settleResult = await sResp.json();
    if (settleResult?.transaction) {
      res.setHeader('X-PAYMENT-RESPONSE', JSON.stringify({ transaction: settleResult.transaction }));
    }
  } catch (err) {
    console.error('[x402] facilitator settle error:', err.message);
    // Non-fatal: payment was verified; continue serving
  }

  return true;
}

/**
 * readBody(req) → parsed JSON body or {}
 */
async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end',  () => {
      try { resolve(JSON.parse(raw)); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = { require402, readBody, setCors, buildPaymentRequirements, VERCEL_URL, EVM_ADDRESS };
