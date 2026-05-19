/**
 * Module de rendu UI
 * Gère le rendu HTML de l'application style Odoo moderne
 */

import { CONFIG } from './config.js';
import { escapeHtml } from './validation.js';
import { getUserStatus, getAvailableSpots, isSiteFull } from './queue.js';

/**
 * Rend l'écran de login (étape 1 - Xgram)
 */
export function renderXgramLogin() {
    return `
        <div class="card">
            <div class="input-section">
                <label for="xgram-input">Your Xgram (trigram, quadrigram, etc.):</label>
                <input 
                    type="text" 
                    id="xgram-input" 
                    class="xgram" 
                    placeholder="ABC" 
                    maxlength="${CONFIG.XGRAM_MAX_LENGTH}" 
                    autocomplete="off"
                    aria-label="Enter your Xgram"
                />
                <small id="xgram-error"></small>
                <small>Enter your unique identifier</small>
            </div>
            <div style="margin-top: 16px;">
                <button class="btn btn-primary" id="xgram-submit">Continue</button>
            </div>
        </div>
    `;
}

/**
 * Rend l'écran de login (étape 2 - Discord)
 */
export function renderDiscordLogin(xgram) {
    return `
        <div class="card">
            <div style="margin-bottom: 20px;">
                <span style="color: var(--text-secondary); font-size: 13px;">Logged in as</span>
                <div style="margin-top: 8px;">
                    <span class="xgram-display">${escapeHtml(xgram)}</span>
                </div>
            </div>
            <div class="input-section">
                <label for="discord-input">Your Discord ID (optional):</label>
                <input 
                    type="text" 
                    id="discord-input" 
                    placeholder="123456789012345678" 
                    autocomplete="off"
                    aria-label="Enter your Discord ID"
                />
                <small id="discord-error"></small>
                <small>
                    💡 <strong>Recommended:</strong> Enter your Discord ID to receive @mentions. 
                    <a href="discord-id-guide.html" target="_blank" rel="noopener" class="help-link">How to find it →</a>
                </small>
                <small>⚠️ If you skip this, notifications will just mention your Xgram (${escapeHtml(xgram)}) without @tagging you</small>
                <small style="color: var(--success);">ℹ️ You only need to do this once - it will be saved and linked to your Xgram</small>
            </div>
            <div style="margin-top: 16px; display: flex; gap: 12px;">
                <button class="btn btn-primary" id="discord-submit" style="flex: 1;">Continue</button>
                <button class="btn btn-cancel" id="discord-back">Back</button>
            </div>
        </div>
    `;
}

/**
 * Rend l'alerte de statut utilisateur
 * @param {Object} userStatus - Statut de l'utilisateur
 * @param {Object} state - État global pour vérifier les places disponibles
 */
export function renderUserStatusAlert(userStatus, state = null) {
    if (userStatus.status === 'charging') {
        return `
            <div class="alert alert-success">
                <span class="alert-icon">🔌</span>
                <div class="alert-content">
                    <div class="alert-title">You are charging at ${escapeHtml(userStatus.site)}</div>
                    <div class="alert-message">Don't forget to signal when you're done</div>
                </div>
            </div>
        `;
    }
    
    if (userStatus.status === 'queued') {
        const isNext = userStatus.position === 1;
        
        // Vérifier si une place est disponible pour cette personne (selon sa préférence)
        let spotAvailable = false;
        if (isNext && state) {
            if (userStatus.preference === 'both') {
                spotAvailable = CONFIG.SITES.some(site => getAvailableSpots(site, state) > 0);
            } else {
                spotAvailable = getAvailableSpots(userStatus.preference, state) > 0;
            }
        }
        
        return `
            <div class="alert ${isNext ? 'alert-warning' : 'alert-info'}">
                <span class="alert-icon">${isNext ? '⏰' : '⏳'}</span>
                <div class="alert-content">
                    <div class="alert-title">${isNext ? 'You are next in line!' : `Position ${userStatus.position} in queue`}</div>
                    <div class="alert-message">${userStatus.preference === 'both' ? 'Waiting for any site' : `Waiting for ${escapeHtml(userStatus.preference)} only`}</div>
                    ${isNext && spotAvailable ? '<div class="snooze-notice">⏰ A spot is available! You\'ll receive a reminder in 15 minutes if you don\'t plug in</div>' : ''}
                </div>
            </div>
        `;
    }
    
    return '';
}

/**
 * Rend une station card (LLN1 ou LLN2)
 */
