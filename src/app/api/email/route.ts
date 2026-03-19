import { NextRequest, NextResponse } from 'next/server'
import {
    sendEmail,
    getBookingConfirmationEmail,
    getAppointmentCancelledEmail,
    getAppointmentReminderEmail,
    getWelcomeEmail,
    getRatingRequestEmail,
    getNewBookingAdminEmail,
    isBrevoConfigured
} from '@/lib/email/brevo'
import { getAdminEmails } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, data } = body

        if (!isBrevoConfigured()) {
            return NextResponse.json(
                { success: false, message: 'Email service not configured' },
                { status: 503 }
            )
        }

        if (!data.email) {
            return NextResponse.json(
                { success: false, message: 'Email address is required' },
                { status: 400 }
            )
        }

        let emailContent: { subject: string; html: string; text: string }

        switch (type) {
            case 'welcome':
                emailContent = getWelcomeEmail({
                    clientName: data.clientName || 'Client'
                })
                break

            case 'booking_confirmation':
                emailContent = getBookingConfirmationEmail({
                    clientName: data.clientName || 'Client',
                    date: data.date,
                    time: data.time,
                    serviceName: data.serviceName,
                    barberName: data.barberName,
                    duration: data.duration
                })
                break

            case 'appointment_cancelled':
                emailContent = getAppointmentCancelledEmail({
                    clientName: data.clientName || 'Client',
                    date: data.date,
                    time: data.time,
                    serviceName: data.serviceName
                })
                break

            case 'appointment_reminder':
                emailContent = getAppointmentReminderEmail({
                    clientName: data.clientName || 'Client',
                    date: data.date,
                    time: data.time,
                    serviceName: data.serviceName,
                    barberName: data.barberName
                })
                break

            case 'rating_request':
                emailContent = getRatingRequestEmail({
                    clientName: data.clientName || 'Client',
                    barberName: data.barberName,
                    serviceName: data.serviceName,
                    date: data.date,
                    ratingUrl: data.ratingUrl
                })
                break

            case 'new_booking_admin':
                // Get all admin emails and send notification
                const emailContent2 = getNewBookingAdminEmail({
                    clientName: data.clientName || 'Client',
                    clientEmail: data.clientEmail || data.email,
                    date: data.date,
                    time: data.time,
                    serviceName: data.serviceName,
                    barberName: data.barberName,
                    duration: data.duration
                })

                // If data.email is provided (test mode), send to that email
                // Otherwise, get admin emails from Firestore
                let adminRecipients: { email: string; name: string }[] = []
                
                if (data.email) {
                    // Test mode - send to the provided email
                    adminRecipients = [{ email: data.email, name: 'Admin Test' }]
                } else {
                    // Production mode - get admin emails from Firestore
                    const adminEmails = await getAdminEmails()
                    if (adminEmails.length === 0) {
                        console.log('No admin emails found')
                        return NextResponse.json({ success: true, message: 'No admins to notify' })
                    }
                    adminRecipients = adminEmails.map((email: string) => ({ email, name: 'Admin' }))
                }

                const adminSuccess = await sendEmail({
                    to: adminRecipients,
                    subject: emailContent2.subject,
                    htmlContent: emailContent2.html,
                    textContent: emailContent2.text
                })

                if (adminSuccess) {
                    return NextResponse.json({ success: true, message: `Notification sent to ${adminRecipients.length} recipient(s)` })
                } else {
                    return NextResponse.json(
                        { success: false, message: 'Failed to send admin notification' },
                        { status: 500 }
                    )
                }

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid email type' },
                    { status: 400 }
                )
        }

        const success = await sendEmail({
            to: [{ email: data.email, name: data.clientName }],
            subject: emailContent.subject,
            htmlContent: emailContent.html,
            textContent: emailContent.text
        })

        if (success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully' })
        } else {
            return NextResponse.json(
                { success: false, message: 'Failed to send email' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
