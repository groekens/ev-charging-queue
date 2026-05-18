/**
 * Module de rendu UI
 * Gère le rendu HTML de l'application
 */

import { CONFIG } from './config.js';
import { escapeHtml } from './validation.js';
import { getUserStatus, getAvailableSpots, isSiteFull } from './queue.js';

/**
 * Rend l'écran de login (étape 1 - Xgram)
 * @returns {string} HTML
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
                    placeholder="e.g., ABC, WXYZ" 
                    maxlength="${CONFIG.XGRAM_MAX_LENGTH}" 
                    autocomplete="off"
                    aria-label="Enter your Xgram"
                />
                <small id="xgram-error"></small>
                <small>Enter your unique identifier</small>
            </div>
            <div style="margin-top: 12px;">
                <button class="btn btn-primary" id="xgram-submit">Continue</button>
            </div>
        </div>
    `;
}

/**
 * Rend l'écran de login (étape 2 - Discord)
 * @param {string} xgram - Xgram de l'utilisateur
 * @returns {string} HTML
 */
export function renderDiscordLogin(xgram) {
    return `
        <div class="card">
            <div style="margin-bottom: 20px;">
                <span style="color: var(--color-text-light); font-size: 14px;">Logged in as</span>
                <div style="margin-top: 8px;">
                    <span class="xgram-display">${escapeHtml(xgram)}</span>
                </div>
            </div>
            <div class="input-section">
                <label for="discord-input">Your Discord ID (optional):</label>
                <input 
                    type="text" 
                    id="discord-input" 
                    placeholder="e.g., 123456789012345678" 
                    autocomplete="off"
                    aria-label="Enter your Discord ID"
                />
                <small id="discord-error"></small>
                <small>
                    💡 <strong>Recommended:</strong> Enter your Discord ID to receive @mentions. 
                    <a href="discord-id-guide.html" target="_blank" rel="noopener" class="help-link">How to find it →</a>
                </small>
                <small>⚠️ If you skip this, notifications will just mention your Xgram (${escapeHtml(xgram)}) without @tagging you</small>
                <small style="color: var(--color-success);">ℹ️ You only need to do this once - it will be saved and linked to your Xgram</small>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 12px;">
                <button class="btn btn-primary" id="discord-submit">Continue</button>
                <button class="btn btn-small" id="discord-back" style="background: #9ca3af; color: white;">Back</button>
            </div>
        </div>
    `;
}

/**
 * Rend l'alerte de statut utilisateur
 * @param {Object} userStatus
 * @returns {string} HTML
 */
export function renderUserStatusAlert(userStatus) {
    if (userStatus.status === 'charging') {
        return `
            <div class="alert alert-success">
                <span style="font-size: 24px;">🔌</span>
                <div>
                    <strong>You are charging at ${escapeHtml(userStatus.site)}</strong>
                    <div style="font-size: 14px; margin-top: 4px;">
                        Don't forget to signal when you're done
                    </div>
                </div>
            </div>
        `;
    }
    
    if (userStatus.status === 'queued') {
        const isNext = userStatus.position === 1;
        return `
            <div class="alert ${isNext ? 'alert-warning' : 'alert-info'}">
                <span style="font-size: 24px;">${isNext ? '⏰' : '⏳'}</span>
                <div>
                    <strong>${isNext ? 'You are next in line!' : `Position ${userStatus.position} in queue`}</strong>
                    <div style="font-size: 14px; margin-top: 4px;">
                        ${userStatus.preference === 'both' ? 'Waiting for any site' : `Waiting for ${escapeHtml(userStatus.preference)} only`}
                    </div>
                    ${isNext ? '<div class="snooze-notice">⏰ You\'ll receive a reminder in 15 minutes if you don\'t plug in</div>' : ''}
                </div>
            </div>
        `;
    }
    
    return '';
}

/**
 * Rend un site (LLN1 ou LLN2)
 * @param {string} site
 * @param {Object} state
 * @param {Object} userStatus
 * @returns {string} HTML
 */
