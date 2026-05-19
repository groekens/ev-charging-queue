/**
 * Module de gestion de l'installation PWA
 * - Détecte si l'app peut être installée
 * - Affiche une bannière sur mobile
 * - Gère Android (beforeinstallprompt) et iOS (instructions Safari)
 */

import { logger } from './logger.js';

const DISMISS_KEY = 'pwa-banner-dismissed';

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.banner = null;
        this.iosTooltip = null;
        this.installBtn = null;
        this.dismissBtn = null;
    }
    
    init() {
        this.banner = document.getElementById('pwa-banner');
        this.iosTooltip = document.getElementById('pwa-ios-tooltip');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.dismissBtn = document.getElementById('pwa-dismiss-btn');
        
        if (!this.banner) {
            logger.warn('PWA banner not found in DOM');
            return;
        }
        
        // Capturer l'événement beforeinstallprompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showBanner();
        });
        
        // App installée
        window.addEventListener('appinstalled', () => {
            logger.log('PWA installed');
            this.hideBanner();
            this.deferredPrompt = null;
        });
        
        // Event listeners
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => this.install());
        }
        
        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => this.dismiss());
        }
        
        // Init check
        this.checkAndShow();
    }
    
    /**
     * Vérifie les conditions pour afficher la bannière
     */
    checkAndShow() {
        // Déjà installé ?
        if (this.isStandalone()) {
            logger.log('PWA already installed');
            return;
        }
        
        // Déjà dismissé ?
        if (this.isDismissed()) {
            logger.log('PWA banner previously dismissed');
            return;
        }
        
        // Pas sur mobile ?
        if (!this.isMobile()) {
            logger.log('Not mobile, skipping PWA banner');
            return;
        }
        
        // Sur iOS : afficher avec instructions Safari
        if (this.isIOS()) {
            this.setupIOS();
            this.showBanner();
        }
        // Sinon, attendre beforeinstallprompt (déjà capturé ?)
        else if (this.deferredPrompt) {
            this.showBanner();
        }
    }
    
    /**
     * Configure les éléments pour iOS
     */
    setupIOS() {
        if (this.installBtn) {
            this.installBtn.textContent = 'How?';
            // Réassigner le click handler pour iOS
            this.installBtn.removeEventListener('click', () => this.install());
            this.installBtn.addEventListener('click', () => this.showIOSInstructions());
        }
    }
    
    /**
     * Affiche les instructions iOS
     */
    showIOSInstructions() {
        if (this.iosTooltip) {
            this.iosTooltip.classList.toggle('visible');
        }
    }
    
    /**
     * Déclenche l'installation (Android/Chrome)
     */
    async install() {
        if (!this.deferredPrompt) {
            logger.warn('No install prompt available');
            return;
        }
        
        this.deferredPrompt.prompt();
        
        try {
            const choice = await this.deferredPrompt.userChoice;
            logger.log('Install choice:', choice.outcome);
            
            if (choice.outcome === 'accepted') {
                this.hideBanner();
            }
        } catch (error) {
            logger.error('Install error:', error);
        }
        
        this.deferredPrompt = null;
    }
    
    /**
     * L'utilisateur ferme la bannière
     */
    dismiss() {
        this.hideBanner();
        localStorage.setItem(DISMISS_KEY, 'true');
        logger.log('PWA banner dismissed');
    }
    
    showBanner() {
        if (this.banner) this.banner.classList.add('visible');
    }
    
    hideBanner() {
        if (this.banner) this.banner.classList.remove('visible');
        if (this.iosTooltip) this.iosTooltip.classList.remove('visible');
    }
    
    // Helpers
    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }
    
    isMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    isDismissed() {
        return localStorage.getItem(DISMISS_KEY) === 'true';
    }
}

export const pwaInstaller = new PWAInstaller();
