/**
 * Tests pour le module queue
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getUserStatus,
    getAvailableSpots,
    isSiteFull,
    findNextInQueue,
    addToQueue,
    removeFromQueue,
    snoozeFirstInQueue,
    finishCharging,
    dailyResetState,
    shouldResetDaily,
} from '../js/queue.js';

describe('queue module', () => {
    let state;
    
    beforeEach(() => {
        state = {
            sites: {
                LLN1: { charging: [] },
                LLN2: { charging: [] }
            },
            globalQueue: [],
            lastReset: null
        };
    });
    
    describe('getUserStatus', () => {
        it('retourne anonymous pour utilisateur vide', () => {
            expect(getUserStatus('', state).status).toBe('anonymous');
            expect(getUserStatus(null, state).status).toBe('anonymous');
        });
        
        it('retourne idle pour utilisateur sans activité', () => {
            expect(getUserStatus('ABC', state).status).toBe('idle');
        });
        
        it('retourne charging si en train de charger', () => {
            state.sites.LLN1.charging.push('ABC');
            const status = getUserStatus('ABC', state);
            expect(status.status).toBe('charging');
            expect(status.site).toBe('LLN1');
        });
        
        it('retourne queued si dans la queue', () => {
            state.globalQueue.push({ xgram: 'ABC', preference: 'both', timestamp: Date.now() });
            const status = getUserStatus('ABC', state);
            expect(status.status).toBe('queued');
            expect(status.position).toBe(1);
            expect(status.preference).toBe('both');
        });
        
        it('retourne la bonne position dans la queue', () => {
            state.globalQueue = [
                { xgram: 'AAA', preference: 'both', timestamp: 1 },
                { xgram: 'BBB', preference: 'both', timestamp: 2 },
                { xgram: 'CCC', preference: 'both', timestamp: 3 }
            ];
            expect(getUserStatus('AAA', state).position).toBe(1);
            expect(getUserStatus('BBB', state).position).toBe(2);
            expect(getUserStatus('CCC', state).position).toBe(3);
        });
    });
    
    describe('getAvailableSpots', () => {
        it('retourne le nombre correct pour un site vide', () => {
            expect(getAvailableSpots('LLN1', state)).toBe(1);
            expect(getAvailableSpots('LLN2', state)).toBe(4);
        });
        
        it('retourne 0 pour un site plein', () => {
            state.sites.LLN1.charging = ['ABC'];
            expect(getAvailableSpots('LLN1', state)).toBe(0);
        });
        
        it('retourne le nombre correct pour un site partiellement plein', () => {
            state.sites.LLN2.charging = ['ABC', 'DEF'];
            expect(getAvailableSpots('LLN2', state)).toBe(2);
        });
    });
    
    describe('isSiteFull', () => {
        it('retourne false pour un site vide', () => {
            expect(isSiteFull('LLN1', state)).toBe(false);
        });
        
        it('retourne true pour un site plein', () => {
            state.sites.LLN1.charging = ['ABC'];
            expect(isSiteFull('LLN1', state)).toBe(true);
        });
    });
    
    describe('findNextInQueue', () => {
        it('retourne null pour une queue vide', () => {
            expect(findNextInQueue('LLN1', state)).toBeNull();
        });
        
        it('retourne le premier de la queue pour préférence both', () => {
            state.globalQueue = [
                { xgram: 'ABC', preference: 'both', timestamp: 1 }
            ];
            const next = findNextInQueue('LLN1', state);
            expect(next.xgram).toBe('ABC');
        });
        
        it('retourne le premier compatible avec le site', () => {
            state.globalQueue = [
                { xgram: 'AAA', preference: 'LLN2', timestamp: 1 },
                { xgram: 'BBB', preference: 'LLN1', timestamp: 2 },
                { xgram: 'CCC', preference: 'both', timestamp: 3 }
            ];
            const nextLLN1 = findNextInQueue('LLN1', state);
            expect(nextLLN1.xgram).toBe('BBB');
        });
        
        it('saute les personnes avec préférence incompatible', () => {
            state.globalQueue = [
                { xgram: 'AAA', preference: 'LLN1', timestamp: 1 }
            ];
            expect(findNextInQueue('LLN2', state)).toBeNull();
        });
    });
    
    describe('addToQueue', () => {
        it('ajoute une personne à la queue', () => {
            const newState = addToQueue(state, 'ABC', 'both');
            expect(newState.globalQueue.length).toBe(1);
            expect(newState.globalQueue[0].xgram).toBe('ABC');
            expect(newState.globalQueue[0].preference).toBe('both');
        });
        
        it('rejette si déjà dans la queue', () => {
            state.globalQueue.push({ xgram: 'ABC', preference: 'both', timestamp: 1 });
            expect(() => addToQueue(state, 'ABC', 'both')).toThrow('Already in queue');
        });
        
        it('rejette si déjà en train de charger', () => {
            state.sites.LLN1.charging.push('ABC');
            expect(() => addToQueue(state, 'ABC', 'both')).toThrow('Already charging');
        });
        
        it('ne modifie pas le state original (immutable)', () => {
            const originalQueue = [...state.globalQueue];
            addToQueue(state, 'ABC', 'both');
            expect(state.globalQueue).toEqual(originalQueue);
        });
    });
    
    describe('removeFromQueue', () => {
        it('retire une personne de la queue', () => {
            state.globalQueue = [
                { xgram: 'ABC', preference: 'both', timestamp: 1 },
                { xgram: 'DEF', preference: 'both', timestamp: 2 }
            ];
            const newState = removeFromQueue(state, 'ABC');
            expect(newState.globalQueue.length).toBe(1);
            expect(newState.globalQueue[0].xgram).toBe('DEF');
        });
        
        it('ne fait rien si la personne n\'est pas dans la queue', () => {
            const newState = removeFromQueue(state, 'XYZ');
            expect(newState.globalQueue.length).toBe(0);
        });
    });
    
    describe('snoozeFirstInQueue', () => {
        it('échange les positions 1 et 2', () => {
            state.globalQueue = [
                { xgram: 'ABC', preference: 'both', timestamp: 1 },
                { xgram: 'DEF', preference: 'both', timestamp: 2 }
            ];
            const newState = snoozeFirstInQueue(state, 'ABC');
            expect(newState.globalQueue[0].xgram).toBe('DEF');
            expect(newState.globalQueue[1].xgram).toBe('ABC');
        });
        
        it('rejette si pas assez de personnes', () => {
            state.globalQueue = [{ xgram: 'ABC', preference: 'both', timestamp: 1 }];
            expect(() => snoozeFirstInQueue(state, 'ABC')).toThrow('not enough');
        });
        
        it('rejette si pas premier dans la queue', () => {
            state.globalQueue = [
                { xgram: 'ABC', preference: 'both', timestamp: 1 },
                { xgram: 'DEF', preference: 'both', timestamp: 2 }
            ];
            expect(() => snoozeFirstInQueue(state, 'DEF')).toThrow('not first');
        });
    });
    
    describe('finishCharging', () => {
        it('retire la personne du site', () => {
            state.sites.LLN1.charging = ['ABC', 'DEF'];
            const newState = finishCharging(state, 'LLN1', 'ABC');
            expect(newState.sites.LLN1.charging).toEqual(['DEF']);
        });
        
        it('ne fait rien si pas en charge', () => {
            const newState = finishCharging(state, 'LLN1', 'XYZ');
            expect(newState.sites.LLN1.charging).toEqual([]);
        });
    });
    
    describe('dailyResetState', () => {
        it('retourne un état initial propre', () => {
            const reset = dailyResetState();
            expect(reset.sites.LLN1.charging).toEqual([]);
            expect(reset.sites.LLN2.charging).toEqual([]);
            expect(reset.globalQueue).toEqual([]);
            expect(reset.lastReset).toBe(new Date().toDateString());
        });
    });
    
    describe('shouldResetDaily', () => {
        it('retourne true si jamais reset', () => {
            expect(shouldResetDaily(null)).toBe(true);
        });
        
        it('retourne true si reset hier', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(shouldResetDaily(yesterday.toDateString())).toBe(true);
        });
        
        it('retourne false si reset aujourd\'hui', () => {
            expect(shouldResetDaily(new Date().toDateString())).toBe(false);
        });
    });
});
