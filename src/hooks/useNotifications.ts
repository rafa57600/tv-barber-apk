'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/messaging'
import { saveFCMToken, getProfile } from '@/lib/firebase/firestore'
import { toast } from 'sonner'

export function useNotifications() {
    const { user } = useAuth()
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Check current permission status
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    // Listen for foreground messages
    useEffect(() => {
        if (permission !== 'granted') return

        const unsubscribe = onForegroundMessage((payload) => {
            // Show toast for foreground notifications
            toast(payload.title || 'Notification', {
                description: payload.body,
                duration: 5000
            })
        })

        return unsubscribe
    }, [permission])

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!user) {
            toast.error('Veuillez vous connecter pour activer les notifications')
            return false
        }

        setLoading(true)
        try {
            const fcmToken = await requestNotificationPermission()

            if (fcmToken) {
                // Get user role
                const profile = await getProfile(user.uid)
                const role = profile?.role || 'client'

                // Save token to Firestore
                await saveFCMToken(user.uid, fcmToken, role as 'admin' | 'client')

                setToken(fcmToken)
                setPermission('granted')
                toast.success('Notifications activées !')
                return true
            } else {
                setPermission(Notification.permission)
                if (Notification.permission === 'denied') {
                    toast.error('Notifications bloquées. Veuillez les autoriser dans les paramètres du navigateur.')
                }
                return false
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            toast.error('Erreur lors de l\'activation des notifications')
            return false
        } finally {
            setLoading(false)
        }
    }, [user])

    return {
        permission,
        token,
        loading,
        isSupported: typeof window !== 'undefined' && 'Notification' in window,
        isEnabled: permission === 'granted',
        requestPermission
    }
}
