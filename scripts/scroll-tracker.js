// scroll-tracker.js — Tracks which section is in focus and computes blend factors

class ScrollTracker {
  constructor() {
    this.sections = [];
    this.focusedIndex = 0;
    this.blendFactor = 0;
    this.blendDirection = 1;
    this.onFocusChange = null;
    this._ratios = [];
  }

  init() {
    this.sections = Array.from(document.querySelectorAll('.section'));
    this._ratios = new Array(this.sections.length).fill(0);

    const thresholds = [];
    for (let i = 0; i <= 20; i++) thresholds.push(i / 20);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = this.sections.indexOf(entry.target);
        if (idx !== -1) {
          this._ratios[idx] = entry.intersectionRatio;
        }
      });
      this._updateFocus();
    }, { threshold: thresholds });

    this.sections.forEach(s => observer.observe(s));

    this.sections.forEach((section, i) => {
      const indicator = section.querySelector('.scroll-indicator');
      if (indicator && i < this.sections.length - 1) {
        indicator.addEventListener('click', () => {
          this.sections[i + 1].scrollIntoView({ behavior: 'smooth' });
        });
      }
    });

    window.addEventListener('scroll', () => {
      const atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 100);
      document.querySelectorAll('.scroll-indicator').forEach(ind => {
        ind.style.opacity = atBottom ? '0' : '1';
        ind.style.transition = 'opacity 0.3s ease';
      });
    });
  }

  _updateFocus() {
    let maxRatio = 0;
    let maxIdx = this.focusedIndex;
    for (let i = 0; i < this._ratios.length; i++) {
      if (this._ratios[i] > maxRatio) {
        maxRatio = this._ratios[i];
        maxIdx = i;
      }
    }

    const oldIndex = this.focusedIndex;
    this.focusedIndex = maxIdx;

    this.blendFactor = 1.0 - Math.min(maxRatio / 0.6, 1.0);

    const prevRatio = maxIdx > 0 ? this._ratios[maxIdx - 1] : 0;
    const nextRatio = maxIdx < this._ratios.length - 1 ? this._ratios[maxIdx + 1] : 0;
    this.blendDirection = nextRatio >= prevRatio ? 1 : -1;

    if (oldIndex !== this.focusedIndex && this.onFocusChange) {
      this.onFocusChange(this.focusedIndex, oldIndex);
    }
  }
}

window.scrollTracker = new ScrollTracker();
