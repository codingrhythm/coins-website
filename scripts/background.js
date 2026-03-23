// background.js — Canvas background system with gradient interpolation + theme animations

// Section gradient definitions matching spec
const SECTION_GRADIENTS = [
  // sunsetGlow (Hero) — matches app: coral red → tangerine → deep rose → dark purple
  [{ r: 255, g: 107, b: 107 }, { r: 238, g: 90, b: 36 }, { r: 196, g: 69, b: 105 }, { r: 108, g: 44, b: 112 }],
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
    this.reducedMotion = false;
    this._prevFocused = -1;
    this._animOpacity = 1;
    this._fadeTarget = null;
  }

  init() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._resize();
    window.addEventListener('resize', () => this._resize());

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

// --- Task 10: SunsetGlow and Ocean animations ---

class SunsetGlowAnimation {
  update() {
    // No overlay animation for hero — gradient only
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
        spiralRadius: 0.01 + Math.random() * 0.015,
        spiralSpeed: 2.0 + Math.random() * 1.5
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    // Spiral-rising bubbles
    ctx.save();
    for (const b of this.bubbles) {
      const y = 1.0 - ((time * b.speed + b.phase) % 1.0);
      const py = y * h;
      // Spiral motion: circular offset that increases with rise
      const spiralAngle = time * b.spiralSpeed + b.phase;
      const px = b.x * w + Math.sin(spiralAngle) * w * b.spiralRadius;

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
    const mobile = window.innerWidth <= 768;
    const count = mobile ? 6 : 12;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: 0.2 + Math.random() * 0.6,
        speed: 0.01 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2
      });
    }
  }

  update(time, ctx, w, h, scale, renderer) {
    ctx.save();
    for (const p of this.particles) {
      const px = ((p.x + time * p.speed) % 1.0) * w;
      const py = p.y * h + Math.sin(time * 0.5 + p.phase) * h * 0.02;
      const alpha = 0.15 + 0.05 * Math.sin(time * 0.8 + p.phase);

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    ctx.restore();
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
