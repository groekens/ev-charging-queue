/**
 * Tests pour le module toast
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Toast Manager', () => {
    let toast;
    
    beforeEach(async () => {
        // Setup DOM
        document.body.innerHTML = '<div id="toast-container" class="toast-container"></div>';
        
        // Réimporter pour avoir une instance fraîche
        vi.resetModules();
        const module = await import('../js/toast.js');
        toast = module.toast;
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
    });
    
    it('crée un toast avec le bon type', () => {
        toast.show('Test message', 'success');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement).toBeTruthy();
        expect(toastElement.classList.contains('toast-success')).toBe(true);
        expect(toastElement.textContent).toBe('Test message');
    });
    
    it('toast.success() utilise le type success', () => {
        toast.success('Success!');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement.classList.contains('toast-success')).toBe(true);
    });
    
    it('toast.error() utilise le type error', () => {
        toast.error('Error!');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement.classList.contains('toast-error')).toBe(true);
    });
    
    it('toast.warning() utilise le type warning', () => {
        toast.warning('Warning!');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement.classList.contains('toast-warning')).toBe(true);
    });
    
    it('toast.info() utilise le type info', () => {
        toast.info('Info!');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement.classList.contains('toast-info')).toBe(true);
    });
    
    it('ajoute role et aria-live pour accessibilité', () => {
        toast.show('Test', 'info');
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement.getAttribute('role')).toBe('alert');
        expect(toastElement.getAttribute('aria-live')).toBe('polite');
    });
    
    it('disparaît après le délai', async () => {
        vi.useFakeTimers();
        
        toast.show('Test', 'info', 1000);
        expect(document.querySelector('.toast')).toBeTruthy();
        
        // Avancer le temps
        vi.advanceTimersByTime(1100);
        
        const toastElement = document.querySelector('.toast');
        expect(toastElement?.classList.contains('toast-removing')).toBe(true);
        
        // Attendre que le toast soit retiré
        vi.advanceTimersByTime(400);
        expect(document.querySelector('.toast')).toBeFalsy();
    });
    
    it('permet de fermer en cliquant', () => {
        toast.show('Test', 'info');
        
        const toastElement = document.querySelector('.toast');
        toastElement.click();
        
        expect(toastElement.classList.contains('toast-removing')).toBe(true);
    });
});
