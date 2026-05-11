"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

function StreamInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lines, setLines] = useState<string[]>(["Holographic uplink · session pending…"]);
  const [rtcState, setRtcState] = useState<string>("idle");

  const wsUrl = useMemo(() => {
    if (!sessionId) return null;
    const u = new URL(API_BASE);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = `/ws/holographic/${sessionId}`;
    u.search = "";
    return u.toString();
  }, [sessionId]);

  useEffect(() => {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const j = JSON.parse(ev.data as string);
        if (j.type === "ticker" && j.line) {
          setLines((L) => [...L.slice(-40), j.line]);
        }
        if (j.type === "keepalive") {
          setLines((L) => (L.length && L[L.length - 1].includes("keepalive") ? L : [...L, "· keepalive"]));
        }
      } catch {
        setLines((L) => [...L, String(ev.data)]);
      }
    };
    ws.onopen = () => setLines((L) => [...L, "WebSocket linked to Digital Pru"]);
    ws.onerror = () => setLines((L) => [...L, "WebSocket error"]);
    return () => ws.close();
  }, [wsUrl]);

  const startWebRtcPreview = async () => {
    setRtcState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRtcState("live (local preview track)");
    } catch (e) {
      setRtcState(`blocked: ${String(e)}`);
    }
  };

  return (
    <main style={{ padding: "1rem", background: "#0a0a0f", minHeight: "100vh", color: "#e2e8f0" }}>
      <h1 style={{ color: "#ffd700", fontSize: "1.2rem" }}>Holographic Snap Stream</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        Session: <code style={{ color: "#a5b4fc" }}>{sessionId ?? "—"}</code>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ border: "2px solid rgba(255,215,0,0.4)", borderRadius: 8, padding: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
            WebRTC-class local preview (getUserMedia)
          </div>
          <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 6, background: "#000" }} />
          <button
            type="button"
            onClick={startWebRtcPreview}
            style={{
              marginTop: "0.5rem",
              padding: "0.4rem 0.8rem",
              background: "#1e1b2e",
              color: "#ffd700",
              border: "1px solid #ffd700",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Attach camera
          </button>
          <p style={{ fontSize: "0.72rem", color: "#64748b" }}>RTC state: {rtcState}</p>
        </div>
        <div
          style={{
            border: "2px solid rgba(45,212,191,0.35)",
            borderRadius: 8,
            padding: "0.75rem",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.78rem",
            maxHeight: 360,
            overflow: "auto",
            background: "#050508",
            color: "#86efac",
          }}
        >
          {lines.map((l, i) => (
            <div key={`${i}-${l}`}>{l}</div>
          ))}
        </div>
      </div>
      <footer style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#64748b" }}>
        Isaac Sim bridge listens on UDP 7400 for compile payloads from Digital Pru.
      </footer>
    </main>
  );
}

export default function StreamPage() {
  return (
    <Suspense fallback={<p style={{ color: "#ffd700", padding: 24 }}>Loading stream…</p>}>
      <StreamInner />
    </Suspense>
  );
}
