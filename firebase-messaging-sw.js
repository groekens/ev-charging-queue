// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJCAcq4eKCgJQZ9iOq3mlxjGxxHEjchOk",
    authDomain: "ev-charging-queue.firebaseapp.com",
    projectId: "ev-charging-queue",
    storageBucket: "ev-charging-queue.firebasestorage.app",
    messagingSenderId: "260636724772",
    appId: "1:260636724772:web:2d05d51d46f3cdd55a92b1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification.title || 'EV Charging Queue';
    const notificationOptions = {
        body: payload.notification.body || 'You have a notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'ev-charging-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received.');
    
    event.notification.close();
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('groekens.github.io') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('https://groekens.github.io/ev-charging-queue/');
            }
        })
    );
});
