// main.js - App initialization, dynamic content loading, and scroll animations
// Loads features and reviews from JSON and implements scroll-based animations

/**
 * Main initialization function
 *
 * Loads all dynamic content and initializes animations
 * Waits for i18n to be ready before loading content
 */
async function init() {
  console.log('Initializing Coins website...');

  try {
    // Wait a bit for i18n to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    await loadFeatures();
    await loadReviews();
    initScrollAnimations();
    initLucideIcons();
    initTransactionBadges();

    console.log('Website initialized successfully');
  } catch (error) {
    console.error('Error initializing website:', error);
  }
}

/**
 * Load features from JSON and render to DOM
 *
 * Fetches features.json and creates feature cards dynamically
 * based on the current language
 */
async function loadFeatures() {
  try {
    const response = await fetch('./data/features.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const featuresData = await response.json();
    const currentLang = window.i18n ? window.i18n.currentLanguage : 'en';
    const features = featuresData[currentLang] || featuresData['en'];

    const featuresGrid = document.getElementById('features-grid');
    if (!featuresGrid) {
      console.error('Features grid not found');
      return;
    }

    featuresGrid.innerHTML = '';

    features.forEach((feature, index) => {
      const card = document.createElement('div');
      card.className = 'feature-card';
      card.style.transitionDelay = `${index * 0.1}s`;

      // Escape HTML to prevent XSS
      const titleEscaped = escapeHtml(feature.title);
      const descriptionEscaped = escapeHtml(feature.description);

      card.innerHTML = `
        <i data-lucide="${feature.icon}" class="icon" aria-hidden="true"></i>
        <h3>${titleEscaped}</h3>
        <p>${descriptionEscaped}</p>
      `;

      featuresGrid.appendChild(card);
    });

    // Re-initialize Lucide icons for newly added cards
    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log(`Loaded ${features.length} features for language: ${currentLang}`);
  } catch (error) {
    console.error('Failed to load features:', error);
  }
}

/**
 * Load reviews from JSON and render to DOM
 *
 * Fetches reviews.json and creates review cards dynamically
 * with translations for the current language
 * Splits reviews into two rows for horizontal scrolling animation
 */
async function loadReviews() {
  try {
    const response = await fetch('./data/reviews.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reviewsData = await response.json();
    const currentLang = window.i18n ? window.i18n.currentLanguage : 'en';
    const reviews = reviewsData.reviews;

    const row1 = document.getElementById('reviews-row-1');
    const row2 = document.getElementById('reviews-row-2');

    if (!row1 || !row2) {
      console.error('Reviews rows not found');
      return;
    }

    row1.innerHTML = '';
    row2.innerHTML = '';

    // Check if mobile view
    const isMobile = window.innerWidth <= 768;

    // On mobile, put all reviews in row1; on desktop, alternate between rows
    reviews.forEach((review, index) => {
      const translation = review.translations[currentLang] || review.translations['en'];

      const card = document.createElement('div');
      card.className = 'review-card';

      // Generate star rating
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

      // Escape HTML to prevent XSS
      const authorEscaped = escapeHtml(review.author);
      const titleEscaped = escapeHtml(translation.title);
      const textEscaped = escapeHtml(translation.text);
      const dateFormatted = formatDate(review.date);

      card.innerHTML = `
        <div class="review-header">
          <span class="review-author">${authorEscaped}</span>
          <span class="review-date">${dateFormatted}</span>
        </div>
        <div class="review-rating" aria-label="${review.rating} out of 5 stars">${stars}</div>
        <h4 class="review-title">${titleEscaped}</h4>
        <p class="review-text">${textEscaped}</p>
      `;

      if (isMobile) {
        // On mobile, put all reviews in the first row
        row1.appendChild(card);
      } else {
        // On desktop, alternate between rows
        if (index % 2 === 0) {
          row1.appendChild(card);
        } else {
          row2.appendChild(card);
        }
      }
    });

    // Duplicate cards for seamless infinite scroll on desktop only
    // On mobile (≤768px), no duplication needed as it's manually scrollable
    if (!isMobile) {
      // Store original content
      const row1Content = row1.innerHTML;
      const row2Content = row2.innerHTML;

      // Duplicate content 3 times for smoother animation on desktop
      row1.innerHTML = row1Content + row1Content + row1Content;
      row2.innerHTML = row2Content + row2Content + row2Content;
    }

    console.log(`Loaded ${reviews.length} reviews for language: ${currentLang}`);
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

/**
 * Format date based on current language
 *
 * Uses Intl.DateTimeFormat for locale-aware date formatting
 *
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const lang = window.i18n ? window.i18n.currentLanguage : 'en';

    // Map our language codes to valid locale codes
    const localeMap = {
      'en': 'en-US',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'it': 'it-IT',
      'ja': 'ja-JP',
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW'
    };

    const locale = localeMap[lang] || 'en-US';

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Escape HTML to prevent XSS attacks
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize scroll animations using Intersection Observer
 *
 * Uses Intersection Observer API for better performance than scroll events
 * Animates feature cards when they enter the viewport
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Observe feature cards only (reviews use horizontal scroll animation)
  document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
  });

  console.log('Scroll animations initialized');
}

/**
 * Initialize Lucide icons
 *
 * Converts data-lucide attributes to SVG icons
 * Must be called after adding new icons to the DOM
 */
function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    console.log('Lucide icons initialized');
  } else {
    console.error('Lucide icons library not loaded');
  }
}

/**
 * Get translated text for a transaction key
 *
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function getTransactionText(key) {
  if (window.i18n && window.i18n.translations && window.i18n.translations.transactions) {
    return window.i18n.translations.transactions[key] || key;
  }
  return key;
}

/**
 * Sample transaction data for animated badges
 *
 * Array of sample transactions to display as floating badges
 * Each has an emoji, translation key, amount, and type (expense/income)
 */
const sampleTransactions = [
  // Food & Dining
  { emoji: '☕', key: 'coffee', amount: 5, type: 'expense' },
  { emoji: '🍕', key: 'pizza', amount: 15, type: 'expense' },
  { emoji: '🍔', key: 'burger', amount: 12, type: 'expense' },
  { emoji: '🍜', key: 'ramen', amount: 14, type: 'expense' },
  { emoji: '🍱', key: 'bento', amount: 11, type: 'expense' },
  { emoji: '🥗', key: 'salad', amount: 13, type: 'expense' },
  { emoji: '🍰', key: 'dessert', amount: 8, type: 'expense' },
  { emoji: '🍺', key: 'drinks', amount: 22, type: 'expense' },
  { emoji: '🍿', key: 'snacks', amount: 6, type: 'expense' },

  // Transportation
  { emoji: '🚇', key: 'metro', amount: 20, type: 'expense' },
  { emoji: '🚕', key: 'taxi', amount: 18, type: 'expense' },
  { emoji: '🚗', key: 'uber', amount: 25, type: 'expense' },
  { emoji: '⛽', key: 'gas', amount: 45, type: 'expense' },
  { emoji: '🅿️', key: 'parking', amount: 15, type: 'expense' },
  { emoji: '✈️', key: 'flight', amount: 320, type: 'expense' },
  { emoji: '🚲', key: 'bikeShare', amount: 3, type: 'expense' },

  // Shopping
  { emoji: '🛒', key: 'groceries', amount: 80, type: 'expense' },
  { emoji: '👕', key: 'clothing', amount: 65, type: 'expense' },
  { emoji: '👟', key: 'sneakers', amount: 120, type: 'expense' },
  { emoji: '💄', key: 'cosmetics', amount: 35, type: 'expense' },
  { emoji: '🎒', key: 'backpack', amount: 55, type: 'expense' },
  { emoji: '📱', key: 'phoneCase', amount: 25, type: 'expense' },
  { emoji: '🎧', key: 'headphones', amount: 85, type: 'expense' },

  // Entertainment
  { emoji: '🎬', key: 'movie', amount: 12, type: 'expense' },
  { emoji: '🎮', key: 'games', amount: 30, type: 'expense' },
  { emoji: '🎵', key: 'concert', amount: 75, type: 'expense' },
  { emoji: '🎨', key: 'artSupplies', amount: 28, type: 'expense' },
  { emoji: '🎪', key: 'event', amount: 40, type: 'expense' },
  { emoji: '🎯', key: 'activities', amount: 35, type: 'expense' },

  // Health & Fitness
  { emoji: '🏋️', key: 'gym', amount: 50, type: 'expense' },
  { emoji: '🏥', key: 'doctor', amount: 100, type: 'expense' },
  { emoji: '💊', key: 'pharmacy', amount: 32, type: 'expense' },
  { emoji: '🧘', key: 'yoga', amount: 25, type: 'expense' },
  { emoji: '💇', key: 'haircut', amount: 45, type: 'expense' },

  // Education & Work
  { emoji: '📚', key: 'books', amount: 25, type: 'expense' },
  { emoji: '📓', key: 'notebook', amount: 8, type: 'expense' },
  { emoji: '🖊️', key: 'stationery', amount: 12, type: 'expense' },
  { emoji: '💻', key: 'software', amount: 15, type: 'expense' },
  { emoji: '🎓', key: 'course', amount: 99, type: 'expense' },

  // Bills & Utilities
  { emoji: '💡', key: 'electricity', amount: 85, type: 'expense' },
  { emoji: '📶', key: 'internet', amount: 60, type: 'expense' },
  { emoji: '📞', key: 'phoneBill', amount: 45, type: 'expense' },
  { emoji: '🏠', key: 'rent', amount: 1200, type: 'expense' },
  { emoji: '💧', key: 'water', amount: 35, type: 'expense' },

  // Pets
  { emoji: '🐕', key: 'dogFood', amount: 40, type: 'expense' },
  { emoji: '🐈', key: 'catToys', amount: 18, type: 'expense' },
  { emoji: '🐾', key: 'vet', amount: 120, type: 'expense' },

  // Income
  { emoji: '💰', key: 'salary', amount: 3000, type: 'income' },
  { emoji: '💵', key: 'bonus', amount: 500, type: 'income' },
  { emoji: '💻', key: 'freelance', amount: 450, type: 'income' },
  { emoji: '🎁', key: 'gift', amount: 100, type: 'income' },
  { emoji: '📈', key: 'investment', amount: 250, type: 'income' },
  { emoji: '🏆', key: 'prize', amount: 150, type: 'income' },
  { emoji: '💼', key: 'contract', amount: 800, type: 'income' },
  { emoji: '🎯', key: 'commission', amount: 200, type: 'income' },

  // Misc
  { emoji: '🎀', key: 'gifts', amount: 50, type: 'expense' },
  { emoji: '🌸', key: 'flowers', amount: 28, type: 'expense' },
  { emoji: '🧺', key: 'laundry', amount: 15, type: 'expense' },
  { emoji: '🔧', key: 'repairs', amount: 65, type: 'expense' },
  { emoji: '🌱', key: 'plants', amount: 22, type: 'expense' },
  { emoji: '🕯️', key: 'candles', amount: 18, type: 'expense' }
];

// Track if badges are currently running to prevent multiple instances
let badgesRunning = false;

/**
 * Initialize animated transaction badges
 *
 * Creates floating transaction badges that randomly appear and disappear
 * around the app icon to show dynamic expense/income tracking
 */
function initTransactionBadges() {
  const container = document.getElementById('transaction-badges');
  if (!container) {
    console.error('Transaction badges container not found');
    return;
  }

  // Prevent multiple instances from running
  if (badgesRunning) {
    return;
  }
  badgesRunning = true;

  /**
   * Create and animate a single transaction badge
   *
   * Randomly selects a transaction, creates a badge element,
   * positions it randomly, applies animation, and removes it when done
   */
  function createBadge() {
    const transaction = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];
    const badge = document.createElement('div');
    badge.className = `transaction-badge ${transaction.type}`;

    // Format amount with currency symbol
    const amountFormatted = transaction.type === 'expense'
      ? `-$${transaction.amount}`
      : `+$${transaction.amount}`;

    // Get translated text for the transaction
    const text = getTransactionText(transaction.key);

    badge.innerHTML = `
      <span class="emoji">${transaction.emoji}</span>
      <span>${text}</span>
      <span class="amount">${amountFormatted}</span>
    `;

    // Random position in a larger area, strongly biased towards upper area
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 250; // 150-400px from center
    const x = Math.cos(angle) * distance;
    // Strong bias towards upper positions - shift up by 100px
    const y = Math.sin(angle) * distance - 100;

    badge.style.left = `calc(50% + ${x}px)`;
    badge.style.top = `calc(50% + ${y}px)`;
    badge.style.transform = 'translate(-50%, -50%)';

    // Random animation variant
    const animationVariant = Math.floor(Math.random() * 3) + 1;
    const duration = 4 + Math.random() * 2; // 4-6 seconds
    badge.style.animation = `floatUp${animationVariant} ${duration}s ease-out forwards`;

    // Random opacity for more dynamic appearance (0.4 to 0.7)
    const maxOpacity = 0.4 + Math.random() * 0.3;
    badge.style.setProperty('--max-opacity', maxOpacity);

    container.appendChild(badge);

    // Remove badge after animation completes
    setTimeout(() => {
      badge.remove();
    }, duration * 1000);
  }

  // Create more initial badges for a more dynamic appearance
  for (let i = 0; i < 10; i++) {
    setTimeout(() => createBadge(), i * 600);
  }

  // Continuously create new badges at random intervals
  function scheduleBadge() {
    if (!badgesRunning) return; // Stop if badges were stopped
    const delay = 1000 + Math.random() * 2000; // 1-3 seconds between badges
    setTimeout(() => {
      if (!badgesRunning) return; // Stop if badges were stopped
      createBadge();
      scheduleBadge();
    }, delay);
  }

  scheduleBadge();

  console.log('Transaction badges initialized');
}

/**
 * Reload content when language changes
 *
 * Listens for languageChanged event from i18n.js
 * and reloads features and reviews with new language
 */
window.addEventListener('languageChanged', async (event) => {
  console.log('Language changed to:', event.detail.language);

  await loadFeatures();
  await loadReviews();

  // Re-observe feature cards for scroll animations
  initScrollAnimations();

  // Clear and restart transaction badges with new language
  const container = document.getElementById('transaction-badges');
  if (container) {
    // Stop current badges animation
    badgesRunning = false;
    // Clear all existing badges
    container.innerHTML = '';
    // Restart with new language
    initTransactionBadges();
  }
});

/**
 * Handle window resize to reload reviews when switching between mobile/desktop
 *
 * Tracks previous width to only reload when crossing the 768px breakpoint
 */
let previousWidth = window.innerWidth;
window.addEventListener('resize', async () => {
  const currentWidth = window.innerWidth;
  const wasMobile = previousWidth <= 768;
  const isMobile = currentWidth <= 768;

  // Only reload if we crossed the mobile/desktop boundary
  if (wasMobile !== isMobile) {
    await loadReviews();
    previousWidth = currentWidth;
  }
});

/**
 * Initialize when DOM is ready
 *
 * Checks document.readyState to ensure DOM is fully loaded
 * before initializing the application
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
