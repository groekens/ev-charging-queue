/**
 * Module de logique de queue
 * Pure functions pour faciliter les tests
 */

import { CONFIG } from './config.js';

/**
 * Détermine le statut d'un utilisateur
 * @param {string} xgram
 * @param {Object} state
 * @returns {Object} Statut: { status, site?, position?, preference? }
 */
export function getUserStatus(xgram, state) {
    if (!xgram) return { status: 'anonymous' };
    
    // Vérifier si l'utilisateur charge
    for (const site of CONFIG.SITES) {
        if (state.sites?.[site]?.charging?.includes(xgram)) {
            return { status: 'charging', site };
        }
    }
    
    // Vérifier si dans la queue
    const queueItem = state.globalQueue?.find(item => item.xgram === xgram);
    if (queueItem) {
        return {
            status: 'queued',
            position: state.globalQueue.indexOf(queueItem) + 1,
            preference: queueItem.preference,
        };
    }
    
    return { status: 'idle' };
}

/**
 * Calcule les places disponibles pour un site
 * @param {string} site
 * @param {Object} state
 * @returns {number}
 */
export function getAvailableSpots(site, state) {
    const charging = state.sites?.[site]?.charging?.length || 0;
    return Math.max(0, CONFIG.MAX_SPOTS[site] - charging);
}

/**
 * Vérifie si un site est plein
 * @param {string} site
 * @param {Object} state
 * @returns {boolean}
 */
export function isSiteFull(site, state) {
    return getAvailableSpots(site, state) === 0;
}

/**
 * Trouve la prochaine personne en queue pour un site donné
 * @param {string} site
 * @param {Object} state
 * @returns {Object|null} - Item de la queue ou null
 */
export function findNextInQueue(site, state) {
    if (!state.globalQueue) return null;
    
    return state.globalQueue.find(
        item => item.preference === 'both' || item.preference === site
    ) || null;
}

/**
 * Ajoute une personne à la queue
 * @param {Object} state - État actuel
 * @param {string} xgram - Xgram à ajouter
 * @param {string} preference - Préférence de site
 * @returns {Object} - Nouvel état
 */
export function addToQueue(state, xgram, preference) {
    // Vérifier si déjà dans la queue
    if (state.globalQueue?.some(item => item.xgram === xgram)) {
        throw new Error('Already in queue');
    }
    
    // Vérifier si déjà en train de charger
    for (const site of CONFIG.SITES) {
        if (state.sites?.[site]?.charging?.includes(xgram)) {
            throw new Error('Already charging');
        }
    }
    
    return {
        ...state,
        globalQueue: [
            ...(state.globalQueue || []),
            {
                xgram,
                timestamp: Date.now(),
                preference,
            }
        ]
    };
}

/**
 * Retire une personne de la queue
 * @param {Object} state - État actuel
 * @param {string} xgram - Xgram à retirer
 * @returns {Object} - Nouvel état
 */
export function removeFromQueue(state, xgram) {
    return {
        ...state,
        globalQueue: (state.globalQueue || []).filter(item => item.xgram !== xgram)
    };
}

/**
 * Échange les positions 1 et 2 dans la queue (snooze)
 * @param {Object} state - État actuel
 * @param {string} xgram - Xgram en position 1
 * @returns {Object} - Nouvel état
 */
export function snoozeFirstInQueue(state, xgram) {
    if (!state.globalQueue || state.globalQueue.length < 2) {
        throw new Error('Cannot snooze: not enough people in queue');
    }
    
    if (state.globalQueue[0].xgram !== xgram) {
        throw new Error('You are not first in queue');
    }
    
    const newQueue = [...state.globalQueue];
    [newQueue[0], newQueue[1]] = [newQueue[1], newQueue[0]];
    
    return {
        ...state,
        globalQueue: newQueue
    };
}

/**
 * Termine le chargement
 * @param {Object} state - État actuel
 * @param {string} site - Site
 * @param {string} xgram - Xgram
 * @returns {Object} - Nouvel état
 */
export function finishCharging(state, site, xgram) {
    const newSites = { ...state.sites };
    if (newSites[site]) {
        newSites[site] = {
            ...newSites[site],
            charging: newSites[site].charging.filter(t => t !== xgram)
        };
    }
    
    return {
        ...state,
        sites: newSites
    };
}

/**
 * Reset quotidien
 * @returns {Object} - État initial
 */
export function dailyResetState() {
    return {
        sites: {
            LLN1: { charging: [] },
            LLN2: { charging: [] }
        },
        globalQueue: [],
        lastReset: new Date().toDateString()
    };
}

/**
 * Vérifie si un reset quotidien est nécessaire
 * @param {string|null} lastReset
 * @returns {boolean}
 */
export function shouldResetDaily(lastReset) {
    if (!lastReset) return true;
    return lastReset !== new Date().toDateString();
}
