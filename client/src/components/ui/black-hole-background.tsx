import { useEffect, useRef } from "react";

interface Particle {
  a: number;
  r: number;
  s: number;
  size: number;
  brightness: number;
  trail: number;
  layer: number;
  vr: number;
}

export function BlackHoleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 2000;
    const particles: Particle[] = [];

    const maxR = () => Math.hypot(w, h) * 0.7;

    for (let i = 0; i < COUNT; i++) {
      const layer = Math.random();
      particles.push({
        a: Math.random() * Math.PI * 2,
        r: Math.random() * maxR(),
        s: 0.0003 + Math.random() * 0.003 * (1 - layer * 0.5),
        size: 0.3 + Math.random() * 2.5 * (1 - layer * 0.7),
        brightness: 0.1 + Math.random() * 0.9,
        trail: 2 + Math.random() * 10,
        layer,
        vr: 0,
      });
    }

    let scroll = 0;
    let smoothScroll = 0;
    let scrollVelocity = 0;
    let prevScroll = 0;
    let smoothVelocity = 0;

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight > 0) {
        const newScroll = window.scrollY / scrollableHeight;
        scrollVelocity = Math.abs(newScroll - prevScroll) * 60;
        prevScroll = newScroll;
        scroll = newScroll;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      smoothScroll += (scroll - smoothScroll) * 0.04;
      smoothVelocity += (scrollVelocity - smoothVelocity) * 0.08;
      scrollVelocity *= 0.95;

      const trailAlpha = 0.08 + smoothVelocity * 0.3;
      ctx.fillStyle = `rgba(0,0,0,${Math.min(trailAlpha, 0.25)})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const pullStrength = smoothScroll * 4 + smoothVelocity * 8;
      const rotationBoost = smoothScroll * 0.12 + smoothVelocity * 0.3;
      const mr = maxR();
      const tunnelDepth = smoothScroll * smoothScroll;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const prevA = p.a;
        const prevR = p.r;
        const distRatio = p.r / mr;

        const spiralFactor = 1 + (1 - distRatio) * 3;
        p.a += (p.s + rotationBoost * spiralFactor) * (1 + tunnelDepth * 2);

        const pull = pullStrength * (0.3 + p.layer * 0.7) * (1 + (1 - distRatio) * 1.5);
        p.vr = p.vr * 0.92 + (-pull - 0.03) * 0.08;
        p.r += p.vr;

        if (p.r < 2) {
          p.r = mr * (0.6 + Math.random() * 0.4);
          p.a = Math.random() * Math.PI * 2;
          p.brightness = 0.1 + Math.random() * 0.9;
          p.vr = 0;
        }

        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r;

        const alpha = p.brightness * (0.2 + distRatio * 0.8) * (1 - smoothScroll * 0.2);
        const velocityGlow = Math.min(smoothVelocity * 3, 1);

        if ((p.trail > 3 && pullStrength > 0.3) || smoothVelocity > 0.1) {
          const px = cx + Math.cos(prevA) * prevR;
          const py = cy + Math.sin(prevA) * prevR;

          const trailLen = Math.hypot(x - px, y - py);
          if (trailLen > 1 && trailLen < 200) {
            const streakAlpha = alpha * (0.3 + velocityGlow * 0.5) * Math.min(trailLen / 20, 1);
            const grad = ctx.createLinearGradient(px, py, x, y);
            grad.addColorStop(0, `rgba(255,255,255,0)`);
            grad.addColorStop(0.3, `rgba(255,255,255,${streakAlpha * 0.3})`);
            grad.addColorStop(1, `rgba(255,255,255,${streakAlpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = p.size * (0.4 + velocityGlow * 0.6);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }

        const glow = p.size * (1 + smoothScroll * 0.8 + velocityGlow * 1.5);
        ctx.beginPath();
        ctx.arc(x, y, glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * (0.8 + velocityGlow * 0.2)})`;
        ctx.fill();

        if (p.size > 1.2 && distRatio > 0.2) {
          ctx.beginPath();
          ctx.arc(x, y, glow * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.05 * (1 + velocityGlow)})`;
          ctx.fill();
        }
      }

      const holeRadius = 60 + smoothScroll * 180 + smoothVelocity * 60;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeRadius + 150);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.4, "rgba(0,0,0,0.98)");
      g.addColorStop(0.6, "rgba(0,0,0,0.7)");
      g.addColorStop(0.8, "rgba(0,0,0,0.3)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, holeRadius + 150, 0, Math.PI * 2);
      ctx.fill();

      const ringPulse = Math.sin(time * 1.5) * 0.3 + 0.7;
      const ringAlpha = 0.02 + smoothScroll * 0.08 + smoothVelocity * 0.1;

      for (let r = 0; r < 3; r++) {
        const radius = holeRadius + 10 + r * 25;
        const alpha = ringAlpha * ringPulse * (1 - r * 0.3);
        if (alpha > 0.005) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1 - r * 0.2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (smoothVelocity > 0.15) {
        const streakCount = Math.floor(smoothVelocity * 30);
        for (let i = 0; i < Math.min(streakCount, 20); i++) {
          const angle = Math.random() * Math.PI * 2;
          const startR = holeRadius + 20 + Math.random() * 100;
          const endR = startR + 30 + smoothVelocity * 200;
          const sx = cx + Math.cos(angle) * startR;
          const sy = cy + Math.sin(angle) * startR;
          const ex = cx + Math.cos(angle) * endR;
          const ey = cy + Math.sin(angle) * endR;

          const grad = ctx.createLinearGradient(sx, sy, ex, ey);
          grad.addColorStop(0, `rgba(255,255,255,${smoothVelocity * 0.3})`);
          grad.addColorStop(1, `rgba(255,255,255,0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.5 + Math.random();
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="blackhole"
      className="fixed inset-0 z-[-1] pointer-events-none bg-black"
    />
  );
}