export function renderSite(site, state, userStatus) {
    const available = getAvailableSpots(site, state);
    const isCharging = userStatus.status === 'charging' && userStatus.site === site;
    const isFull = isSiteFull(site, state);
    const chargingCount = state.sites?.[site]?.charging?.length || 0;
    
    let buttons = '';
    
    if (!isCharging && userStatus.status !== 'charging') {
        buttons += `<button class="btn btn-primary" data-action="start-charging" data-site="${site}">🔌 I'm plugging in</button>`;
    }
    
    if (isCharging) {
        buttons += `<button class="btn btn-danger" data-action="finish-charging" data-site="${site}">✅ I'm done charging</button>`;
    }
    
    if (isFull && !isCharging && userStatus.status !== 'charging') {
        buttons += `<button class="btn btn-small btn-warning" data-action="report-spot-free" data-site="${site}">📢 Report spot free</button>`;
    }
    
    return `
        <div class="site-section site-${site.toLowerCase()}">
            <h3>
                <span>📍</span>
                <span>${escapeHtml(site)}</span>
            </h3>
            <div class="station-info">
                <div class="station-status">
                    <span class="status-dot ${available > 0 ? '' : 'busy'}"></span>
                    <span>${available > 0 ? `${available} spot(s) available` : 'Full'}</span>
                </div>
                <span style="color: var(--color-text-light); font-size: 14px;">
                    ${chargingCount}/${CONFIG.MAX_SPOTS[site]}
                </span>
            </div>
            <div class="action-buttons">${buttons}</div>
        </div>
    `;
}

/**
 * Rend la section queue
 * @param {Object} state
 * @param {Object} userStatus
 * @returns {string} HTML
 */
export function renderQueueSection(state, userStatus) {
    let html = `
        <div class="site-section">
            <h3>
                <span>👥</span>
                <span>Waiting Queue</span>
            </h3>
    `;
    
    // Options pour rejoindre/quitter la queue (avant la liste pour mobile)
    if (userStatus.status === 'idle') {
        html += `
            <div class="site-preference">
                <label>Join the waiting queue:</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="pref-both" name="site-pref" value="both" checked>
                        <label for="pref-both">Any site</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="pref-lln1" name="site-pref" value="LLN1">
                        <label for="pref-lln1">LLN1 only</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="pref-lln2" name="site-pref" value="LLN2">
                        <label for="pref-lln2">LLN2 only</label>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <button class="btn btn-secondary" data-action="join-queue">⏳ Join queue</button>
                </div>
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
        html += `
            <div class="queue-section">
                <h4>People waiting (${state.globalQueue.length})</h4>
                <ul class="queue-list">
        `;
        
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
                    ${isMe && isFirst ? '<button class="btn btn-small btn-warning" data-action="snooze">😴 Snooze my turn</button>' : ''}
                </li>
            `;
        });
        
        html += `</ul></div>`;
    } else {
        html += `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <p>No one waiting</p>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

/**
 * Rend l'écran principal (utilisateur connecté)
 * @param {Object} state
 * @param {string} xgram
 * @returns {string} HTML
 */
export function renderMain(state, xgram) {
    const userStatus = { ...getUserStatus(xgram, state), xgram };
    
    let html = renderUserStatusAlert(userStatus);
    
    html += `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <span style="color: var(--color-text-light); font-size: 14px;">Logged in as</span>
                    <div style="margin-top: 8px;">
                        <span class="xgram-display">${escapeHtml(xgram)}</span>
                    </div>
                </div>
                <button class="btn btn-small" data-action="reset-user" style="background: #9ca3af; color: white;">Change</button>
            </div>
    `;
    
    // Sites
    CONFIG.SITES.forEach(site => {
        html += renderSite(site, state, userStatus);
    });
    
    // Queue
    html += renderQueueSection(state, userStatus);
    
    html += `</div>`;
    
    return html;
}
