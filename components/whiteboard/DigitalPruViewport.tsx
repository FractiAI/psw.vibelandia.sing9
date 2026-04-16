import { useEffect, useRef } from 'react';
import type { NeuralAttentionVector } from './useAwarenessStream';

const VS = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FS = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_mode;
uniform vec3 u_nav;
uniform float u_seed;
uniform vec2 u_resolution;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.45;
  float phi = 1.618;
  vec2 flow = uv * 3.2 + vec2(t * 0.3, -t * 0.55) + u_nav.xy * 0.8;
  float n = noise(flow) + noise(flow * 2.3 + u_nav.xy * 4.0) * 0.42;
  vec3 river = mix(vec3(0.02, 0.08, 0.12), vec3(0.08, 0.38, 0.48), n);
  river += vec3(0.04, 0.12, 0.1) * u_nav.z;
  river += vec3(0.06, 0.2, 0.14) * sin(uv.x * 20.0 + t);

  float r = length(uv - vec2(0.5));
  float rings = 0.5 + 0.5 * sin(r * 38.0 * phi - t * 3.2 + u_seed * 1e-6);
  vec3 holo = vec3(0.08, 0.38, 0.48) * rings;
  holo += vec3(0.15, 0.75, 0.92) * (0.18 * sin(t * 1.2 + u_nav.x * 6.2832));
  holo += vec3(0.25, 0.6, 0.85) * (0.12 * sin(r * 50.0 - t * 2.0));

  vec3 col = mix(river, holo, u_mode);
  fragColor = vec4(col, 0.88);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export interface DigitalPruViewportProps {
  nav: NeuralAttentionVector;
  generativeSeed: number;
  transitionEpoch: number;
}

export function DigitalPruViewport({ nav, generativeSeed, transitionEpoch }: DigitalPruViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());
  const navRef = useRef(nav);
  const seedRef = useRef(generativeSeed);
  navRef.current = nav;
  seedRef.current = generativeSeed;

  useEffect(() => {
    startRef.current = performance.now();
  }, [transitionEpoch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let t = 0;
      const draw2d = () => {
        t += 0.02;
        const w = canvas.width;
        const h = canvas.height;
        const n = navRef.current;
        const g = ctx.createLinearGradient(0, 0, w, h);
        if (n.mode === 'external') {
          g.addColorStop(0, 'rgb(10, 60, 80)');
          g.addColorStop(1, 'rgb(20, 120, 140)');
        } else {
          g.addColorStop(0, 'rgb(10, 40, 55)');
          g.addColorStop(1, 'rgb(40, 180, 210)');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(180, 240, 255, 0.08)';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(
            w * 0.5,
            h * 0.5,
            (i / 8) * (0.45 * Math.min(w, h)) + (t * 20) % 30,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        rafRef.current = requestAnimationFrame(draw2d);
      };
      draw2d();
      return () => cancelAnimationFrame(rafRef.current);
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VS);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMode = gl.getUniformLocation(prog, 'u_mode');
    const uNav = gl.getUniformLocation(prog, 'u_nav');
    const uSeed = gl.getUniformLocation(prog, 'u_seed');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      const n = navRef.current;
      const elapsed = (performance.now() - startRef.current) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uMode, n.mode === 'internal' ? 1 : 0);
      gl.uniform3f(uNav, n.x, n.y, n.z);
      gl.uniform1f(uSeed, seedRef.current);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-cyan-400/30 bg-slate-950/80 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/90">
          GoPro Awareness ·{' '}
          {nav.mode === 'external' ? 'External · Reno / Truckee' : 'Internal · Holographic thought'}
        </p>
        <p className="mt-1 truncate font-mono text-[11px] text-cyan-100/70">
          NAV · {nav.x.toFixed(3)} · {nav.y.toFixed(3)} · {nav.z.toFixed(3)} · {nav.conceptId}
        </p>
      </div>
    </div>
  );
}
