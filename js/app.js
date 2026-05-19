/**
 * Application principale
 * Coordonne tous les modules
 */

import { CONFIG } from './config.js';
import { logger } from './logger.js';
import { validateXgram, validateDiscordId } from './validation.js';
import { toast } from './toast.js';
import { modal } from './modal.js';
import {
    loadState,
    saveState,
    subscribeToState,
    startChargingTransaction,
    getDiscordId,
    saveDiscordId,
} from './firestore.js';
import { sendDiscordNotification, reportIssueToFleet } from './discord.js';
import {
    getUserStatus,
    isSiteFull,
    findNextInQueue,
    addToQueue,
    removeFromQueue,
    snoozeFirstInQueue,
    finishCharging,
    dailyResetState,
    shouldResetDaily,
} from './queue.js';
import {
    validateIssueDescription,
    checkReportCooldown,
    recordReportTimestamp,
    reportFreeSpotInSite,
} from './reports.js';
import { renderXgramLogin, renderDiscordLogin, renderMain } from './render.js';
import { pwaInstaller } from './pwa-install.js';

export class EVChargingApp {
    constructor() {
        this.state = {
            sites: { LLN1: { charging: [] }, LLN2: { charging: [] } },
            globalQueue: [],
            lastReset: null,
        };
        this.userXgram = localStorage.getItem('userXgram') || '';
        this.userDiscord = '';
        this.notificationTimestamps = JSON.parse(
            localStorage.getItem('notificationTimestamps') || '{}'
        );
        this.unsubscribe = null;
        this.appElement = document.getElementById('app');
        
        this.init();
    }
    
    async init() {
        try {
            const data = await loadState();
            if (data) {
                this.state = { ...this.state, ...data };
            }
            
            if (this.userXgram) {
                this.userDiscord = await getDiscordId(this.userXgram) || '';
            }
            
            await this.checkDailyReset();
            this.startPeriodicChecks();
            
            this.unsubscribe = subscribeToState((data) => {
                this.state = { ...this.state, ...data };
                this.checkForMyTurn();
                this.render();
            });
            
            this.setupOfflineDetection();
            
            // Initialiser PWA installer
            pwaInstaller.init();
            
            this.render();
            logger.log('App initialized');
        } catch (error) {
            logger.error('Init error:', error);
            toast.error('Failed to load app. Please refresh.');
        }
    }
    
    setupOfflineDetection() {
        const offlineBanner = document.getElementById('offline-banner');
        
        const updateStatus = () => {
            if (navigator.onLine) {
                offlineBanner?.classList.add('hidden');
            } else {
                offlineBanner?.classList.remove('hidden');
            }
        };
        
        window.addEventListener('online', () => {
            updateStatus();
            toast.success('Back online');
        });
        
        window.addEventListener('offline', () => {
            updateStatus();
            toast.warning('You are offline');
        });
        
        updateStatus();
    }
    
    startPeriodicChecks() {
        setInterval(() => this.checkDailyReset(), CONFIG.DAILY_CHECK_INTERVAL_MS);
        setInterval(() => this.checkReminders(), CONFIG.REMINDER_CHECK_INTERVAL_MS);
    }
    
    async checkDailyReset() {
        if (shouldResetDaily(this.state.lastReset)) {
            logger.log('Triggering daily reset');
            this.state = { ...this.state, ...dailyResetState() };
            try {
                await saveState(this.state);
            } catch (error) {
                logger.error('Failed to save daily reset:', error);
            }
        }
    }
    
    checkReminders() {
        if (!this.userXgram) return;
        
        const userStatus = getUserStatus(this.userXgram, this.state);
        if (userStatus.status === 'queued' && userStatus.position === 1) {
            const notifTime = this.notificationTimestamps[this.userXgram];
            
            if (notifTime && Date.now() - notifTime >= CONFIG.REMINDER_DELAY_MS) {
                this.sendReminderNotification();
                delete this.notificationTimestamps[this.userXgram];
                this.saveNotificationTimestamps();
            }
        }
    }
    
    saveNotificationTimestamps() {
        localStorage.setItem('notificationTimestamps', JSON.stringify(this.notificationTimestamps));
    }
    
