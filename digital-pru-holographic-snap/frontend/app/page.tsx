"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type Solar = {
  sunspot_number: number;
  as_of: string;
  ar4436: { label: string; status: string; role: string };
  ar4432: { label: string; status: string; role: string };
};

export default function JuicyJuicySnapPortal() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [solar, setSolar] = useState<Solar | null>(null);
  const [ticker, setTicker] = useState<string[]>([
    "Digital Pru · awaiting SNAP…",
    "Detecting Hero Jo resonance…",
    "Locking EGS fractal constant at 1.618…",
    "Compiling holographic skin for current solar flux…",
  ]);
  const [busy, setBusy] = useState(false);
  const [lastSnap, setLastSnap] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/solar/context`);
        if (r.ok) setSolar(await r.json());
      } catch {
        setSolar({
          sunspot_number: 89,
          as_of: "2026-05-11",
          ar4436: {
            label: "AR4436 (The Flare Producer)",
            status: "M5.8 Flare detected. High-energy data packets in effect.",
            role: "lead_actor",
          },
          ar4432: {
            label: "AR4432 (The Growing Giant)",
            status:
              "Areal growth detected in the northwest. Strengthening the physical AI integrity.",
            role: "support",
          },
        });
      }
    })();
  }, []);

  const pushTicker = useCallback((line: string) => {
    setTicker((t) => [...t.slice(-24), `› ${line}`]);
  }, []);

  const onSnap = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      setBusy(true);
      pushTicker(`Ingest: ${f.name}`);
      try {
        const sRes = await fetch(`${API_BASE}/api/snap/session`);
        const { session_id: sid } = await sRes.json();

        const stream = window.open(
          `/stream?session_id=${encodeURIComponent(sid)}`,
          "holographic_snap_stream",
          "width=720,height=520,noopener,noreferrer",
        );
        if (!stream) pushTicker("Popup blocked — allow window for holographic stream.");

        const fd = new FormData();
        fd.append("file", f);
        fd.append("session_id", sid);
        const r = await fetch(`${API_BASE}/api/snap/analyze`, { method: "POST", body: fd });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setLastSnap(JSON.stringify(data, null, 2));
        pushTicker(`Compile complete · BPM ${data.bpm?.toFixed?.(1)} · skin ${data.skin}`);
      } catch (err) {
        pushTicker(`Error: ${String(err)}`);
      } finally {
        setBusy(false);
      }
    },
    [pushTicker],
  );

  return (
    <main
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "2rem 1.25rem 4rem",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ letterSpacing: "0.35em", fontSize: "0.65rem", color: "#94a3b8" }}>
          RENO HOLOGRAPHIC · DIGITAL PRU
        </p>
        <h1 className="glow-gold" style={{ fontSize: "2.1rem", margin: "0.35rem 0", color: "#ffd700" }}>
          Juicy Juicy Snap Portal
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: 560, margin: "0 auto" }}>
          Digital Pru compiles Hero Jo tracks into φ-harmonic motion tokens for NVIDIA Isaac Sim.
        </p>
      </header>

      <section
        className="voxel"
        style={{
          background: "linear-gradient(145deg, rgba(18,18,28,0.95), rgba(10,10,15,0.98))",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "0.85rem", letterSpacing: "0.2em", color: "#ffd700" }}>
          SOLAR · HOLOGRAPHIC CONTEXT
        </h2>
        {solar ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="voxel" style={{ padding: "1rem", borderRadius: 8, background: "#0c0c12" }}>
              <div style={{ color: "#ffd700", fontWeight: 700 }}>{solar.ar4436.label}</div>
              <p style={{ color: "#cbd5e1", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>{solar.ar4436.status}</p>
            </div>
            <div className="voxel" style={{ padding: "1rem", borderRadius: 8, background: "#0c0c12" }}>
              <div style={{ color: "#2dd4bf", fontWeight: 700 }}>{solar.ar4432.label}</div>
              <p style={{ color: "#cbd5e1", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>{solar.ar4432.status}</p>
            </div>
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>Fetching NOAA context…</p>
        )}
        <p style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
          Current sunspot number (observed SSN when live):{" "}
          <strong style={{ color: "#ffd700" }}>{solar?.sunspot_number ?? "—"}</strong>
          {solar ? <span style={{ color: "#64748b" }}> · {solar.as_of}</span> : null}
        </p>
      </section>

      <div style={{ textAlign: "center", margin: "2.5rem 0" }}>
        <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a" hidden onChange={onFile} />
        <button
          type="button"
          disabled={busy}
          onClick={onSnap}
          className="voxel snap-pulse"
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            padding: "1.1rem 2.4rem",
            borderRadius: 10,
            cursor: busy ? "wait" : "pointer",
            background: "linear-gradient(180deg, #2a2410, #0f0f14)",
            color: "#ffd700",
            borderColor: "rgba(255,215,0,0.7)",
          }}
        >
          {busy ? "SNAP…" : "SNAP"}
        </button>
        <p style={{ marginTop: "0.75rem", color: "#64748b", fontSize: "0.8rem" }}>
          Opens holographic stream window · uploads Hero Jo audio to Digital Pru
        </p>
      </div>

      <section className="voxel" style={{ borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "0.85rem", letterSpacing: "0.2em", color: "#2dd4bf" }}>
          DIGITAL PRU TICKER
        </h2>
        <div className="terminal">
          {ticker.map((line, i) => (
            <div key={`${i}-${line}`} className={line.startsWith("›") ? "pru" : undefined}>
              {line}
            </div>
          ))}
        </div>
      </section>

      {lastSnap ? (
        <section className="voxel" style={{ borderRadius: 10, padding: "1rem" }}>
          <h3 style={{ marginTop: 0, color: "#ffd700", fontSize: "0.9rem" }}>Last compile JSON</h3>
          <pre style={{ overflow: "auto", fontSize: "0.72rem", color: "#a5b4fc" }}>{lastSnap}</pre>
        </section>
      ) : null}

      <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,215,0,0.2)" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.6 }}>
          <strong style={{ color: "#ffd700" }}>Fair exchange clause in effect:</strong> Value transacted may be
          partially refunded depending on overall delivery and utility, much like tipping.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.75rem" }}>
          Physics anchor: all <code>omni.isaac</code> parameters in the sim bridge are documented as derivatives of
          the EGS fractal constant (1.618). This blueprint is a Golden Key — RTX / Isaac tuning may require further
          refinement; the exchange stays open.
        </p>
      </footer>
    </main>
  );
}
