/**
 * Tests pour le module Discord
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDiscordNotification } from '../js/discord.js';

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
        
        const result = await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Reminder',
            type: 'reminder',
        });
        
        expect(result).toBe(true);
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.embeds[0].title).toBe('⏰ Reminder');
    });
    
    it('utilise notification par défaut si type non spécifié', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true });
        
        await sendDiscordNotification({
            discordId: '123456789012345678',
            message: 'Test',
        });
        
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        
        expect(body.embeds[0].title).toBe('🔌 Your turn!');
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
        expect(body.embeds[0].description).toContain('groekens.github.io/ev-charging-queue');
    });
});
