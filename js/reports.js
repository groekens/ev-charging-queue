/**
 * Module de gestion des rapports utilisateur
 * - Report Free Spot : l'utilisateur signale qu'une place est libre alors que l'app pense le contraire
 * - Report Issue : l'utilisateur signale un problème technique à la Fleet Managers
 */

import { CONFIG } from './config.js';
import { logger } from './logger.js';

/**
 * Valide un texte de description d'issue
 * @param {string} description
 * @returns {{valid: boolean, error?: string}}
 */
export function validateIssueDescription(description) {
    if (!description || typeof description !== 'string') {
        return { valid: false, error: 'Description is required' };
    }
    
    const trimmed = description.trim();
    
    if (trimmed.length < CONFIG.ISSUE_MIN_LENGTH) {
        return {
            valid: false,
            error: `Please provide more details (at least ${CONFIG.ISSUE_MIN_LENGTH} characters)`
        };
    }
    
    if (trimmed.length > CONFIG.ISSUE_MAX_LENGTH) {
        return {
            valid: false,
            error: `Description too long (max ${CONFIG.ISSUE_MAX_LENGTH} characters)`
        };
    }
    
    return { valid: true };
}

/**
 * Vérifie si l'utilisateur peut faire un nouveau report (anti-spam)
 * @param {string} xgram
 * @returns {{allowed: boolean, retryAfter?: number}}
 */
export function checkReportCooldown(xgram) {
    if (!xgram) return { allowed: false };
    
    const lastReportKey = `lastReport_${xgram}`;
    const lastReport = localStorage.getItem(lastReportKey);
    
    if (!lastReport) return { allowed: true };
    
    const lastTime = parseInt(lastReport, 10);
    const elapsed = Date.now() - lastTime;
    
    if (elapsed < CONFIG.REPORT_COOLDOWN_MS) {
        const retryAfterMs = CONFIG.REPORT_COOLDOWN_MS - elapsed;
        const retryAfterMinutes = Math.ceil(retryAfterMs / (60 * 1000));
        return { allowed: false, retryAfter: retryAfterMinutes };
    }
    
    return { allowed: true };
}

/**
 * Enregistre l'horodatage du dernier report d'un utilisateur
 * @param {string} xgram
 */
export function recordReportTimestamp(xgram) {
    if (!xgram) return;
    localStorage.setItem(`lastReport_${xgram}`, Date.now().toString());
}

/**
 * Marque une place comme libre dans un site (logique métier pure)
 * Retire la personne qui charge depuis le plus longtemps
 * @param {Object} state - État actuel
 * @param {string} site - Site (LLN1, LLN2)
 * @returns {Object} - Nouvel état
 * @throws {Error} si le site n'est pas plein
 */
export function reportFreeSpotInSite(state, site) {
    if (!CONFIG.SITES.includes(site)) {
        throw new Error(`Invalid site: ${site}`);
    }
    
    const charging = state.sites?.[site]?.charging || [];
    
    if (charging.length === 0) {
        throw new Error(`${site} is already showing as available`);
    }
    
    // Retirer la personne qui charge depuis le plus longtemps (premier de la liste)
    const newCharging = charging.slice(1);
    
    return {
        ...state,
        sites: {
            ...state.sites,
            [site]: {
                ...state.sites[site],
                charging: newCharging
            }
        }
    };
}
