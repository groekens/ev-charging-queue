/**
 * Système de toast notifications
 * Remplace les alert() bloquants par des notifications modernes
 */

import { CONFIG } from './config.js';

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Affiche un toast
     * @param {string} message - Message à afficher
     * @param {'info'|'success'|'warning'|'error'} type - Type de toast
     * @param {number} duration - Durée en ms (défaut: CONFIG.TOAST_DURATION_MS)
     */
    show(message, type = 'info', duration = CONFIG.TOAST_DURATION_MS) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        this.container.appendChild(toast);
        
        // Auto-suppression
        setTimeout(() => {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Click pour fermer
        toast.addEventListener('click', () => {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

export const toast = new ToastManager();
