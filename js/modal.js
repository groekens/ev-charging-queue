/**
 * Système de modal personnalisé
 * Supporte confirm, alert, et prompt avec formulaires (textarea, input)
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
     * Modal de confirmation
     */
    confirm(options = {}) {
        const {
            title = 'Confirm',
            subtitle = '',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmStyle = 'primary',
            icon = '',
            iconStyle = 'info',
        } = options;
        
        return new Promise((resolve) => {
            const iconHtml = icon ? `<div class="modal-icon icon-${iconStyle}">${icon}</div>` : '';
            
            this.content.innerHTML = `
                <div class="modal-header">
                    ${iconHtml}
                    <div>
                        <div class="modal-title">${escapeHtml(title)}</div>
                        ${subtitle ? `<div class="modal-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                    </div>
                </div>
                <div class="modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-cancel" id="modal-cancel">${escapeHtml(cancelText)}</button>
                    <button class="btn btn-${confirmStyle}" id="modal-confirm">${escapeHtml(confirmText)}</button>
                </div>
            `;
            
            this.container.classList.remove('hidden');
            
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');
            
            confirmBtn.addEventListener('click', () => {
                this.close();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                this.close();
                resolve(false);
            });
            
            confirmBtn.focus();
        });
    }
    
    /**
     * Modal d'alerte (un seul bouton)
     */
    alert(options = {}) {
        const {
            title = 'Information',
            message = '',
            buttonText = 'OK',
            icon = '',
            iconStyle = 'info',
        } = options;
        
        return new Promise((resolve) => {
            const iconHtml = icon ? `<div class="modal-icon icon-${iconStyle}">${icon}</div>` : '';
            
            this.content.innerHTML = `
                <div class="modal-header">
                    ${iconHtml}
                    <div>
                        <div class="modal-title">${escapeHtml(title)}</div>
                    </div>
                </div>
                <div class="modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="modal-ok">${escapeHtml(buttonText)}</button>
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
    
    /**
     * Modal avec textarea (pour report issue)
     */
    promptText(options = {}) {
        const {
            title = 'Enter text',
            subtitle = '',
            label = 'Your message:',
            placeholder = '',
            helper = '',
            confirmText = 'Send',
            cancelText = 'Cancel',
            confirmStyle = 'send',
            icon = '',
            iconStyle = 'warning',
            initialValue = '',
            minLength = 0,
            maxLength = 500,
            multiline = true,
        } = options;
        
        return new Promise((resolve) => {
            const iconHtml = icon ? `<div class="modal-icon icon-${iconStyle}">${icon}</div>` : '';
            
            const inputHtml = multiline
                ? `<textarea id="modal-input" class="form-textarea" placeholder="${escapeHtml(placeholder)}" maxlength="${maxLength}">${escapeHtml(initialValue)}</textarea>`
                : `<input type="text" id="modal-input" class="form-input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(initialValue)}" maxlength="${maxLength}" />`;
            
            this.content.innerHTML = `
                <div class="modal-header">
                    ${iconHtml}
                    <div>
                        <div class="modal-title">${escapeHtml(title)}</div>
                        ${subtitle ? `<div class="modal-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                    </div>
                </div>
                <div class="modal-body">
                    <label class="form-label" for="modal-input">${escapeHtml(label)}</label>
                    ${inputHtml}
                    ${helper ? `<div class="form-helper">${escapeHtml(helper)}</div>` : ''}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-cancel" id="modal-cancel">${escapeHtml(cancelText)}</button>
                    <button class="btn btn-${confirmStyle}" id="modal-confirm">${escapeHtml(confirmText)}</button>
                </div>
            `;
            
            this.container.classList.remove('hidden');
            
            const input = document.getElementById('modal-input');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');
            
            confirmBtn.addEventListener('click', () => {
                const value = input.value.trim();
                if (value.length < minLength) {
                    input.focus();
                    return; // Don't close, let app handle error
                }
                this.close();
                resolve(value);
            });
            
            cancelBtn.addEventListener('click', () => {
                this.close();
                resolve(null);
            });
            
            // Enter pour soumettre (input simple, pas textarea)
            if (!multiline) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') confirmBtn.click();
                });
            }
            
            // Focus après animation
            setTimeout(() => input.focus(), 200);
        });
    }
    
    close() {
        this.container.classList.add('hidden');
        this.content.innerHTML = '';
    }
}

export const modal = new ModalManager();
