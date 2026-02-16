# ⚡ EV Charging Queue - Frontend

This is the frontend application for the EV Charging Queue management system.

## 🚀 Deployment

This frontend is designed to be hosted on **GitHub Pages** and connects to a backend API running on a Raspberry Pi at home, exposed via **Cloudflare Tunnel**.

## 📁 Files

- `index.html` - Main application (PWA)
- `config.js` - **IMPORTANT**: API endpoint configuration
- `sw.js` - Service Worker for push notifications
- `manifest.json` - PWA manifest

## ⚙️ Configuration

### Before deploying, update `config.js`:

```javascript
window.API_CONFIG = {
    API_BASE_URL: 'https://your-cloudflare-tunnel-url.trycloudflare.com/api'
};
```

Replace with your actual Cloudflare Tunnel URL.

## 📦 How to deploy to GitHub Pages

1. Create a new GitHub repository
2. Clone this folder
3. **Update `config.js` with your API URL**
4. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/ev-charging-queue.git
   git push -u origin main
   ```
5. Enable GitHub Pages in repository settings (Settings → Pages → Source: main branch)
6. Your app will be available at: `https://your-username.github.io/ev-charging-queue/`

## 📱 Features

- ✅ Progressive Web App (installable on mobile)
- ✅ Push notifications (even when app is closed)
- ✅ Real-time queue management
- ✅ Multi-site support (LLN1 & LLN2)
- ✅ Responsive design

## 🔗 Backend

The backend runs on a Raspberry Pi and is exposed via Cloudflare Tunnel.
See the main repository for backend installation instructions.

## 🌐 Architecture

```
GitHub Pages (Frontend)  →  Cloudflare Tunnel  →  Raspberry Pi (Backend)
```

## 📖 Full Documentation

See `GITHUB_PAGES_GUIDE.md` for complete setup instructions.
