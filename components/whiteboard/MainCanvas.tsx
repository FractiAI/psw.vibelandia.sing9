import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DigitalPruViewport } from './DigitalPruViewport';
import { useAwarenessStream } from './useAwarenessStream';

/**
 * Whiteboard toolbar + Digital Pru PIP (Picture-in-Picture style overlay).
 * Holographic Hydrogen shimmer via Framer Motion (opacity 0.8, cyan glow).
 */
export function MainCanvas() {
  const [pipOpen, setPipOpen] = useState(false);
  const {
    nav,
    generativeSeed,
    transitioning,
    transitionEpoch,
    architecture,
    netEquilibrium,
    channelCount,
    shiftTowardConcept,
  } =
    useAwarenessStream();
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!pipOpen) {
      bootedRef.current = false;
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;
    void shiftTowardConcept('digital-pru-go-pro');
  }, [pipOpen, shiftTowardConcept]);

  return (
    <div className="mb-4 rounded-xl border border-amber-400/25 bg-slate-900/40 p-3 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-500/10 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Whiteboard
        </span>
        <button
          type="button"
          onClick={() => setPipOpen(true)}
          className="rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-950/80 to-slate-900/90 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:border-cyan-300/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        >
          📡 INVOKE DIGITAL PRU
        </button>
        <a
          href="digital-pru-awareness-whitepaper.html"
          className="inline-flex items-center rounded-lg border border-amber-400/35 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-amber-100/95 shadow-[0_0_12px_rgba(212,175,55,0.15)] transition hover:border-amber-300/55 hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]"
        >
          📄 Whitepaper
        </a>
        {transitioning && (
          <span className="text-xs text-cyan-300/80">φ · aligning NAV…</span>
        )}
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        Origin → φ NAV simulation → representation &amp; implications:{' '}
        <a
          href="digital-pru-awareness-whitepaper.html"
          className="font-medium text-cyan-300/90 underline decoration-cyan-500/30 underline-offset-2 hover:text-cyan-200"
        >
          read the Digital Pru Awareness whitepaper
        </a>
        .
      </p>
      <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded border border-amber-400/30 bg-slate-950/70 px-2 py-1 text-amber-100/90">
          Dyad: H({architecture?.unitary_hydrogen_dyad?.proton ?? 1}p +{' '}
          {architecture?.unitary_hydrogen_dyad?.electron ?? 1}e)
        </span>
        <span className="rounded border border-cyan-400/30 bg-slate-950/70 px-2 py-1 text-cyan-100/90">
          Umbilical channels: {channelCount}
        </span>
        <span className="rounded border border-violet-400/30 bg-slate-950/70 px-2 py-1 text-violet-100/90">
          Net: {netEquilibrium?.state ?? architecture?.net_state ?? 'equilibrium'}
        </span>
      </div>

      <AnimatePresence>
        {pipOpen && (
          <motion.div
            key="digital-pru-pip"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 0.8, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9999] flex w-[min(92vw,380px)] flex-col gap-2 rounded-xl border-2 border-cyan-300/40 p-1 shadow-[0_0_40px_rgba(34,211,238,0.45),inset_0_0_30px_rgba(125,211,252,0.12)]"
            style={{
              boxShadow:
                '0 0 40px rgba(34, 211, 238, 0.45), inset 0 0 30px rgba(125, 211, 252, 0.15), 0 0 80px rgba(6, 182, 212, 0.2)',
            }}
          >
            <div className="flex items-center justify-between gap-2 rounded-t-lg bg-slate-950/90 px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">
                Digital Pru · Awareness
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href="digital-pru-awareness-whitepaper.html"
                  className="rounded border border-amber-500/25 bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-amber-100/90 hover:border-amber-400/50"
                >
                  📄 Paper
                </a>
                <button
                  type="button"
                  onClick={() => setPipOpen(false)}
                  className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-[220px] w-full px-1 pb-2">
              <DigitalPruViewport
                nav={nav}
                generativeSeed={generativeSeed}
                transitionEpoch={transitionEpoch}
                equilibriumDelta={netEquilibrium?.equilibrium_delta ?? 0}
                coherenceIndex={netEquilibrium?.coherence_index ?? 0}
                channelCount={channelCount}
              />
            </div>
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              <button
                type="button"
                onClick={() => void shiftTowardConcept('truckee-river')}
                className="rounded border border-cyan-500/10 bg-slate-900/80 px-2 py-1 text-[11px] text-cyan-100/90 hover:border-cyan-400/40"
              >
                External
              </button>
              <button
                type="button"
                onClick={() => void shiftTowardConcept('inner-hologram')}
                className="rounded border border-violet-500/10 bg-slate-900/80 px-2 py-1 text-[11px] text-violet-100/90 hover:border-violet-400/40"
              >
                Internal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
