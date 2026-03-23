// background.js — Canvas background system with gradient interpolation + theme animations

// Section gradient definitions matching spec
const SECTION_GRADIENTS = [
  // sunsetGlow (Hero)
  [{ r: 26, g: 42, b: 108 }, { r: 178, g: 31, b: 31 }, { r: 253, g: 187, b: 45 }],
  // ocean (Core)
  [{ r: 0, g: 119, b: 182 }, { r: 0, g: 95, b: 140 }, { r: 2, g: 62, b: 88 }, { r: 1, g: 40, b: 58 }],
  // forest (Smart)
  [{ r: 45, g: 140, b: 90 }, { r: 27, g: 107, b: 58 }, { r: 20, g: 82, b: 48 }, { r: 11, g: 61, b: 33 }],
  // aurora (Pro)
  [{ r: 0, g: 201, b: 167 }, { r: 27, g: 154, b: 170 }, { r: 74, g: 88, b: 153 }, { r: 107, g: 63, b: 160 }],
  // midnight (More)
  [{ r: 26, g: 26, b: 78 }, { r: 20, g: 20, b: 56 }, { r: 13, g: 13, b: 38 }, { r: 35, g: 35, b: 105 }],
  // desert (Reviews)
  [{ r: 232, g: 168, b: 124 }, { r: 214, g: 132, b: 56 }, { r: 196, g: 107, b: 30 }, { r: 139, g: 69, b: 19 }]
];

const THEME_NAMES = ['sunsetGlow', 'ocean', 'forest', 'aurora', 'midnight', 'desert'];

class BackgroundRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.lastFrame = 0;
    this.animations = {};
    this.gradientShift = null;
    this.reducedMotion = false;
    this._prevFocused = -1;
    this._animOpacity = 1;
    this._fadeTarget = null;
    this._blurCanvas = document.createElement('canvas');
    this._blurCtx = this._blurCanvas.getContext('2d');
  }

  init() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Create animation instances (lazy — classes may not exist yet during incremental dev)
    this.gradientShift = typeof GradientShiftLayer !== 'undefined' ? new GradientShiftLayer() : null;
    const animClasses = {
      sunsetGlow: typeof SunsetGlowAnimation !== 'undefined' ? SunsetGlowAnimation : null,
      ocean: typeof OceanAnimation !== 'undefined' ? OceanAnimation : null,
      forest: typeof ForestAnimation !== 'undefined' ? ForestAnimation : null,
      aurora: typeof AuroraAnimation !== 'undefined' ? AuroraAnimation : null,
      midnight: typeof MidnightAnimation !== 'undefined' ? MidnightAnimation : null,
      desert: typeof DesertAnimation !== 'undefined' ? DesertAnimation : null
    };
    for (const [name, Cls] of Object.entries(animClasses)) {
      this.animations[name] = Cls ? new Cls() : null;
    }

    this._frame(performance.now());
  }

  _resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._blurCanvas.width = Math.ceil(this.width / 4);
    this._blurCanvas.height = Math.ceil(this.height / 4);
  }

  drawBlurred(callback) {
    const bCtx = this._blurCtx;
    const bw = this._blurCanvas.width;
    const bh = this._blurCanvas.height;
    const scale = 0.25;

    bCtx.clearRect(0, 0, bw, bh);
    bCtx.save();
    bCtx.scale(scale, scale);
    callback(bCtx, this.width, this.height);
    bCtx.restore();

    this.ctx.drawImage(this._blurCanvas, 0, 0, this.width, this.height);
  }

  _frame(now) {
    requestAnimationFrame(t => this._frame(t));

    // 30fps throttle
    if (now - this.lastFrame < 33) return;
    this.lastFrame = now;

    const time = now / 1000;
    const st = window.scrollTracker;
    if (!st) return;

    const focused = st.focusedIndex;
    const blend = st.blendFactor;
    const dir = st.blendDirection;

    const { ctx, width, height } = this;

    // Draw gradient (no interpolation when reduced motion)
    const effectiveBlend = this.reducedMotion ? 0 : blend;
    this._drawGradient(ctx, width, height, focused, effectiveBlend, dir);

    // Gradient shift layer
    if (!this.reducedMotion && this.gradientShift) {
      const colors = SECTION_GRADIENTS[focused];
      this.drawBlurred((bCtx, w, h) => {
        this.gradientShift.draw(bCtx, w, h, time, colors);
      });
    }

    // Theme animation (only focused section's animation)
    if (!this.reducedMotion) {
      const theme = THEME_NAMES[focused];
      const anim = this.animations[theme];
      if (anim) {
        const scale = Math.max(Math.min(width / 400, 1.0), 0.5);
        // Handle fade transition
        if (this._prevFocused !== focused) {
          this._fadeTarget = focused;
          this._animOpacity = 0;
          this._prevFocused = focused;
        }
        if (this._animOpacity < 1) {
          this._animOpacity = Math.min(this._animOpacity + 0.033, 1);
        }
        ctx.globalAlpha = this._animOpacity;
        anim.update(time, ctx, width, height, scale, this);
        ctx.globalAlpha = 1;
      }
    }
  }

  _drawGradient(ctx, w, h, focused, blend, dir) {
    const colors1 = SECTION_GRADIENTS[focused];
    const adjIdx = focused + dir;
    const colors2 = (adjIdx >= 0 && adjIdx < SECTION_GRADIENTS.length)
      ? SECTION_GRADIENTS[adjIdx]
      : colors1;

    const mixed = this._interpolateGradient(colors1, colors2, blend);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    mixed.forEach((c, i) => {
      grad.addColorStop(i / (mixed.length - 1), `rgb(${c.r},${c.g},${c.b})`);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  _interpolateGradient(a, b, t) {
    const len = Math.max(a.length, b.length);
    const result = [];
    for (let i = 0; i < len; i++) {
      const ai = a[Math.min(Math.floor(i * a.length / len), a.length - 1)];
      const bi = b[Math.min(Math.floor(i * b.length / len), b.length - 1)];
      result.push({
        r: Math.round(ai.r + (bi.r - ai.r) * t),
        g: Math.round(ai.g + (bi.g - ai.g) * t),
        b: Math.round(ai.b + (bi.b - ai.b) * t)
      });
    }
    return result;
  }
}

class GradientShiftLayer {
  draw(ctx, w, h, time, colors) {
    const minDim = Math.min(w, h);
    const cycle = (Math.sin(time * 0.628) + 1) / 2;

    const r1 = minDim * 0.35;
    const x1 = w * 0.3 + w * 0.1 * cycle;
    const y1 = h * 0.3 + h * 0.1 * cycle;
    const c1 = colors[0];

    ctx.globalAlpha = 0.09;
    ctx.beginPath();
    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${c1.r},${c1.g},${c1.b})`;
    ctx.fill();

    const r2 = minDim * 0.3;
    const cLast = colors[colors.length - 1];
    const x2 = w * 0.7 - w * 0.1 * cycle;
    const y2 = h * 0.7 - h * 0.1 * cycle;

    ctx.beginPath();
    ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${cLast.r},${cLast.g},${cLast.b})`;
    ctx.fill();
  }
}

// --- Task 10: SunsetGlow and Ocean animations ---

class SunsetGlowAnimation {
  update(time, ctx, w, h, scale, renderer) {
    const minDim = Math.min(w, h);

    // Large pulsing sun glow
    const sunR = minDim * 0.25;
    const pulse = 1.0 + 0.1 * Math.sin(time * 1.047);
    const sunY = h * 0.3 + 10 * Math.sin(time * 1.047);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.shadowBlur = sunR * 0.5;
    ctx.shadowColor = 'white';
    ctx.beginPath();
    ctx.arc(w * 0.3, sunY, sunR * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.restore();

    // 2 drifting light rays
    if (renderer) {
      renderer.drawBlurred((bCtx, w, h) => {
        bCtx.globalAlpha = 0.12;
        const ray1X = w * 0.5 + w * 0.15 * Math.sin(time * 0.3);
        bCtx.beginPath();
        bCtx.ellipse(ray1X, h * 0.35, w * 0.125, h * 0.25, 0, 0, Math.PI * 2);
        bCtx.fillStyle = 'white';
        bCtx.fill();

        bCtx.globalAlpha = 0.10;
        const ray2X = w * 0.5 - w * 0.15 * Math.sin(time * 0.3 + 1);
        bCtx.beginPath();
        bCtx.ellipse(ray2X, h * 0.4, w * 0.09, h * 0.2, 0, 0, Math.PI * 2);
        bCtx.fill();
      });
    }

    // 5 lens flare circles
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 6;
      const fx = w * (0.15 + t * 0.7) + 5 * Math.sin(time * 0.5 + i);
      const fy = h * (0.15 + t * 0.7);
      const fr = minDim * (0.03 + i * 0.02);
      const alpha = 0.08 + (i % 3) * 0.02;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    ctx.restore();
  }
}

class OceanAnimation {
  constructor() {
    const mobile = window.innerWidth <= 768;
    const count = mobile ? 5 : 10;
    this.bubbles = [];
    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: 0.1 + Math.random() * 0.8,
        speed: 0.04 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2.5,
        wobble: 0.005 + Math.random() * 0.01
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    const minDim = Math.min(w, h);

    // 4 caustic light patterns
    if (renderer) {
      renderer.drawBlurred((bCtx, w, h) => {
        for (let i = 0; i < 4; i++) {
          const cx = w * (0.2 + i * 0.2) + w * 0.08 * Math.sin(time * 0.4 + i * 1.5);
          const cy = h * (0.1 + i * 0.05);
          const rw = w * (0.2 + i * 0.04);
          const rh = h * (0.05 + i * 0.012);
          const alpha = 0.12 + 0.04 * Math.sin(time * 0.8 + i);
          bCtx.globalAlpha = alpha;
          bCtx.beginPath();
          bCtx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
          bCtx.fillStyle = 'white';
          bCtx.fill();
        }
      });
    }

    // 10 rising bubbles
    ctx.save();
    for (const b of this.bubbles) {
      const y = 1.0 - ((time * b.speed + b.phase) % 1.0);
      const py = y * h;
      const px = b.x * w + Math.sin(time * 2 + b.phase) * w * b.wobble * 10;

      let alpha = 0.20;
      if (y < 0.08) alpha *= y / 0.08;
      if (y > 0.92) alpha *= (1 - y) / 0.08;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, b.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- Task 11: Forest and Aurora animations ---

class ForestAnimation {
  constructor() {
    const mobile = window.innerWidth <= 768;
    const count = mobile ? 4 : 8;
    this.leaves = [];
    for (let i = 0; i < count; i++) {
      this.leaves.push({
        x: Math.random(),
        speed: 0.025 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        size: 10 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        drift: 0.02 + Math.random() * 0.03
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    ctx.save();
    for (const leaf of this.leaves) {
      const y = ((time * leaf.speed + leaf.phase) % 1.0);
      const py = y * h;
      const px = leaf.x * w + Math.sin(time * 0.8 + leaf.phase) * w * leaf.drift;
      const rot = leaf.rotation + time * 0.5;

      let alpha = 0.12;
      if (y < 0.08) alpha *= y / 0.08;
      if (y > 0.92) alpha *= (1 - y) / 0.08;

      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      ctx.rotate(rot);

      const s = leaf.size * scale;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.6, 0, 0, s);
      ctx.quadraticCurveTo(-s * 0.6, 0, 0, -s);
      ctx.fillStyle = 'white';
      ctx.fill();

      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    }
    ctx.restore();
  }
}

class AuroraAnimation {
  constructor() {
    this.bands = [
      { color: 'rgba(0, 255, 150, 0.15)', yBase: 0.3, speed: 0.4, freq: 3 },
      { color: 'rgba(0, 200, 255, 0.12)', yBase: 0.4, speed: 0.35, freq: 2.5 },
      { color: 'rgba(150, 50, 255, 0.14)', yBase: 0.5, speed: 0.3, freq: 4 },
      { color: 'rgba(50, 255, 200, 0.13)', yBase: 0.55, speed: 0.45, freq: 3.5 },
      { color: 'rgba(80, 100, 255, 0.16)', yBase: 0.35, speed: 0.38, freq: 2.8 }
    ];
  }

  update(time, ctx, w, h, scale, renderer) {
    const minDim = Math.min(w, h);
    const segments = 30;
    const thickness = h * 0.12;

    if (renderer) {
      renderer.drawBlurred((bCtx, w, h) => {
        for (const band of this.bands) {
          const yOffset = Math.sin(time * band.speed) * h * 0.05;

          bCtx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * w;
            const y = band.yBase * h + yOffset +
                      Math.sin((i / segments) * band.freq * Math.PI + time * band.speed) * h * 0.04;
            if (i === 0) bCtx.moveTo(x, y);
            else bCtx.lineTo(x, y);
          }
          for (let i = segments; i >= 0; i--) {
            const x = (i / segments) * w;
            const y = band.yBase * h + yOffset + thickness +
                      Math.sin((i / segments) * band.freq * Math.PI + time * band.speed + 1) * h * 0.03;
            bCtx.lineTo(x, y);
          }
          bCtx.closePath();
          bCtx.fillStyle = band.color;
          bCtx.fill();
        }
      });
    }
  }
}

// --- Task 12: Midnight and Desert animations ---

class MidnightAnimation {
  constructor() {
    const mobile = window.innerWidth <= 768;
    this.stars = [];
    // Large bright (8 or 4)
    const largeCount = mobile ? 4 : 8;
    for (let i = 0; i < largeCount; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        size: 2.5 + Math.random() * 0.5,
        peakAlpha: 0.60 + Math.random() * 0.10,
        speed: 0.5 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2
      });
    }
    // Medium (12 or 6)
    const mediumCount = mobile ? 6 : 12;
    for (let i = 0; i < mediumCount; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        size: 1.8 + Math.random() * 0.2,
        peakAlpha: 0.40 + Math.random() * 0.10,
        speed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    // Small dim (15 or 8)
    const smallCount = mobile ? 8 : 15;
    for (let i = 0; i < smallCount; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        size: 1.0 + Math.random() * 0.5,
        peakAlpha: 0.25 + Math.random() * 0.10,
        speed: 1.0 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    ctx.save();
    for (const star of this.stars) {
      const alpha = star.peakAlpha * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
      const px = star.x * w;
      const py = star.y * h;
      const r = star.size * scale;

      // Glow halo (radial gradient for soft blur effect)
      const haloR = r * 3;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, haloR);
      glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.35})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(px, py, haloR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core dot
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class DesertAnimation {
  constructor() {
    const mobile = window.innerWidth <= 768;
    const count = mobile ? 4 : 8;
    this.flowers = [];
    for (let i = 0; i < count; i++) {
      this.flowers.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        petals: 5 + Math.floor(Math.random() * 3),
        innerPetals: 3 + Math.floor(Math.random() * 3),
        bloomSpeed: 0.16 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        size: 20 + Math.random() * 15
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    ctx.save();
    for (const flower of this.flowers) {
      const cycle = (time * flower.bloomSpeed + flower.phase) % (Math.PI * 2);
      const bloom = Math.max(0, Math.sin(cycle));
      const alpha = bloom * 0.12;
      if (alpha < 0.01) continue;

      const px = flower.x * w;
      const py = flower.y * h;
      const s = flower.size * scale;

      ctx.translate(px, py);

      // Outer petals
      for (let i = 0; i < flower.petals; i++) {
        const angle = (i / flower.petals) * Math.PI * 2;
        const petalBloom = Math.max(0, bloom - i * 0.03);
        const spread = petalBloom * angle;

        ctx.save();
        ctx.rotate(spread);
        ctx.globalAlpha = alpha * (0.3 + petalBloom * 0.7);
        ctx.beginPath();
        ctx.ellipse(0, -s * petalBloom * 0.6, s * 0.15, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
      }

      // Center dot
      ctx.globalAlpha = alpha * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    }
    ctx.restore();
  }
}

// Instantiate global renderer (animations are lazily resolved in init())
window.backgroundRenderer = new BackgroundRenderer();
