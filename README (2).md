# ⚡ EV Charging Queue

A modern, production-ready Progressive Web App for managing EV charging spots at workplace charging stations.

## 🚀 Features

- ✅ **Real-time queue management** via Firebase
- ✅ **Discord notifications** with @mentions
- ✅ **PWA support** - install on iOS/Android
- ✅ **Offline mode** with Service Worker
- ✅ **Modern UX** - Toast notifications, custom modals
- ✅ **Production-ready** - Tests, validation, security

## 📁 Project Structure

```
ev-charging-queue/
├── index.html              # Main HTML
├── discord-id-guide.html   # Discord ID help page
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline)
├── firestore.rules         # Firestore Security Rules
├── package.json            # NPM config (tests only)
├── vitest.config.js        # Test config
│
├── css/
│   └── styles.css          # All styles
│
├── js/
│   ├── main.js             # Entry point
│   ├── app.js              # Main app logic
│   ├── config.js           # Configuration
│   ├── logger.js           # Conditional logger
│   ├── validation.js       # Input validation
│   ├── toast.js            # Toast notifications
│   ├── modal.js            # Modal dialogs
│   ├── discord.js          # Discord notifications
│   ├── firestore.js        # Firestore operations
│   ├── queue.js            # Queue logic (pure)
│   └── render.js           # UI rendering
│
├── images/
│   ├── eclair.png          # App icon
│   ├── discord-step1.png   # Discord guide
│   ├── discord-step2.png
│   └── discord-step3.png
│
└── tests/
    ├── validation.test.js
    ├── queue.test.js
    ├── discord.test.js
    ├── logger.test.js
    └── toast.test.js
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+ (for tests only - deployment is static)

### Install

```bash
git clone https://github.com/groekens/ev-charging-queue.git
cd ev-charging-queue
npm install
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# UI mode
npm run test:ui
```

**Current coverage:** 98% on business logic modules

## 🚀 Deployment

### GitHub Pages (current)

Just push to `main` branch - GitHub Pages auto-deploys.

```bash
git add .
git commit -m "Your changes"
git push
```

URL: `https://groekens.github.io/ev-charging-queue/`

### Firestore Security Rules

Deploy security rules from `firestore.rules`:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## 🔧 Configuration

All configuration is in `js/config.js`:

```javascript
export const CONFIG = {
    MAX_SPOTS: { LLN1: 1, LLN2: 4 },
    REMINDER_DELAY_MS: 15 * 60 * 1000,
    // ...
};
```

## 🛡️ Security

- ✅ Webhook Discord obfuscated (Base64)
- ✅ Firestore Security Rules with schema validation
- ✅ HTML escaping (anti-XSS)
- ✅ Input validation (Xgram, Discord ID)
- ✅ HTTPS only (via GitHub Pages)

## 📊 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Backend**: Firebase Firestore (real-time DB)
- **Notifications**: Discord Webhooks
- **Hosting**: GitHub Pages (free)
- **Testing**: Vitest + jsdom
- **PWA**: Service Worker, Web App Manifest

## 🤝 Contributing

This is an internal tool, but suggestions welcome via issues.

## 📝 License

MIT - See LICENSE file
