/**
 * Module de notifications Discord
 * Gère l'envoi de notifications via le webhook Discord
 */

import { CONFIG, DISCORD_WEBHOOK, DISCORD_ROLES } from './config.js';
import { logger } from './logger.js';

/**
 * Envoie une notification Discord à un utilisateur spécifique
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
        const embed = buildUserEmbed(message, type);
        
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
 * Envoie un report d'issue aux Fleet Managers via mention de rôle
 * @param {Object} options
 * @param {string} options.site - Nom du site (LLN1, LLN2)
 * @param {string} options.description - Description du problème
 * @param {string} options.reporter - Xgram de l'utilisateur qui report
 * @returns {Promise<boolean>}
 */
export async function reportIssueToFleet({ site, description, reporter }) {
    if (!site || !description || !reporter) {
        logger.error('Missing parameters for issue report');
        return false;
    }
    
    if (description.length < CONFIG.ISSUE_MIN_LENGTH) {
        logger.error('Description too short');
        return false;
    }
    
    if (description.length > CONFIG.ISSUE_MAX_LENGTH) {
        logger.error('Description too long');
        return false;
    }
    
    try {
        const roleId = DISCORD_ROLES.FLEET_MANAGERS;
        
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `<@&${roleId}>`,
                // IMPORTANT: allowed_mentions nécessaire pour que la mention de rôle ping
                allowed_mentions: {
                    roles: [roleId]
                },
                embeds: [{
                    title: `⚠️ Issue reported at ${site}`,
                    description: description,
                    color: CONFIG.COLORS.ORANGE,
                    fields: [
                        { name: 'Reported by', value: reporter, inline: true },
                        { name: 'Site', value: site, inline: true },
                    ],
                    footer: { text: 'EV Charging Queue' },
                    timestamp: new Date().toISOString(),
                }]
            })
        });
        
        if (!response.ok) {
            logger.error('Discord API error on issue report:', response.status);
            return false;
        }
        
        logger.log('Issue reported to fleet managers:', { site, reporter });
        return true;
    } catch (error) {
        logger.error('Error sending issue report:', error);
        return false;
    }
}

/**
 * Construit l'embed Discord pour les notifications utilisateur
 * @param {string} message
 * @param {string} type
 * @returns {Object} Embed Discord
 */
function buildUserEmbed(message, type) {
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
