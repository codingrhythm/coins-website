// i18n.js - Translation engine for Coins website
// Handles language detection, loading, and switching

class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.supportedLanguages = ['en', 'de', 'fr', 'es', 'it', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'ru'];
  }

  /**
   * Map browser language codes to our supported locales
   *
   * Handles browser language codes like "en-US", "zh-CN", "zh-TW"
   * and maps them to our locale codes: "en", "zh-Hans", "zh-Hant"
   *
   * @param {string} browserLang - Browser language code from navigator.language
   * @returns {string} Mapped language code
   */
  mapBrowserLanguage(browserLang) {
    const langCode = browserLang.toLowerCase();

    // Map common browser language codes to our supported locales
    const langMap = {
      'en': 'en',
      'en-us': 'en',
      'en-gb': 'en',
      'de': 'de',
      'de-de': 'de',
      'fr': 'fr',
      'fr-fr': 'fr',
      'es': 'es',
      'es-es': 'es',
      'it': 'it',
      'it-it': 'it',
      'ja': 'ja',
      'ja-jp': 'ja',
      'zh-cn': 'zh-Hans',
      'zh-hans': 'zh-Hans',
      'zh-hans-cn': 'zh-Hans',
      'zh-tw': 'zh-Hant',
      'zh-hant': 'zh-Hant',
      'zh-hant-tw': 'zh-Hant',
      'zh-hk': 'zh-Hant',
      'zh': 'zh-Hans', // Default Chinese to Simplified
      'ko': 'ko',
      'ko-kr': 'ko',
      'ru': 'ru',
      'ru-ru': 'ru'
    };

    // Try exact match first
    if (langMap[langCode]) {
      return langMap[langCode];
    }

    // Try language prefix (e.g., "en" from "en-US")
    const prefix = langCode.split('-')[0];
    if (langMap[prefix]) {
      return langMap[prefix];
    }

    // Default to English
    return 'en';
  }

  /**
   * Detect browser language
   *
   * Uses navigator.language or navigator.userLanguage to detect
   * the user's preferred language, then maps it to our supported locales
   *
   * @returns {string} Detected language code
   */
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const detectedLang = this.mapBrowserLanguage(browserLang);

    // Check if language is supported
    return this.supportedLanguages.includes(detectedLang) ? detectedLang : 'en';
  }

  /**
   * Load translations from JSON file
   *
   * Fetches translations.json and stores it for later use
   *
   * @returns {Promise<void>}
   */
  async loadTranslations() {
    try {
      const response = await fetch('./data/translations.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.translations = await response.json();
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to default translations
      this.translations = {
        'en': {
          'hero': {
            'title': 'Coins',
            'subtitle': 'Simple, Smart Expense Tracking',
            'description': 'Track your expenses in just 30 seconds a day'
          }
        }
      };
    }
  }

  /**
   * Get translated text for a given key
   *
   * Retrieves translation using dot notation (e.g., "hero.title")
   *
   * @param {string} key - Translation key in dot notation
   * @param {string} lang - Language code (defaults to current language)
   * @returns {string} Translated text or key if not found
   */
  t(key, lang = this.currentLanguage) {
    const keys = key.split('.');
    let value = this.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation not found for key: ${key} in language: ${lang}`);
        return key; // Return key if translation not found
      }
    }

    return value || key;
  }

  /**
   * Switch to a different language
   *
   * Updates all UI text, App Store badge, and saves preference
   *
   * @param {string} lang - Language code to switch to
   * @returns {Promise<void>}
   */
  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported, falling back to English`);
      lang = 'en';
    }

    this.currentLanguage = lang;

    // Update HTML lang attribute for accessibility and SEO
    document.documentElement.lang = lang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation && translation !== key) {
        element.textContent = translation;
      }
    });

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descKey = metaDescription.getAttribute('data-i18n-content');
      if (descKey) {
        metaDescription.setAttribute('content', this.t(descKey));
      }
    }

    // Update page title
    const titleKey = 'meta.title';
    const titleTranslation = this.t(titleKey);
    if (titleTranslation && titleTranslation !== titleKey) {
      document.title = titleTranslation;
    }

    // Update language selector
    const selector = document.getElementById('language-select');
    if (selector) {
      selector.value = lang;
    }

    // Update App Store badge
    this.updateAppStoreBadge(lang);

    // Save preference to localStorage
    localStorage.setItem('preferredLanguage', lang);

    // Trigger custom event for other components to react
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: lang }
    }));

    console.log(`Language switched to: ${lang}`);
  }

  /**
   * Update App Store badge based on current language
   *
   * Changes the badge image to match the selected language
   *
   * @param {string} lang - Language code
   */
  updateAppStoreBadge(lang) {
    const badge = document.querySelector('#app-store-badge img');
    if (badge) {
      badge.src = `./assets/app-store-badges/${lang}.svg`;
      badge.alt = this.t('hero.cta');
    }
  }

  /**
   * Initialize the i18n system
   *
   * Loads translations, detects or restores language, and sets up event listeners
   *
   * @returns {Promise<void>}
   */
  async init() {
    console.log('Initializing i18n system...');

    // Load translations first
    await this.loadTranslations();

    // Check for saved preference, otherwise detect language
    const savedLang = localStorage.getItem('preferredLanguage');
    const initialLang = savedLang || this.detectLanguage();

    console.log(`Detected/saved language: ${initialLang}`);

    // Set initial language
    await this.setLanguage(initialLang);

    // Setup language selector event listener
    const selector = document.getElementById('language-select');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }

    console.log('i18n system initialized');
  }
}

// Create and export global instance
window.i18n = new I18n();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.i18n.init());
} else {
  window.i18n.init();
}
