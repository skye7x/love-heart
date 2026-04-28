"use client";

import { useEffect, useRef } from "react";

interface ParticleState {
  sx: number;
  sy: number;
  alpha: number;
  size: number;
  r: number;
  g: number;
  b: number;
  depth: number;
  z: number;
  blinkAlpha: number;
  blinkTimer: number;
  blinkDuration: number;
  blinkPhase: "idle" | "out" | "in";
}

const COUNT = 70;

function heartX(t: number) {
  return 16 * Math.pow(Math.sin(t), 3);
}

function heartY(t: number) {
  return -(
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t)
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function LoveHeart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to fill parent
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Build heart points
    const points = Array.from({ length: COUNT }, (_, i) => {
      const t = (i / COUNT) * Math.PI * 2;
      return { bx: heartX(t), by: heartY(t) };
    });

    // Initial particle state
    const state: ParticleState[] = points.map(() => ({
      sx: canvas.width / 2,
      sy: canvas.height / 2,
      alpha: 0,
      size: 12,
      r: 220,
      g: 60,
      b: 80,
      depth: 0,
      z: 0,
      blinkAlpha: 1,
      blinkTimer: Math.random() * 300,
      blinkDuration: 0,
      blinkPhase: "idle",
    }));

    let angle = 0;
    let last = 0;
    let rafId: number;

    const draw = (ts: number) => {
      const dt = Math.min((ts - last) / 16.67, 3);
      last = ts;
      const sm = 1 - Math.pow(0.08, dt);

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2 + H * 0.02;
      const scale = Math.min(W, H) / 38;

      ctx.clearRect(0, 0, W, H);

      // Compute 3D targets
      const targets = points.map((p) => {
        const x3d = p.bx * Math.cos(angle);
        const z3d = p.bx * Math.sin(angle);
        const depth = (z3d + 20) / 40;
        return { sx: cx + x3d * scale, sy: cy + p.by * scale, depth, z: z3d };
      });

      // Lerp state toward targets + handle blink
      state.forEach((s, i) => {
        const t = targets[i];
        s.sx = lerp(s.sx, t.sx, sm);
        s.sy = lerp(s.sy, t.sy, sm);
        s.depth = lerp(s.depth, t.depth, sm);
        s.z = t.z;

        const backFade = t.depth < 0.28 ? t.depth / 0.28 : 1;
        s.alpha = lerp(s.alpha, backFade * (0.5 + t.depth * 0.5), sm);
        s.size = lerp(s.size, 8.5 + t.depth * 8, sm);
        s.r = lerp(s.r, 230 + t.depth * 25, sm);
        s.g = lerp(s.g, 40 + t.depth * 90, sm);
        s.b = lerp(s.b, 70 + t.depth * 40, sm);

        // Blink logic
        s.blinkTimer -= dt;
        if (s.blinkPhase === "idle" && s.blinkTimer <= 0) {
          s.blinkPhase = "out";
          s.blinkDuration = 18 + Math.random() * 18;
          s.blinkTimer = s.blinkDuration;
        } else if (s.blinkPhase === "out") {
          s.blinkAlpha = lerp(s.blinkAlpha, 0, 0.18);
          s.blinkTimer -= dt;
          if (s.blinkTimer <= 0) {
            s.blinkPhase = "in";
            s.blinkTimer = s.blinkDuration;
          }
        } else if (s.blinkPhase === "in") {
          s.blinkAlpha = lerp(s.blinkAlpha, 1, 0.12);
          s.blinkTimer -= dt;
          if (s.blinkTimer <= 0) {
            s.blinkPhase = "idle";
            s.blinkAlpha = 1;
            s.blinkTimer = 120 + Math.random() * 300;
          }
        }
      });

      // Sort back-to-front
      const sorted = [...state].sort((a, b) => a.z - b.z);

      sorted.forEach((p) => {
        const finalAlpha = p.alpha * p.blinkAlpha;
        if (finalAlpha < 0.04) return;

        const bright = p.depth > 0.6;

        ctx.save();
        ctx.globalAlpha = Math.min(finalAlpha, 1);
        ctx.font = `${p.size.toFixed(1)}px Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgb(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)})`;
        ctx.shadowColor = bright
          ? "rgba(255,80,120,0.9)"
          : "rgba(200,50,90,0.4)";
        ctx.shadowBlur = bright ? 18 : 5;
        ctx.fillText("I love you", p.sx, p.sy);

        // Extra bloom for front-facing particles
        if (bright) {
          ctx.globalAlpha = finalAlpha * 0.18;
          ctx.shadowBlur = 35;
          ctx.fillText("I love you", p.sx, p.sy);
        }
        ctx.restore();
      });

      // Vignette
      const grad = ctx.createRadialGradient(cx, cy, H * 0.1, cx, cy, H * 0.56);
      grad.addColorStop(0, "rgba(10,0,5,0)");
      grad.addColorStop(0.55, "rgba(10,0,5,0)");
      grad.addColorStop(1, "rgba(10,0,5,0.82)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      angle += 0.007 * dt;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
