/**
 * Module de notifications Discord
 * Gère l'envoi de notifications via le webhook Discord
 */

import { CONFIG, DISCORD_WEBHOOK } from './config.js';
import { logger } from './logger.js';

/**
 * Envoie une notification Discord
 * @param {Object} options
 * @param {string} options.discordId - ID Discord de la personne à mentionner
 * @param {string} options.message - Message à afficher
 * @param {'notification'|'reminder'} options.type - Type de notification
 * @returns {Promise<boolean>} - true si envoyé avec succès
 */
export async function sendDiscordNotification({ discordId, message, type = 'notification' }) {
    if (!discordId || !message) {
        logger.error('Missing parameters for Discord notification');
        return false;
    }
    
    try {
        const embed = buildEmbed(message, type);
        
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `<@${discordId}>`,
                embeds: [embed]
            })
        });
        
        if (!response.ok) {
            logger.error('Discord API error:', response.status);
            return false;
        }
        
        logger.log('Discord notification sent to', discordId);
        return true;
    } catch (error) {
        logger.error('Error sending Discord notification:', error);
        return false;
    }
}

/**
 * Construit l'embed Discord selon le type
 * @param {string} message
 * @param {string} type
 * @returns {Object} Embed Discord
 */
function buildEmbed(message, type) {
    const baseEmbed = {
        description: `${message}\n\n👉 [Open the app](${CONFIG.APP_URL})`,
        timestamp: new Date().toISOString(),
    };
    
    switch (type) {
        case 'reminder':
            return {
                ...baseEmbed,
                title: '⏰ Reminder',
                color: CONFIG.COLORS.WARNING,
            };
        case 'notification':
        default:
            return {
                ...baseEmbed,
                title: '🔌 Your turn!',
                color: CONFIG.COLORS.SUCCESS,
            };
    }
}
