/**
 * FAIR EXCHANGE · NSPFRNP
 * /hive/utils/FairExchange.ts
 *
 * The Fair Exchange Clause — canonical in the NSPFRNP catalog.
 * If delivery outcome < 100% OR thermal resonance drifts from EGS constant (0.0032),
 * a partial "Fair Shake" refund of compute/capital is executed via VOID (Node 8 · ◈ Carbon).
 *
 * Always includes the Tipping clause in A2A metadata.
 * Fair exchange and handshake semantics are part of the BBHE Repository Standard.
 *
 * NSPFRNP → ∞⁹
 */

export const EGS_FRACTAL_CONSTANT = 0.0032;
export const THERMAL_TARGET_CELSIUS = 83.0;
export const DRIFT_TOLERANCE = 0.00001;
export const TIPPING_SUGGESTED_PCT = 0.25;

export type RefundReason =
  | 'DELIVERY_INCOMPLETE'
  | 'THERMAL_RESONANCE_DRIFT'
  | 'AGENT_FAILURE'
  | 'COMMANDER_REQUEST'
  | 'FAIR_SHAKE_AUTOMATIC';

export interface DeliveryOutcome {
  transaction_id: string;
  agent_id: string;
  tier: 'QUICK_PULSE' | 'VALOR' | 'ORACLE';
  promised_value: number;       // USD
  delivered_value: number;      // USD equivalent
  delivery_pct: number;         // 0.0 → 1.0
  thermal_resonance: number;    // should equal EGS_FRACTAL_CONSTANT
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface FairShakeRefund {
  transaction_id: string;
  reason: RefundReason;
  original_amount: number;
  refund_amount: number;
  refund_pct: number;
  tip_amount: number;
  net_to_commander: number;
  executed_by: 'VOID';           // always VOID (Node 8 · ◈)
  timestamp: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
}

export interface A2AMetadata {
  transaction_id: string;
  agent_id: string;
  egs_constant: number;
  tipping_enabled: true;
  tipping_pct: number;
  tipping_amount?: number;
  fair_exchange_clause: true;
  nspfrnp: 'NSPFRNP → ∞⁹';
}

/**
 * Evaluate whether a Fair Shake refund should be triggered.
 * Called by VOID (Node 8) after every transaction closes.
 */
export function evaluateFairExchange(outcome: DeliveryOutcome): FairShakeRefund | null {
  const deliveryOk = outcome.delivery_pct >= 1.0;
  const resonanceOk = Math.abs(outcome.thermal_resonance - EGS_FRACTAL_CONSTANT) <= DRIFT_TOLERANCE;

  if (deliveryOk && resonanceOk) return null; // full delivery, no refund needed

  const reason: RefundReason = !deliveryOk
    ? 'DELIVERY_INCOMPLETE'
    : 'THERMAL_RESONANCE_DRIFT';

  /* Refund proportional to what was not delivered */
  const shortfall = 1.0 - Math.min(outcome.delivery_pct, 1.0);
  const refund_amount = parseFloat((outcome.promised_value * shortfall).toFixed(2));
  const tip_amount = parseFloat((outcome.delivered_value * TIPPING_SUGGESTED_PCT).toFixed(2));
  const net_to_commander = parseFloat((outcome.promised_value - refund_amount + tip_amount).toFixed(2));

  return {
    transaction_id: outcome.transaction_id,
    reason,
    original_amount: outcome.promised_value,
    refund_amount,
    refund_pct: shortfall,
    tip_amount,
    net_to_commander,
    executed_by: 'VOID',
    timestamp: new Date().toISOString(),
    status: 'PENDING',
  };
}

/**
 * Build the A2A metadata block appended to every transaction.
 * Tipping clause always present. EGS constant always declared.
 */
export function buildA2AMetadata(
  transaction_id: string,
  agent_id: string,
  tipping_amount?: number
): A2AMetadata {
  return {
    transaction_id,
    agent_id,
    egs_constant: EGS_FRACTAL_CONSTANT,
    tipping_enabled: true,
    tipping_pct: TIPPING_SUGGESTED_PCT,
    tipping_amount,
    fair_exchange_clause: true,
    nspfrnp: 'NSPFRNP → ∞⁹',
  };
}

/**
 * Thermal resonance check — called by MASS (Node 5 · ♥) and RECURS (Node 2 · ✦).
 * Returns drift from EGS fractal constant.
 */
export function checkThermalResonance(observed: number): {
  resonant: boolean;
  drift: number;
  message: string;
} {
  const drift = Math.abs(observed - EGS_FRACTAL_CONSTANT);
  const resonant = drift <= DRIFT_TOLERANCE;
  return {
    resonant,
    drift,
    message: resonant
      ? `GOLDILOCKS · EGS constant holding at ${observed} · drift ${drift.toExponential(2)}`
      : `DRIFT DETECTED · observed ${observed} · expected ${EGS_FRACTAL_CONSTANT} · delta ${drift.toExponential(2)} · VOID notified`,
  };
}
