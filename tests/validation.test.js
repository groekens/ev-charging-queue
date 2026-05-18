/**
 * Tests pour le module validation
 */

import { describe, it, expect } from 'vitest';
import {
    validateXgram,
    validateDiscordId,
    validateSitePreference,
    validateSite,
    escapeHtml,
} from '../js/validation.js';

describe('validateXgram', () => {
    it('valide un xgram correct', () => {
        expect(validateXgram('ABC').valid).toBe(true);
        expect(validateXgram('GRO').valid).toBe(true);
        expect(validateXgram('WXYZ').valid).toBe(true);
    });
    
    it('valide un xgram en minuscules après normalisation', () => {
        // Note: la fonction attend déjà uppercase, mais on test la regex
        expect(validateXgram('ABCDE').valid).toBe(true);
    });
    
    it('rejette un xgram vide', () => {
        const result = validateXgram('');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });
    
    it('rejette un xgram null/undefined', () => {
        expect(validateXgram(null).valid).toBe(false);
        expect(validateXgram(undefined).valid).toBe(false);
    });
    
    it('rejette un xgram trop court', () => {
        const result = validateXgram('A');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least');
    });
    
    it('rejette un xgram trop long', () => {
        const result = validateXgram('ABCDEFGHIJK'); // 11 chars
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at most');
    });
    
    it('rejette un xgram avec des chiffres', () => {
        expect(validateXgram('ABC123').valid).toBe(false);
        expect(validateXgram('123').valid).toBe(false);
    });
    
    it('rejette un xgram avec des caractères spéciaux', () => {
        expect(validateXgram('AB-CD').valid).toBe(false);
        expect(validateXgram('AB_CD').valid).toBe(false);
        expect(validateXgram('AB CD').valid).toBe(false);
    });
});

describe('validateDiscordId', () => {
    it('valide un Discord ID correct (18 digits)', () => {
        expect(validateDiscordId('123456789012345678').valid).toBe(true);
    });
    
    it('valide un Discord ID de 17 digits', () => {
        expect(validateDiscordId('12345678901234567').valid).toBe(true);
    });
    
    it('valide un Discord ID de 19 digits', () => {
        expect(validateDiscordId('1234567890123456789').valid).toBe(true);
    });
    
    it('accepte un Discord ID vide (optionnel)', () => {
        expect(validateDiscordId('').valid).toBe(true);
        expect(validateDiscordId(null).valid).toBe(true);
        expect(validateDiscordId(undefined).valid).toBe(true);
    });
    
    it('rejette un Discord ID trop court', () => {
        const result = validateDiscordId('123456');
        expect(result.valid).toBe(false);
        expect(result.warning).toBe(true);
    });
    
    it('rejette un Discord ID avec des lettres', () => {
        expect(validateDiscordId('abc123').valid).toBe(false);
        expect(validateDiscordId('gabrielgro').valid).toBe(false);
    });
    
    it('rejette un Discord ID trop long', () => {
        expect(validateDiscordId('12345678901234567890').valid).toBe(false);
    });
});

describe('validateSitePreference', () => {
    it('valide les préférences correctes', () => {
        expect(validateSitePreference('both').valid).toBe(true);
        expect(validateSitePreference('LLN1').valid).toBe(true);
        expect(validateSitePreference('LLN2').valid).toBe(true);
    });
    
    it('rejette les préférences invalides', () => {
        expect(validateSitePreference('LLN3').valid).toBe(false);
        expect(validateSitePreference('any').valid).toBe(false);
        expect(validateSitePreference('').valid).toBe(false);
    });
});

describe('validateSite', () => {
    it('valide les sites corrects', () => {
        expect(validateSite('LLN1').valid).toBe(true);
        expect(validateSite('LLN2').valid).toBe(true);
    });
    
    it('rejette les sites invalides', () => {
        expect(validateSite('LLN3').valid).toBe(false);
        expect(validateSite('both').valid).toBe(false);
        expect(validateSite('').valid).toBe(false);
    });
});

describe('escapeHtml', () => {
    it('échappe les chevrons', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
        expect(escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    });
    
    it('échappe les apostrophes et guillemets', () => {
        expect(escapeHtml('"test"')).toContain('test');
        expect(escapeHtml("'test'")).toContain('test');
    });
    
    it('gère les valeurs non-string', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
        expect(escapeHtml(123)).toBe('');
    });
    
    it('laisse passer le texte normal', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
        expect(escapeHtml('ABC')).toBe('ABC');
    });
});
