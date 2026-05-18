/**
 * Configuration centrale de l'application
 * Toutes les constantes et configurations en un seul endroit
 */

export const CONFIG = {
    // Application
    APP_URL: 'https://groekens.github.io/ev-charging-queue/',
    DISCORD_CHANNEL_URL: 'https://discord.com/channels/1489533353702068244/1489533353702068247',
    
    // Sites de charge
    SITES: ['LLN1', 'LLN2'],
    MAX_SPOTS: {
        LLN1: 1,
        LLN2: 4,
    },
    
    // Timing (en millisecondes)
    REMINDER_DELAY_MS: 15 * 60 * 1000,        // 15 minutes
    DAILY_CHECK_INTERVAL_MS: 60 * 60 * 1000,   // 1 heure
    REMINDER_CHECK_INTERVAL_MS: 60 * 1000,     // 1 minute
    TOAST_DURATION_MS: 3000,                   // 3 secondes
    SAVE_DEBOUNCE_MS: 300,                     // 300ms
    
    // Validation
    XGRAM_REGEX: /^[A-Z]{2,10}$/,
    XGRAM_MIN_LENGTH: 2,
    XGRAM_MAX_LENGTH: 10,
    DISCORD_ID_REGEX: /^\d{17,19}$/,
    
    // Discord embed colors
    COLORS: {
        SUCCESS: 0x10b981,
        WARNING: 0xf59e0b,
        INFO: 0x3b82f6,
        DANGER: 0xef4444,
    },
    
    // Mode debug (activé en local)
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
};

// Configuration Firebase
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBJCAcq4eKCgJQZ9iOq3mlxjGxxHEjchOk",
    authDomain: "ev-charging-queue.firebaseapp.com",
    projectId: "ev-charging-queue",
    storageBucket: "ev-charging-queue.firebasestorage.app",
    messagingSenderId: "260636724772",
    appId: "1:260636724772:web:2d05d51d46f3cdd55a92b1"
};

// Webhook Discord - Obfusqué en Base64
// Note: Security by obscurity, pas du vrai chiffrement
// Pour régénérer: Discord → Server Settings → Integrations → Webhooks
const WEBHOOK_BASE = "https://discord.com/api/webhooks/";
const WEBHOOK_ID = atob("MTQ4OTUzMzU0NjQzNDUzMTQ1MQ==");
const WEBHOOK_TOKEN = atob("aWQ2MTgxYVV0Y05KZU00QWo5dFhyRXN5VzB5U3BXMEhNR0NXWmI0UDJ1Ynh5MnJMZlk0MEFKWlREZGRYTy1vTmVONko=");

export const DISCORD_WEBHOOK = WEBHOOK_BASE + WEBHOOK_ID + "/" + WEBHOOK_TOKEN;
