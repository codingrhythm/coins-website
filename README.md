# Coins Website

Official marketing website for the Coins expense tracker app.

## Features

- Single-page design with smooth scroll animations
- 8 language support with auto-detection (en, de, fr, es, it, ja, zh-Hans, zh-Hant)
- SEO-optimized with schema.org markup
- Mobile-responsive design
- User reviews section with dynamic content
- App Store download badges (localized)
- Privacy-first design (no tracking, no cookies)

## Tech Stack

- Pure HTML/CSS/JavaScript (no build tools, no dependencies)
- [Lucide Icons](https://lucide.dev/) for feature icons
- Vanilla JavaScript i18n for translations
- Intersection Observer API for scroll animations
- CSS Grid and Flexbox for responsive layout

## Development

### Quick Start

1. Clone the repository
2. Open `index.html` in a web browser

### Local Development Server

For local development with proper CORS support and live reload:

```bash
# Using Python 3 (built-in)
python3 -m http.server 8501

# Using Node.js serve
npx serve

# Using PHP (if installed)
php -S localhost:8501
```

Then visit http://localhost:8501

## File Structure

```
website/
├── index.html              # Main single-page website
├── privacy-policy.html     # Privacy policy page
├── sitemap.xml            # SEO sitemap
├── robots.txt             # Search engine directives
├── README.md              # This file
├── assets/                # Images and badges
│   ├── icon.png          # App icon (120x120)
│   └── app-store-badges/ # Localized App Store badges
│       ├── en.svg
│       ├── de.svg
│       ├── fr.svg
│       ├── es.svg
│       ├── it.svg
│       ├── ja.svg
│       ├── zh-Hans.svg
│       └── zh-Hant.svg
├── styles/                # CSS files
│   └── main.css          # All styles (variables, layout, animations)
├── scripts/               # JavaScript files
│   ├── i18n.js           # Translation engine
│   └── main.js           # App initialization and dynamic content
└── data/                  # JSON content files
    ├── translations.json  # UI strings for all languages
    ├── features.json      # Feature descriptions
    └── reviews.json       # User reviews with translations
```

## Content Management

### Adding or Updating Translations

Edit `data/translations.json` to update UI strings:

```json
{
  "en": {
    "hero": {
      "title": "Coins",
      "subtitle": "Simple, Smart Expense Tracking"
    }
  },
  "de": {
    "hero": {
      "title": "Coins",
      "subtitle": "Einfaches, Smartes Ausgaben-Tracking"
    }
  }
}
```

### Adding Features

Edit `data/features.json`:

```json
{
  "en": [
    {
      "icon": "zap",
      "title": "Feature Title",
      "description": "Feature description"
    }
  ]
}
```

Available icons: See [Lucide Icons](https://lucide.dev/icons/)

### Adding Reviews

Edit `data/reviews.json`:

```json
{
  "reviews": [
    {
      "id": "unique-id",
      "originalLanguage": "en",
      "author": "User Name",
      "date": "2026-01-29",
      "rating": 5,
      "translations": {
        "en": {
          "title": "Review Title",
          "text": "Review text"
        }
      }
    }
  ]
}
```

## Deployment

### Before Deployment

1. **Update domain name** in `sitemap.xml` and `robots.txt`:
   - Replace `https://coins-app.com/` with your actual domain

2. **Update schema.org** in `index.html` if needed:
   - Update review count, rating, etc.

3. **Verify all App Store badges** are official Apple assets:
   - Download from [Apple Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)

### Deployment Options

#### GitHub Pages

```bash
# Push to GitHub
git add .
git commit -m "Update website"
git push origin main

# Enable GitHub Pages in repository settings
# Set source to main branch, / (root) folder
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Static Hosting (Any)

Upload all files to your web server's public directory.

## Performance

### Targets

- Lighthouse Performance: 90+
- Lighthouse SEO: 90+
- Lighthouse Accessibility: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

### Optimization Tips

1. **Images**: App icon is already optimized at 120x120
2. **Lazy Loading**: Images use `loading="eager"` for above-fold, `loading="lazy"` for below-fold
3. **CSS**: Single CSS file, minify for production
4. **JavaScript**: Vanilla JS, no heavy frameworks
5. **Fonts**: Uses system fonts for instant rendering

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

## SEO

### Checklist

- [x] Meta description on all pages
- [x] Schema.org JSON-LD markup
- [x] sitemap.xml
- [x] robots.txt
- [x] Open Graph tags for social sharing
- [x] Semantic HTML5 (section, header, footer)
- [x] Proper heading hierarchy (h1 → h2 → h3)
- [x] Alt text for all images

### Testing SEO

1. **Schema.org validation**: https://validator.schema.org/
2. **HTML validation**: https://validator.w3.org/
3. **Lighthouse audit**: Chrome DevTools → Lighthouse tab
4. **Mobile-friendly test**: https://search.google.com/test/mobile-friendly

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Focus visible styles for keyboard users
- Respects `prefers-reduced-motion`
- Semantic HTML structure

## Internationalization (i18n)

### Supported Languages

1. English (en)
2. German (de)
3. French (fr)
4. Spanish (es)
5. Italian (it)
6. Japanese (ja)
7. Simplified Chinese (zh-Hans)
8. Traditional Chinese (zh-Hant)

### How It Works

1. **Auto-detection**: Detects browser language on first visit
2. **Persistence**: Saves user preference to localStorage
3. **Manual switching**: Language selector in top-right corner
4. **Dynamic content**: Features and reviews update when language changes
5. **App Store badge**: Updates to match selected language

### Adding a New Language

1. Add language code to `supportedLanguages` in `scripts/i18n.js`
2. Add translations to `data/translations.json`
3. Add features to `data/features.json`
4. Add review translations to `data/reviews.json`
5. Add option to language selector in `index.html`
6. Download App Store badge for that language

## Troubleshooting

### Website not loading

- Check browser console for errors
- Ensure you're using a local server (not file://)
- Verify all JSON files are valid

### Translations not showing

- Check `data/translations.json` is valid JSON
- Open browser console and look for i18n errors
- Verify language code matches in all files

### Icons not appearing

- Check internet connection (Lucide loads from CDN)
- Verify icon names in `data/features.json` match Lucide icon names
- Check browser console for errors

### App Store badges not updating

- Verify badge files exist in `assets/app-store-badges/`
- Check browser console for 404 errors
- Ensure filenames match language codes exactly (e.g., `zh-Hans.svg`, not `zh-hans.svg`)

## License

© 2026 Coins. All rights reserved.

## Credits

- Icons by [Lucide](https://lucide.dev/)
- App Store badges from [Apple Developer](https://developer.apple.com/app-store/marketing/guidelines/)
- Design inspired by the Coins iOS app