/**
 * Tests pour le module logger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../js/logger.js';

describe('logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    it('logger.warn appelle console.warn avec le préfixe', () => {
        logger.warn('test message');
        expect(console.warn).toHaveBeenCalledWith('[EV Queue]', 'test message');
    });
    
    it('logger.error appelle console.error avec le préfixe', () => {
        logger.error('error message');
        expect(console.error).toHaveBeenCalledWith('[EV Queue]', 'error message');
    });
    
    it('logger supporte plusieurs arguments', () => {
        logger.error('error', { code: 500 });
        expect(console.error).toHaveBeenCalledWith('[EV Queue]', 'error', { code: 500 });
    });
});