    checkForMyTurn() {
        if (!this.userXgram) return;
        
        const userStatus = getUserStatus(this.userXgram, this.state);
        
        if (userStatus.status === 'queued' && userStatus.position === 1) {
            if (!this.notificationTimestamps[this.userXgram]) {
                this.notificationTimestamps[this.userXgram] = Date.now();
                this.saveNotificationTimestamps();
            }
        }
    }
    
    async sendReminderNotification() {
        if (!this.userDiscord) return;
        
        await sendDiscordNotification({
            discordId: this.userDiscord,
            message: "You've been notified 15 minutes ago. Are you still available to charge? If not, please snooze your turn.",
            type: 'reminder',
        });
    }
    
    // ========================================
    // Actions utilisateur
    // ========================================
    
    async setUserXgram() {
        const input = document.getElementById('xgram-input');
        const xgram = input.value.toUpperCase().trim();
        const errorEl = document.getElementById('xgram-error');
        
        const validation = validateXgram(xgram);
        if (!validation.valid) {
            input.classList.add('error');
            errorEl.className = 'error-message';
            errorEl.textContent = validation.error;
            toast.error(validation.error);
            return;
        }
        
        this.userXgram = xgram;
        localStorage.setItem('userXgram', xgram);
        
        this.userDiscord = await getDiscordId(xgram) || '';
        this.render();
    }
    
    async setUserDiscord() {
        const input = document.getElementById('discord-input');
        const discord = input.value.trim();
        const errorEl = document.getElementById('discord-error');
        
        if (discord) {
            const validation = validateDiscordId(discord);
            if (!validation.valid) {
                if (validation.warning) {
                    const confirmed = await modal.confirm({
                        title: 'Invalid Discord ID?',
                        message: validation.error + '\n\nContinue anyway?',
                        confirmText: 'Yes, continue',
                        cancelText: 'Let me fix it',
                        icon: '⚠️',
                        iconStyle: 'warning',
                    });
                    if (!confirmed) return;
                } else {
                    input.classList.add('error');
                    errorEl.className = 'error-message';
                    errorEl.textContent = validation.error;
                    return;
                }
            }
        }
        
        this.userDiscord = discord || this.userXgram;
        await saveDiscordId(this.userXgram, this.userDiscord);
        toast.success('Saved!');
        this.render();
    }
    
    resetUser() {
        this.userXgram = '';
        this.userDiscord = '';
        localStorage.removeItem('userXgram');
        this.render();
    }
    
    async openSettings() {
        const currentDiscord = await getDiscordId(this.userXgram) || '';
        
        const newDiscord = await modal.promptText({
            title: '⚙️ Settings',
            subtitle: `Logged in as ${this.userXgram}`,
            label: 'Your Discord ID:',
            placeholder: '123456789012345678',
            helper: '💡 Leave empty to disable @mentions. Update this anytime.',
            confirmText: 'Save',
            cancelText: 'Cancel',
            confirmStyle: 'primary',
            icon: '⚙️',
            iconStyle: 'info',
            initialValue: currentDiscord,
            maxLength: 30,
            multiline: false,
        });
        
        if (newDiscord === null) return; // Cancelled
        
        // Si vide, supprimer
        if (newDiscord === '') {
            this.userDiscord = this.userXgram;
            await saveDiscordId(this.userXgram, this.userXgram);
            toast.success('Discord ID removed');
            this.render();
            return;
        }
        
        // Sinon valider
        const validation = validateDiscordId(newDiscord);
        if (!validation.valid) {
            toast.error(validation.error || 'Invalid Discord ID');
            return;
        }
        
        this.userDiscord = newDiscord;
        await saveDiscordId(this.userXgram, newDiscord);
        toast.success('Discord ID updated!');
        this.render();
    }
    
