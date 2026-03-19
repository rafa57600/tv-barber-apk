'use client'

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'
import { app, isFirebaseConfigured } from './config'

let messaging: Messaging | null = null

// Firebase config to send to service worker
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize messaging only on client side
export function getFirebaseMessaging(): Messaging | null {
    if (typeof window === 'undefined') return null
    if (!isFirebaseConfigured() || !app) return null

    if (!messaging) {
        try {
            messaging = getMessaging(app)
        } catch (error) {
            console.error('Failed to initialize Firebase Messaging:', error)
            return null
        }
    }
    return messaging
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
    if (typeof window === 'undefined') return null

    const fcmMessaging = getFirebaseMessaging()
    if (!fcmMessaging) return null

    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications')
            return null
        }

        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            console.log('Notification permission denied')
            return null
        }

        // Get VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        if (!vapidKey) {
            console.error('VAPID key not configured')
            return null
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready

        // Send Firebase config to service worker
        if (registration.active) {
            registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: firebaseConfig
            })
        }

        // Get FCM token
        const token = await getToken(fcmMessaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        })

        console.log('FCM Token:', token)
        return token
    } catch (error) {
        console.error('Error getting FCM token:', error)
        return null
    }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void) {
    const fcmMessaging = getFirebaseMessaging()
    if (!fcmMessaging) return () => { }

    return onMessage(fcmMessaging, (payload) => {
        console.log('Foreground message received:', payload)
        callback({
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
        })
    })
}
