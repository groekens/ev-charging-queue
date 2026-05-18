/**
 * Point d'entrée de l'application
 * Initialise tous les modules
 */

import { EVChargingApp } from './app.js';
import { logger } from './logger.js';

// Démarrer l'app au chargement
const app = new EVChargingApp();

// Enregistrer le service worker pour offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/ev-charging-queue/sw.js')
            .then(registration => {
                logger.log('Service Worker registered:', registration.scope);
            })
            .catch(error => {
                logger.warn('Service Worker registration failed:', error);
            });
    });
}

// Exposer l'app globalement pour debug en console (dev seulement)
if (window.location.hostname === 'localhost') {
    window.app = app;
}
