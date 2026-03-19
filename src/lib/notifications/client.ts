// Client-side notification helper functions

interface SendNotificationParams {
    tokens: string[]
    title: string
    body: string
    data?: Record<string, string>
}

export async function sendPushNotification(params: SendNotificationParams): Promise<boolean> {
    try {
        const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })

        if (!response.ok) {
            console.error('Failed to send notification:', await response.text())
            return false
        }

        const result = await response.json()
        console.log('Notification sent:', result)
        return result.success
    } catch (error) {
        console.error('Error sending notification:', error)
        return false
    }
}

// Pre-defined notification templates
export const NotificationTemplates = {
    newBooking: (clientName: string, time: string, date: string) => ({
        title: '🗓️ Nouveau rendez-vous',
        body: `${clientName} a réservé pour ${date} à ${time}`,
        data: { type: 'new_booking' }
    }),

    bookingConfirmed: (date: string, time: string) => ({
        title: '✅ Rendez-vous confirmé',
        body: `Votre rendez-vous du ${date} à ${time} est confirmé`,
        data: { type: 'booking_confirmed' }
    }),

    bookingCancelled: (date: string, time: string) => ({
        title: '❌ Rendez-vous annulé',
        body: `Votre rendez-vous du ${date} à ${time} a été annulé`,
        data: { type: 'booking_cancelled' }
    }),

    bookingReminder: (date: string, time: string) => ({
        title: '⏰ Rappel de rendez-vous',
        body: `N'oubliez pas votre rendez-vous demain à ${time}`,
        data: { type: 'booking_reminder' }
    }),

    statusChanged: (status: string) => ({
        title: '📋 Statut mis à jour',
        body: `Votre rendez-vous est maintenant: ${status}`,
        data: { type: 'status_changed' }
    })
}
