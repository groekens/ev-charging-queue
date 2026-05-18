/**
 * Logger conditionnel
 * - En mode debug: log tout
 * - En production: seulement les erreurs
 */

import { CONFIG } from './config.js';

export const logger = {
    log: (...args) => {
        if (CONFIG.DEBUG) console.log('[EV Queue]', ...args);
    },
    
    info: (...args) => {
        if (CONFIG.DEBUG) console.info('[EV Queue]', ...args);
    },
    
    warn: (...args) => {
        console.warn('[EV Queue]', ...args);
    },
    
    error: (...args) => {
        console.error('[EV Queue]', ...args);
    },
    
    debug: (...args) => {
        if (CONFIG.DEBUG) console.debug('[EV Queue]', ...args);
    },
};
