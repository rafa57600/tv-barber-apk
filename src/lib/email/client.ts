// Client-side helper functions for sending emails

export async function sendWelcomeEmail(data: {
    email: string
    clientName: string
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'welcome', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending welcome email:', error)
        return false
    }
}

export async function sendBookingConfirmationEmail(data: {
    email: string
    clientName: string
    date: string
    time: string
    serviceName: string
    barberName: string
    duration: number
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'booking_confirmation', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending confirmation email:', error)
        return false
    }
}

export async function sendAppointmentCancelledEmail(data: {
    email: string
    clientName: string
    date: string
    time: string
    serviceName: string
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'appointment_cancelled', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending cancellation email:', error)
        return false
    }
}

export async function sendAppointmentReminderEmail(data: {
    email: string
    clientName: string
    date: string
    time: string
    serviceName: string
    barberName: string
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'appointment_reminder', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending reminder email:', error)
        return false
    }
}

export async function sendRatingRequestEmail(data: {
    email: string
    clientName: string
    barberName: string
    serviceName: string
    date: string
    ratingUrl?: string
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'rating_request', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending rating request email:', error)
        return false
    }
}

// Send new booking notification to all admins/barbers
export async function sendNewBookingNotificationToAdmins(data: {
    clientName: string
    clientEmail: string
    date: string
    time: string
    serviceName: string
    barberName: string
    duration: number
}): Promise<boolean> {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'new_booking_admin', data })
        })
        return response.ok
    } catch (error) {
        console.error('Error sending admin notification email:', error)
        return false
    }
}
