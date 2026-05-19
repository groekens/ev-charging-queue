/**
 * Tests pour le module Discord
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDiscordNotification, reportIssueToFleet } from '../js/discord.js';

describe('sendDiscordNotification', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });
    
    it('rejette si discordId est manquant', async () => {
        const result = await sendDiscordNotification({
            discordId: '',
            message: 'Test',
        });
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('rejette si message est manquant', async () => {
        const result = await sendDiscordNotification({
            discordId: '123456789012345678',
            message: '',
        });
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('envoie une notification standard', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        const result = await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Your turn!',
            type: 'notification',
        });
        
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledOnce();
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.content).toBe('<@123456789012345678>');
        expect(body.embeds[0].title).toBe('🔌 Your turn!');
        expect(body.embeds[0].description).toContain('Your turn!');
    });
    
    it('envoie une notification de type reminder', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Reminder',
            type: 'reminder',
        });
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.embeds[0].title).toBe('⏰ Reminder');
    });
    
    it('gère les erreurs HTTP', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
        
        const result = await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Test',
        });
        
        expect(result).toBe(false);
    });
    
    it('gère les erreurs réseau', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        const result = await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Test',
        });
        
        expect(result).toBe(false);
    });
    
    it('inclut le lien vers l\'app dans le message', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Test',
        });
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.embeds[0].description).toContain('Open the app');
    });
});

describe('reportIssueToFleet', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });
    
    it('rejette si paramètres manquants', async () => {
        expect(await reportIssueToFleet({ site: '', description: 'test', reporter: 'ABC' })).toBe(false);
        expect(await reportIssueToFleet({ site: 'LLN1', description: '', reporter: 'ABC' })).toBe(false);
        expect(await reportIssueToFleet({ site: 'LLN1', description: 'test cable', reporter: '' })).toBe(false);
    });
    
    it('rejette si description trop courte', async () => {
        const result = await reportIssueToFleet({
            site: 'LLN1',
            description: 'hi',
            reporter: 'ABC'
        });
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('rejette si description trop longue', async () => {
        const result = await reportIssueToFleet({
            site: 'LLN1',
            description: 'a'.repeat(501),
            reporter: 'ABC'
        });
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('envoie un report avec mention de rôle', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        const result = await reportIssueToFleet({
            site: 'LLN1',
            description: 'Cable broken and not working',
            reporter: 'ABC'
        });
        
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledOnce();
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        // Vérifier la mention de rôle
        expect(body.content).toBe('<@&1506006592309690409>');
        
        // Vérifier allowed_mentions (CRUCIAL pour Discord)
        expect(body.allowed_mentions).toEqual({
            roles: ['1506006592309690409']
        });
        
        // Vérifier l'embed
        expect(body.embeds[0].title).toBe('⚠️ Issue reported at LLN1');
        expect(body.embeds[0].description).toBe('Cable broken and not working');
        expect(body.embeds[0].color).toBe(0xff7a00); // Orange
        
        // Vérifier les fields
        const fields = body.embeds[0].fields;
        expect(fields.find(f => f.name === 'Reported by').value).toBe('ABC');
        expect(fields.find(f => f.name === 'Site').value).toBe('LLN1');
    });
    
    it('gère les erreurs HTTP', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
        
        const result = await reportIssueToFleet({
            site: 'LLN1',
            description: 'Cable broken',
            reporter: 'ABC'
        });
        
        expect(result).toBe(false);
    });
    
    it('gère les erreurs réseau', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        const result = await reportIssueToFleet({
            site: 'LLN1',
            description: 'Cable broken',
            reporter: 'ABC'
        });
        
        expect(result).toBe(false);
    });
    
    it('inclut un timestamp dans l\'embed', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        await reportIssueToFleet({
            site: 'LLN1',
            description: 'Cable broken',
            reporter: 'ABC'
        });
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.embeds[0].timestamp).toBeTruthy();
        expect(new Date(body.embeds[0].timestamp)).toBeInstanceOf(Date);
    });
});