    async startCharging(site) {
        const userStatus = getUserStatus(this.userXgram, this.state);
        const siteFull = isSiteFull(site, this.state);
        
        if (siteFull) {
            const isFirstInQueue = userStatus.status === 'queued' && userStatus.position === 1;
            const currentCharging = this.state.sites[site].charging.length;
            
            let message = `${site} appears to be Full (${currentCharging}/${CONFIG.MAX_SPOTS[site]}).\n\n`;
            
            if (isFirstInQueue) {
                message += 'You are first in queue, so this is expected if a spot just freed up.\n\n';
            } else {
                message += '⚠️ Are you sure you have a free spot and that it\'s your turn?\n\n';
            }
            
            message += 'Confirm that you are plugging in?';
            
            const confirmed = await modal.confirm({
                title: `${site} - Confirm`,
                message,
                confirmText: 'Yes, I\'m plugging in',
                cancelText: 'Cancel',
                confirmStyle: 'accent',
                icon: '🔌',
                iconStyle: 'warning',
            });
            
            if (!confirmed) return;
        }
        
        const result = await startChargingTransaction(site, this.userXgram, true);
        
        if (!result.success) {
            toast.error(`Failed to start charging: ${result.error}`);
            return;
        }
        
        delete this.notificationTimestamps[this.userXgram];
        this.saveNotificationTimestamps();
        
        toast.success(`Charging started at ${site}`);
    }
    
    async finishCharging(site) {
        const newState = finishCharging(this.state, site, this.userXgram);
        
        const nextPerson = findNextInQueue(site, newState);
        if (nextPerson) {
            const discordId = await getDiscordId(nextPerson.xgram);
            if (discordId) {
                await sendDiscordNotification({
                    discordId,
                    message: `🔌 **Your turn!** A charging spot is now available at **${site}**`,
                });
            }
        }
        
        this.state = newState;
        await saveState(this.state);
        toast.success(`Charging finished at ${site}`);
    }
    
    async reportFreeSpot(site) {
        // Check cooldown
        const cooldown = checkReportCooldown(this.userXgram);
        if (!cooldown.allowed) {
            toast.warning(`Please wait ${cooldown.retryAfter} minutes before reporting again`);
            return;
        }
        
        const confirmed = await modal.confirm({
            title: `Report free spot at ${site}?`,
            message: `The app shows ${site} as full, but you see a free spot?\n\nThis will mark the site as available and notify the next person in queue.\n\nNote: Your Xgram (${this.userXgram}) will be included in the notification.`,
            confirmText: 'Yes, report it',
            cancelText: 'Cancel',
            confirmStyle: 'accent',
            icon: '🟢',
            iconStyle: 'success',
        });
        
        if (!confirmed) return;
        
        try {
            const newState = reportFreeSpotInSite(this.state, site);
            
            // Notifier la prochaine personne dans la queue avec le nom du reporter
            const nextPerson = findNextInQueue(site, newState);
            if (nextPerson) {
                const discordId = await getDiscordId(nextPerson.xgram);
                if (discordId) {
                    await sendDiscordNotification({
                        discordId,
                        message: `🔌 **Free spot reported by ${this.userXgram}!** A free spot is available at **${site}**. Please go plug in!`,
                    });
                    toast.success(`${nextPerson.xgram} has been notified`);
                } else {
                    toast.success(`${site} marked as available (next person has no Discord ID)`);
                }
            } else {
                toast.success(`${site} marked as available (no one waiting)`);
            }
            
            this.state = newState;
            await saveState(this.state);
            recordReportTimestamp(this.userXgram);
        } catch (error) {
            logger.error('Report free spot error:', error);
            toast.error(error.message);
        }
    }
    
    async reportIssue(site) {
        // Check cooldown
        const cooldown = checkReportCooldown(this.userXgram);
        if (!cooldown.allowed) {
            toast.warning(`Please wait ${cooldown.retryAfter} minutes before reporting again`);
            return;
        }
        
        const description = await modal.promptText({
            title: 'Report an issue',
            subtitle: `at ${site}`,
            label: 'Describe the issue:',
            placeholder: "e.g., The charging cable is damaged and won't connect properly...",
            helper: '💬 Fleet managers will be notified on Discord with your message',
            confirmText: '⚠️ Send report',
            cancelText: 'Cancel',
            confirmStyle: 'send',
            icon: '⚠️',
            iconStyle: 'warning',
            minLength: CONFIG.ISSUE_MIN_LENGTH,
            maxLength: CONFIG.ISSUE_MAX_LENGTH,
            multiline: true,
        });
        
        if (description === null) return; // Cancelled
        
        // Valider
        const validation = validateIssueDescription(description);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }
        
        // Envoyer à Discord
        const success = await reportIssueToFleet({
            site,
            description: description.trim(),
            reporter: this.userXgram,
        });
        
