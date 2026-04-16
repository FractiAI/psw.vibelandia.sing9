import { useCallback, useRef, useState } from 'react';

export type AttentionMode = 'external' | 'internal';

export interface NeuralAttentionVector {
  x: number;
  y: number;
  z: number;
  conceptId: string;
  mode: AttentionMode;
}

const DEFAULT_API = '/api/egs-emulation';

/**
 * AwarenessStream — tracks Neural Attention Vector (NAV) with φ-scaled generative seeds.
 * Latent-style updates are fetched from /api/egs-emulation (no heavy local inference).
 */
export function useAwarenessStream(apiBase: string = DEFAULT_API) {
  const [nav, setNav] = useState<NeuralAttentionVector>({
    x: 0.5,
    y: 0.5,
    z: 0.25,
    conceptId: 'ground',
    mode: 'external',
  });
  const [generativeSeed, setGenerativeSeed] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionEpoch, setTransitionEpoch] = useState(0);
  const priorSeedRef = useRef(0);
  const navRef = useRef(nav);
  navRef.current = nav;

  const shiftTowardConcept = useCallback(
    async (conceptId: string) => {
      setTransitioning(true);
      try {
        const r = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId,
            nav: {
              x: navRef.current.x,
              y: navRef.current.y,
              z: navRef.current.z,
            },
            prior_seed: priorSeedRef.current,
          }),
        });
        const j = (await r.json()) as {
          ok?: boolean;
          error?: string;
          generative_seed?: number;
          neural_attention_vector?: {
            x: number;
            y: number;
            z: number;
            concept_id?: string;
            attention?: string;
          };
        };
        if (!j.ok) throw new Error(j.error || 'egs_emulation_failed');
        const n = j.neural_attention_vector;
        if (!n) throw new Error('missing_nav');
        const seed = j.generative_seed ?? 0;
        priorSeedRef.current = seed;
        setGenerativeSeed(seed);
        setNav({
          x: n.x,
          y: n.y,
          z: n.z,
          conceptId: n.concept_id || conceptId,
          mode: n.attention === 'internal' ? 'internal' : 'external',
        });
        setTransitionEpoch((e) => e + 1);
      } catch (e) {
        console.warn('[AwarenessStream] /api/egs-emulation unavailable:', e);
      } finally {
        setTransitioning(false);
      }
    },
    [apiBase]
  );

  return {
    nav,
    generativeSeed,
    transitioning,
    transitionEpoch,
    shiftTowardConcept,
  };
}
