/**
 * Validation des entrées utilisateur
 * Toutes les validations centralisées avec messages d'erreur
 */

import { CONFIG } from './config.js';

/**
 * Valide un Xgram
 * @param {string} xgram - Xgram à valider
 * @returns {{valid: boolean, error?: string}}
 */
export function validateXgram(xgram) {
    if (!xgram || typeof xgram !== 'string') {
        return { valid: false, error: 'Xgram is required' };
    }
    
    const normalized = xgram.trim().toUpperCase();
    
    if (normalized.length < CONFIG.XGRAM_MIN_LENGTH) {
        return { valid: false, error: `Xgram must be at least ${CONFIG.XGRAM_MIN_LENGTH} characters` };
    }
    
    if (normalized.length > CONFIG.XGRAM_MAX_LENGTH) {
        return { valid: false, error: `Xgram must be at most ${CONFIG.XGRAM_MAX_LENGTH} characters` };
    }
    
    if (!CONFIG.XGRAM_REGEX.test(normalized)) {
        return { valid: false, error: 'Xgram must contain only letters (A-Z)' };
    }
    
    return { valid: true };
}

/**
 * Valide un Discord ID
 * @param {string} discordId - Discord ID à valider
 * @returns {{valid: boolean, error?: string, warning?: string}}
 */
export function validateDiscordId(discordId) {
    if (!discordId || typeof discordId !== 'string') {
        return { valid: true }; // Discord ID est optionnel
    }
    
    const trimmed = discordId.trim();
    
    if (trimmed === '') {
        return { valid: true }; // Vide = pas de Discord
    }
    
    if (!CONFIG.DISCORD_ID_REGEX.test(trimmed)) {
        return {
            valid: false,
            error: 'Discord ID must be 17-19 digits (numbers only). Did you copy the right value?',
            warning: true
        };
    }
    
    return { valid: true };
}

/**
 * Valide une préférence de site
 * @param {string} preference - Préférence à valider
 * @returns {{valid: boolean, error?: string}}
 */
export function validateSitePreference(preference) {
    const validPreferences = ['both', ...CONFIG.SITES];
    
    if (!validPreferences.includes(preference)) {
        return { valid: false, error: 'Invalid site preference' };
    }
    
    return { valid: true };
}

/**
 * Valide un nom de site
 * @param {string} site - Site à valider
 * @returns {{valid: boolean, error?: string}}
 */
export function validateSite(site) {
    if (!CONFIG.SITES.includes(site)) {
        return { valid: false, error: `Invalid site. Must be one of: ${CONFIG.SITES.join(', ')}` };
    }
    
    return { valid: true };
}

/**
 * Échappe les caractères HTML dangereux (anti-XSS)
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