        if (success) {
            toast.success('Fleet managers have been notified');
            recordReportTimestamp(this.userXgram);
        } else {
            toast.error('Failed to send report. Please try again.');
        }
    }
    
    async joinQueue() {
        const preference = document.querySelector('input[name="site-pref"]:checked')?.value || 'both';
        
        try {
            this.state = addToQueue(this.state, this.userXgram, preference);
            await saveState(this.state);
            toast.success('Added to queue');
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    async leaveQueue() {
        const confirmed = await modal.confirm({
            title: 'Leave queue?',
            message: 'Are you sure you want to leave the queue?',
            confirmText: 'Yes, leave',
            confirmStyle: 'danger',
            icon: '❌',
            iconStyle: 'danger',
        });
        
        if (!confirmed) return;
        
        this.state = removeFromQueue(this.state, this.userXgram);
        delete this.notificationTimestamps[this.userXgram];
        this.saveNotificationTimestamps();
        await saveState(this.state);
        toast.success('Left the queue');
    }
    
    async snoozeMyTurn() {
        const confirmed = await modal.confirm({
            title: 'Snooze your turn?',
            message: 'You will move to position 2 and the next person will be notified.',
            confirmText: 'Yes, snooze',
            confirmStyle: 'warning',
            icon: '😴',
            iconStyle: 'warning',
        });
        
        if (!confirmed) return;
        
        try {
            this.state = snoozeFirstInQueue(this.state, this.userXgram);
            
            const nextPerson = this.state.globalQueue[0];
            const discordId = await getDiscordId(nextPerson.xgram);
            
            if (discordId) {
                const availableSites = [];
                for (const site of CONFIG.SITES) {
                    if ((nextPerson.preference === 'both' || nextPerson.preference === site) 
                        && !isSiteFull(site, this.state)) {
                        availableSites.push(site);
                    }
                }
                
                const siteMessage = availableSites.length > 0
                    ? `at **${availableSites.join(' or ')}**`
                    : `(check **${nextPerson.preference === 'both' ? 'both sites' : nextPerson.preference}**)`;
                
                await sendDiscordNotification({
                    discordId,
                    message: `🔌 **Your turn!** Previous person snoozed. Please check ${siteMessage}`,
                });
            }
            
            delete this.notificationTimestamps[this.userXgram];
            this.saveNotificationTimestamps();
            await saveState(this.state);
            toast.success('Snoozed to position 2');
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    // ========================================
    // Rendering & Event handling
    // ========================================
    
    render() {
        let html;
        
        if (!this.userXgram) {
            html = renderXgramLogin();
        } else if (!this.userDiscord) {
            html = renderDiscordLogin(this.userXgram);
        } else {
            html = renderMain(this.state, this.userXgram);
        }
        
        this.appElement.innerHTML = html;
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Login Xgram
        const xgramInput = document.getElementById('xgram-input');
        const xgramSubmit = document.getElementById('xgram-submit');
        
        if (xgramInput) {
            xgramInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.setUserXgram();
            });
            xgramInput.focus();
        }
        
        if (xgramSubmit) {
            xgramSubmit.addEventListener('click', () => this.setUserXgram());
        }
        
        // Login Discord
        const discordInput = document.getElementById('discord-input');
        const discordSubmit = document.getElementById('discord-submit');
        const discordBack = document.getElementById('discord-back');
        
        if (discordInput) {
            discordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.setUserDiscord();
            });
            discordInput.focus();
        }
        
        if (discordSubmit) {
            discordSubmit.addEventListener('click', () => this.setUserDiscord());
        }
        
        if (discordBack) {
            discordBack.addEventListener('click', () => this.resetUser());
        }
        
        // Actions principales (data-action)
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => this.handleAction(el));
        });
    }
    
    handleAction(element) {
        const action = element.dataset.action;
        const site = element.dataset.site;
        
        switch (action) {
            case 'start-charging': this.startCharging(site); break;
            case 'finish-charging': this.finishCharging(site); break;
            case 'report-free-spot': this.reportFreeSpot(site); break;
            case 'report-issue': this.reportIssue(site); break;
            case 'join-queue': this.joinQueue(); break;
            case 'leave-queue': this.leaveQueue(); break;
            case 'snooze': this.snoozeMyTurn(); break;
            case 'reset-user': this.resetUser(); break;
            case 'open-settings': this.openSettings(); break;
            default: logger.warn('Unknown action:', action);
        }
    }
}
