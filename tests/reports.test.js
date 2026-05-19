/**
 * Tests pour le module reports
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    validateIssueDescription,
    checkReportCooldown,
    recordReportTimestamp,
    reportFreeSpotInSite,
} from '../js/reports.js';

describe('validateIssueDescription', () => {
    it('valide une description correcte', () => {
        expect(validateIssueDescription('Cable broken').valid).toBe(true);
        expect(validateIssueDescription('The charging station is not working properly today').valid).toBe(true);
    });
    
    it('rejette une description vide', () => {
        expect(validateIssueDescription('').valid).toBe(false);
        expect(validateIssueDescription(null).valid).toBe(false);
        expect(validateIssueDescription(undefined).valid).toBe(false);
    });
    
    it('rejette une description trop courte', () => {
        const result = validateIssueDescription('hi');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('more details');
    });
    
    it('rejette une description trop longue', () => {
        const longText = 'a'.repeat(501);
        const result = validateIssueDescription(longText);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('too long');
    });
    
    it('trim avant validation', () => {
        // 5 chars valides après trim
        expect(validateIssueDescription('  cable  ').valid).toBe(true);
        // 2 chars après trim = invalide
        expect(validateIssueDescription('  hi  ').valid).toBe(false);
    });
    
    it('accepte exactement la longueur minimum', () => {
        // 5 caractères = min length
        expect(validateIssueDescription('cable').valid).toBe(true);
    });
});

describe('checkReportCooldown', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    it('autorise si aucun report précédent', () => {
        expect(checkReportCooldown('ABC').allowed).toBe(true);
    });
    
    it('autorise si dernier report > 30 min', () => {
        const oldTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
        localStorage.setItem('lastReport_ABC', oldTime.toString());
        
        expect(checkReportCooldown('ABC').allowed).toBe(true);
    });
    
    it('refuse si dernier report < 30 min', () => {
        const recentTime = Date.now() - (15 * 60 * 1000); // 15 minutes ago
        localStorage.setItem('lastReport_ABC', recentTime.toString());
        
        const result = checkReportCooldown('ABC');
        expect(result.allowed).toBe(false);
        expect(result.retryAfter).toBeGreaterThan(0);
        expect(result.retryAfter).toBeLessThanOrEqual(15);
    });
    
    it('refuse si xgram vide', () => {
        expect(checkReportCooldown('').allowed).toBe(false);
        expect(checkReportCooldown(null).allowed).toBe(false);
    });
});

describe('recordReportTimestamp', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    it('enregistre le timestamp dans localStorage', () => {
        recordReportTimestamp('ABC');
        const stored = localStorage.getItem('lastReport_ABC');
        expect(stored).toBeTruthy();
        expect(parseInt(stored, 10)).toBeGreaterThan(0);
    });
    
    it('ne fait rien si xgram vide', () => {
        recordReportTimestamp('');
        expect(localStorage.getItem('lastReport_')).toBeNull();
    });
});

describe('reportFreeSpotInSite', () => {
    let state;
    
    beforeEach(() => {
        state = {
            sites: {
                LLN1: { charging: ['ABC'] },
                LLN2: { charging: ['DEF', 'GHI'] }
            },
            globalQueue: []
        };
    });
    
    it('retire la première personne en charge', () => {
        const newState = reportFreeSpotInSite(state, 'LLN1');
        expect(newState.sites.LLN1.charging).toEqual([]);
    });
    
    it('retire la première personne (FIFO) pour LLN2', () => {
        const newState = reportFreeSpotInSite(state, 'LLN2');
        expect(newState.sites.LLN2.charging).toEqual(['GHI']);
    });
    
    it('throw si le site n\'est pas plein', () => {
        state.sites.LLN1.charging = [];
        expect(() => reportFreeSpotInSite(state, 'LLN1')).toThrow('already showing as available');
    });
    
    it('throw si site invalide', () => {
        expect(() => reportFreeSpotInSite(state, 'LLN3')).toThrow('Invalid site');
    });
    
    it('ne mute pas le state original (immutable)', () => {
        const originalCharging = [...state.sites.LLN1.charging];
        reportFreeSpotInSite(state, 'LLN1');
        expect(state.sites.LLN1.charging).toEqual(originalCharging);
    });
});
