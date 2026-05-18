/**
 * Système de modal personnalisé
 * Remplace les confirm() bloquants par des modals modernes
 * Retourne des Promises pour usage async/await
 */

import { escapeHtml } from './validation.js';

class ModalManager {
    constructor() {
        this.container = null;
        this.content = null;
        this.init();
    }
    
    init() {
        this.container = document.getElementById('modal-container');
        this.content = document.getElementById('modal-content');
        
        if (!this.container || !this.content) {
            console.error('Modal container not found in DOM');
            return;
        }
        
        // Fermer en cliquant sur le backdrop
        const backdrop = this.container.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close(false));
        }
        
        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.container.classList.contains('hidden')) {
                this.close(false);
            }
        });
    }
    
    /**
     * Affiche une modal de confirmation
     * @param {Object} options - Options de la modal
     * @param {string} options.title - Titre
     * @param {string} options.message - Message
     * @param {string} options.confirmText - Texte du bouton confirmer
     * @param {string} options.cancelText - Texte du bouton annuler
     * @param {'primary'|'danger'|'warning'} options.confirmStyle - Style du bouton confirm
     * @returns {Promise<boolean>} - true si confirmé, false si annulé
     */
    confirm(options = {}) {
        const {
            title = 'Confirm',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmStyle = 'primary'
        } = options;
        
        return new Promise((resolve) => {
            this.content.innerHTML = `
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
                <div class="modal-actions">
                    <button class="btn btn-small" id="modal-cancel" style="background: #9ca3af; color: white;">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button class="btn btn-${confirmStyle}" id="modal-confirm">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            `;
            
            this.container.classList.remove('hidden');
            
            // Focus sur le bouton confirm
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');
            
            const handleConfirm = () => {
                this.close(true);
                resolve(true);
            };
            
            const handleCancel = () => {
                this.close(false);
                resolve(false);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            
            confirmBtn.focus();
        });
    }
    
    /**
     * Affiche une modal d'alerte (un seul bouton)
     * @param {Object} options - Options
     * @returns {Promise<void>}
     */
    alert(options = {}) {
        const {
            title = 'Information',
            message = '',
            buttonText = 'OK'
        } = options;
        
        return new Promise((resolve) => {
            this.content.innerHTML = `
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="modal-ok">
                        ${escapeHtml(buttonText)}
                    </button>
                </div>
            `;
            
            this.container.classList.remove('hidden');
            
            const okBtn = document.getElementById('modal-ok');
            okBtn.addEventListener('click', () => {
                this.close();
                resolve();
            });
            
            okBtn.focus();
        });
    }
    
    close() {
        this.container.classList.add('hidden');
        this.content.innerHTML = '';
    }
}

export const modal = new ModalManager();
