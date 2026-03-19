import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebase/admin'

interface NotificationPayload {
    tokens: string[]
    title: string
    body: string
    data?: Record<string, string>
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as NotificationPayload
        const { tokens, title, body: notificationBody, data } = body

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ error: 'No tokens provided' }, { status: 400 })
        }

        if (!title || !notificationBody) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
        }

        // Check if Firebase Admin is initialized
        if (!admin.apps?.length) {
            console.error('Firebase Admin not initialized')
            return NextResponse.json({ error: 'Server not configured for notifications' }, { status: 500 })
        }

        const messaging = admin.messaging()

        // Build the message
        const message = {
            notification: {
                title,
                body: notificationBody,
            },
            webpush: {
                notification: {
                    icon: '/icon-192.png',
                    badge: '/icon-72.png',
                },
                fcmOptions: {
                    link: process.env.NEXT_PUBLIC_APP_URL || 'https://barbershoprdv.fsp57.com'
                }
            },
            data: data || {}
        }

        // Send to multiple tokens
        const results = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const response = await messaging.send({
                        ...message,
                        token
                    })
                    return { token, success: true, messageId: response }
                } catch (error) {
                    console.error(`Failed to send to token ${token}:`, error)
                    return { token, success: false, error: String(error) }
                }
            })
        )

        const successCount = results.filter(r => r.success).length
        const failCount = results.length - successCount

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failCount,
            results
        })
    } catch (error) {
        console.error('Notification error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}

