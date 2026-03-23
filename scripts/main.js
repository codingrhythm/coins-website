// main.js — App initialization, reviews loading, content animations

async function init() {
  await new Promise(resolve => setTimeout(resolve, 100));

  if (window.scrollTracker) {
    window.scrollTracker.init();
  }

  if (window.backgroundRenderer) {
    window.backgroundRenderer.init();
  }

  await loadReviews();
  initContentAnimations();
}

async function loadReviews() {
  try {
    const response = await fetch('./data/reviews.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reviewsData = await response.json();
    const currentLang = window.i18n ? window.i18n.currentLanguage : 'en';
    const reviews = reviewsData.reviews;

    const row = document.getElementById('reviews-row');
    if (!row) return;

    row.innerHTML = '';
    const isMobile = window.innerWidth <= 768;

    reviews.forEach(review => {
      const translation = review.translations[currentLang] || review.translations['en'];
      const card = document.createElement('div');
      card.className = 'review-card';

      const stars = '\u2605'.repeat(review.rating) + '\u2606'.repeat(5 - review.rating);
      card.innerHTML = `
        <div class="review-header">
          <span class="review-author">${escapeHtml(review.author)}</span>
          <span class="review-date">${formatDate(review.date)}</span>
        </div>
        <div class="review-rating" aria-label="${review.rating} out of 5 stars">${stars}</div>
        <h4 class="review-title">${escapeHtml(translation.title)}</h4>
        <p class="review-text">${escapeHtml(translation.text)}</p>
      `;
      row.appendChild(card);
    });

    if (!isMobile) {
      row.innerHTML += row.innerHTML;
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const lang = window.i18n ? window.i18n.currentLanguage : 'en';
    const localeMap = {
      'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES',
      'it': 'it-IT', 'ja': 'ja-JP', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW',
      'ko': 'ko-KR', 'ru': 'ru-RU'
    };
    return date.toLocaleDateString(localeMap[lang] || 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return dateString; }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initContentAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.section').forEach(s => observer.observe(s));
}

window.addEventListener('languageChanged', async () => {
  await loadReviews();
});

let prevWidth = window.innerWidth;
window.addEventListener('resize', async () => {
  const w = window.innerWidth;
  if ((prevWidth <= 768) !== (w <= 768)) {
    await loadReviews();
    prevWidth = w;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