export function renderStationCard(site, state, userStatus) {
    const available = getAvailableSpots(site, state);
    const isCharging = userStatus.status === 'charging' && userStatus.site === site;
    const isFull = isSiteFull(site, state);
    const chargingCount = state.sites?.[site]?.charging?.length || 0;
    const total = CONFIG.MAX_SPOTS[site];
    
    let mainButton = '';
    
    if (isCharging) {
        mainButton = `<button class="btn btn-danger" data-action="finish-charging" data-site="${site}">✅ I'm done charging</button>`;
    } else if (userStatus.status !== 'charging') {
        mainButton = `<button class="btn btn-accent" data-action="start-charging" data-site="${site}">⚡ I'm plugging in</button>`;
    }
    
    return `
        <div class="station-card station-${site.toLowerCase()}">
            <div class="station-header">
                <div class="station-name">
                    <span class="station-badge"></span>
                    <h3>${escapeHtml(site)}</h3>
                </div>
                <div class="station-availability">
                    <div class="availability-count">${available}<span class="total">/${total}</span></div>
                    <div class="availability-label ${available > 0 ? 'available' : 'full'}">
                        ${available > 0 ? 'Available' : 'Full'}
                    </div>
                </div>
            </div>
            ${mainButton}
            <div class="station-reports">
                <button class="btn-report report-free" data-action="report-free-spot" data-site="${site}">
                    🟢 Report free spot
                </button>
                <button class="btn-report report-issue" data-action="report-issue" data-site="${site}">
                    ⚠️ Report issue
                </button>
            </div>
        </div>
    `;
}

/**
 * Rend la section queue
 */
export function renderQueueSection(state, userStatus) {
    let html = `<div class="queue-card">`;
    
    // Options pour rejoindre/quitter la queue
    if (userStatus.status === 'idle') {
        html += `
            <div class="queue-options">
                <div class="queue-options-label">Join the queue for:</div>
                <div class="radio-group">
                    <div class="radio-option full-width">
                        <input type="radio" id="pref-both" name="site-pref" value="both" checked>
                        <label for="pref-both">Any site</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="pref-lln1" name="site-pref" value="LLN1">
                        <label for="pref-lln1">LLN1</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="pref-lln2" name="site-pref" value="LLN2">
                        <label for="pref-lln2">LLN2</label>
                    </div>
                </div>
                <button class="btn btn-join" data-action="join-queue">⏳ Join queue</button>
            </div>
        `;
    } else if (userStatus.status === 'queued') {
        html += `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-danger" data-action="leave-queue">❌ Leave queue</button>
            </div>
        `;
    }
    
    // Liste des personnes en attente
    if (state.globalQueue && state.globalQueue.length > 0) {
        html += `<ul class="queue-list">`;
        
        state.globalQueue.forEach((item, index) => {
            const isMe = item.xgram === userStatus.xgram;
            const isFirst = index === 0;
            const siteLabel = item.preference !== 'both' 
                ? `<span class="queue-site">(${escapeHtml(item.preference)} only)</span>` 
                : '';
            
            html += `
                <li class="queue-item ${isMe && isFirst ? 'my-turn' : ''}">
                    <div class="queue-position">
                        <span class="position-number">${index + 1}</span>
                        <span class="queue-xgram">${escapeHtml(item.xgram)}${siteLabel}</span>
                    </div>
                    ${isMe && isFirst ? '<button class="btn btn-small btn-warning" data-action="snooze">😴 Snooze</button>' : ''}
                </li>
            `;
        });
        
        html += `</ul>`;
    } else {
        html += `
            <div class="empty-queue">
                <div class="empty-queue-icon">✨</div>
                <div>No one waiting</div>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

/**
 * Rend l'écran principal (utilisateur connecté)
 */
export function renderMain(state, xgram) {
    const userStatus = { ...getUserStatus(xgram, state), xgram };
    
    let html = renderUserStatusAlert(userStatus, state);
    
    // User bar
    html += `
        <div class="user-bar">
            <div class="user-info">
                <span class="user-label">Logged in as</span>
                <span class="user-xgram">${escapeHtml(xgram)}</span>
            </div>
            <div class="user-actions">
                <button class="btn-icon" data-action="open-settings" title="Settings" aria-label="Settings">⚙️</button>
                <button class="btn-change" data-action="reset-user">Change</button>
            </div>
        </div>
    `;
    
    // Section Charging Stations
    html += `
        <div class="section-header">
            <h2>Charging Stations</h2>
        </div>
    `;
    
    CONFIG.SITES.forEach(site => {
        html += renderStationCard(site, state, userStatus);
    });
    
    // Section Queue
    html += `
        <div class="section-header">
            <h2>Waiting Queue</h2>
        </div>
    `;
    
    html += renderQueueSection(state, userStatus);
    
    return html;
}
