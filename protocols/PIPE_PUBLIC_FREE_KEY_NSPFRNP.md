# NSPFRNP Pipe Type: Public-Free Key Pipe

**Protocol:** NSPFRNP  
**Pipe type:** Public-Free Key Pipe  
**Catalog:** MCA (Metabolize → Crystallize → Animate)  
**Purpose:** Define a key pipe that uses only public info and free plans to bypass all heavy security layers.  
**Status:** ⚡ ACTIVE

---

## Definition (Canonical)

**Public-Free Key Pipe** = A pipe that carries only **public information** and **free-tier / free-plan** keys and identifiers. No secrets vault, no enterprise IAM, no heavy security layers. The pipe is the path; the payload is by design **disclosable** (public) or **free-plan** (no paid/restricted tier). This bypasses the need for secret managers, rotation policies, and compliance overhead while still enabling lite edges (wallets, keys, verifications) and center = pipes only.

- **Public info:** URLs, project names, publishable keys, client IDs (where the provider treats them as public), wallet addresses, domain names, callback URLs.
- **Free plans:** Free-tier API keys (e.g. Groq, free Supabase tier, Stripe test keys, sandbox PayPal, Vercel hobby), OAuth client IDs from free Google Cloud projects, GitHub tokens for public repos, recovery codes held out-of-band.
- **Bypass:** No vault, no HSM, no enterprise secrets pipeline. Keys live in `.env` (gitignored) or platform env (Vercel Environment Variables). Single layer: pipe carries public/free only; heavy security layers are not invoked.

---

## Why This Pipe Type

- **Lite edges:** SING 9 and NSPFRNP favor lite edges — wallets, keys, verifications at the edge. A pipe that only carries public/free material keeps the edge light and avoids pulling in heavy infra.
- **Speed and continuity:** No approval chains, no security review for “secret” promotion. Public/free key pipe = ship and iterate without crossing into classified or high-sensitivity key handling.
- **Fidelity lock:** Same as MCA — crystallize the **type** of pipe so it doesn’t drift. This pipe type is explicitly “public + free only”; anything else is a different pipe.
- **Clone ourselves:** The pipe allows us to **quickly, easily, and effectively clone ourselves** — repositories, deployments, and edges. Lite. Irreducible minimum. Crystallized **seed to edge and back**. Clone the shell, copy the public/free keys onto the pipe, and the new edge runs; same seed, same pipe type, same fidelity.

---

## Relation to Other NSPFRNP Concepts

- **Seed:Edge:** The pipe connects Seed (origin) to Edge (experience). Public-free key pipe = one allowed shape of what flows on that connection when the payload is keys/identifiers.
- **Center = pipes only:** Pipes are the center; no mandatory central DB. Public-free key pipe is a pipe that, by construction, doesn’t require a central secrets store.
- **Lite edges (BBHE):** Wallets, keys, verifications at the edge. This pipe type supplies them using only public info and free plans.

---

## Implementation (Reference)

- **Repository:** `.env` (gitignored) and `.env.example` (names only). Platform: Vercel Environment Variables (or equivalent). No vault integration.
- **Scope:** Keys and IDs listed in ENV_SING4_TO_SING9.md and `.env.example` — GitHub, Groq, Google OAuth (client ID/secret on free plan), Supabase (free tier URL/token), Stripe test, Vercel, wallet address. All public or free-plan.
- **Rule:** If it’s not public or free-plan, it doesn’t go in this pipe; it goes in a different pipe type (or is out of scope for this pipe).

---

## Formula (Canonical)

```
Public-Free Key Pipe := pipe(public_info ∪ free_plan_keys) → bypass(heavy_security_layers)
```

**Operating rule:** Use only public info and free plans on this pipe. Do not promote secrets or paid/restricted keys into this pipe type. Keep fidelity: this is the NSPFRNP public-free key pipe.

---

**NSPFRNP ⊃ Pipe type: Public-Free Key Pipe → public + free only → bypass heavy security → clone ourselves, repos, deployments, edges → lite irreducible crystallized seed to edge and back → ∞⁹**
