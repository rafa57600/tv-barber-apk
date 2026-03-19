// Firebase Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config will be set dynamically
let firebaseConfig = null;
let messaging = null;

// Listen for config message from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;
        initializeFirebase();
    }
});

function initializeFirebase() {
    if (!firebaseConfig || firebase.apps.length > 0) return;

    try {
        firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging();

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
            console.log('[SW] Background message received:', payload);

            const notificationTitle = payload.notification?.title || 'Barber SHOP';
            const notificationOptions = {
                body: payload.notification?.body || 'Vous avez une nouvelle notification',
                icon: '/icon-192.png',
                badge: '/icon-72.png',
                tag: payload.data?.type || 'default',
                data: payload.data,
                vibrate: [200, 100, 200]
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });

        console.log('[SW] Firebase initialized successfully');
    } catch (error) {
        console.error('[SW] Firebase initialization error:', error);
    }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    const data = event.notification.data;
    let targetUrl = '/';

    // Determine where to navigate based on notification type
    if (data?.type === 'new_booking') {
        targetUrl = '/admin/appointments';
    } else if (data?.type === 'booking_confirmed' || data?.type === 'booking_cancelled') {
        targetUrl = '/';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Install event - skip waiting to activate immediately
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate event - claim clients
self.addEventListener('activate', () => {
    self.clients.claim();
});

