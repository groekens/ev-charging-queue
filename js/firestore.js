/**
 * Module Firestore
 * Gère toutes les interactions avec la base de données
 * Utilise des transactions pour éviter les race conditions
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    runTransaction,
    enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { FIREBASE_CONFIG, CONFIG } from './config.js';
import { logger } from './logger.js';

// Initialiser Firebase
const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);

// Activer la persistence offline
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        logger.warn('Firestore persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
        logger.warn('Firestore persistence: not supported in this browser');
    }
});

const STATE_DOC = doc(db, 'state', 'current');

/**
 * Récupère l'état global
 * @returns {Promise<Object|null>}
 */
export async function loadState() {
    try {
        const docSnap = await getDoc(STATE_DOC);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        logger.error('Error loading state:', error);
        throw error;
    }
}

/**
 * Sauvegarde l'état global
 * @param {Object} state
 * @returns {Promise<boolean>}
 */
export async function saveState(state) {
    try {
        await setDoc(STATE_DOC, {
            ...state,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        logger.error('Error saving state:', error);
        throw error;
    }
}

/**
 * Subscribe aux changements d'état en temps réel
 * @param {Function} callback - Appelé à chaque changement
 * @returns {Function} - Fonction pour unsubscribe
 */
export function subscribeToState(callback) {
    return onSnapshot(STATE_DOC, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        }
    }, (error) => {
        logger.error('Snapshot error:', error);
    });
}

/**
 * Effectue une transaction pour démarrer le chargement
 * Évite les race conditions
 * @param {string} site - Site (LLN1, LLN2)
 * @param {string} xgram - Xgram de l'utilisateur
 * @param {boolean} force - Forcer même si site plein
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function startChargingTransaction(site, xgram, force = false) {
    try {
        const result = await runTransaction(db, async (transaction) => {
            const stateDoc = await transaction.get(STATE_DOC);
            
            if (!stateDoc.exists()) {
                throw new Error('State not found');
            }
            
            const data = stateDoc.data();
            const sites = data.sites || { LLN1: { charging: [] }, LLN2: { charging: [] } };
            const globalQueue = data.globalQueue || [];
            
            // Vérifier si l'utilisateur charge déjà ailleurs
            for (const s of CONFIG.SITES) {
                if (sites[s]?.charging?.includes(xgram) && s !== site) {
                    throw new Error(`Already charging at ${s}`);
                }
            }
            
            // Vérifier si déjà sur ce site
            if (sites[site]?.charging?.includes(xgram)) {
                throw new Error('Already charging here');
            }
            
            // Vérifier la capacité (sauf si force)
            const currentCharging = sites[site]?.charging?.length || 0;
            if (!force && currentCharging >= CONFIG.MAX_SPOTS[site]) {
                throw new Error(`${site} is full (${currentCharging}/${CONFIG.MAX_SPOTS[site]})`);
            }
            
            // Ajouter à la liste de charge
            if (!sites[site]) sites[site] = { charging: [] };
            sites[site].charging.push(xgram);
            
            // Retirer de la queue
            const newQueue = globalQueue.filter(item => item.xgram !== xgram);
            
            transaction.set(STATE_DOC, {
                ...data,
                sites,
                globalQueue: newQueue,
                updatedAt: new Date().toISOString(),
            });
            
            return { sites, globalQueue: newQueue };
        });
        
        return { success: true, data: result };
    } catch (error) {
        logger.error('Transaction error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère le Discord ID d'un utilisateur
 * @param {string} xgram
 * @returns {Promise<string|null>}
 */
export async function getDiscordId(xgram) {
    try {
        const userDoc = doc(db, 'users', xgram);
        const snap = await getDoc(userDoc);
        
        if (snap.exists()) {
            return snap.data().discord || null;
        }
        return null;
    } catch (error) {
        logger.error('Error getting Discord ID:', error);
        return null;
    }
}

/**
 * Sauvegarde le Discord ID d'un utilisateur
 * @param {string} xgram
 * @param {string} discordId
 * @returns {Promise<boolean>}
 */
export async function saveDiscordId(xgram, discordId) {
    try {
        const userDoc = doc(db, 'users', xgram);
        await setDoc(userDoc, {
            discord: discordId,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        logger.error('Error saving Discord ID:', error);
        return false;
    }
}
