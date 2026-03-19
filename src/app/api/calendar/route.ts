import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const title = searchParams.get('title') || 'Rendez-vous Barber SHOP'
        const date = searchParams.get('date') || '' // format: dd/MM/yyyy
        const time = searchParams.get('time') || '' // format: HH:mm
        const duration = parseInt(searchParams.get('duration') || '30')
        const description = searchParams.get('description') || ''
        const location = searchParams.get('location') || 'Barber SHOP'

        if (!date || !time) {
            return NextResponse.json(
                { error: 'Date and time are required' },
                { status: 400 }
            )
        }

        // Parse the date (format: dd/MM/yyyy)
        const [day, month, year] = date.split('/')
        // Parse the time (format: HH:mm)
        const [hour, minute] = time.split(':')

        // Create start date
        const startDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
        )

        // Create end date (start + duration)
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

        // Format dates for ICS (YYYYMMDDTHHmmss)
        const formatIcsDate = (d: Date) => {
            return d.getFullYear().toString() +
                (d.getMonth() + 1).toString().padStart(2, '0') +
                d.getDate().toString().padStart(2, '0') +
                'T' +
                d.getHours().toString().padStart(2, '0') +
                d.getMinutes().toString().padStart(2, '0') +
                '00'
        }

        // Generate unique ID for the event
        const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@barbershop.com`
        const now = formatIcsDate(new Date())

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Barber SHOP//Booking//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${now}`,
            `DTSTART:${formatIcsDate(startDate)}`,
            `DTEND:${formatIcsDate(endDate)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
            `LOCATION:${location}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n')

        return new NextResponse(icsContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="rdv-barbershop.ics"'
            }
        })
    } catch (error) {
        console.error('ICS generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate calendar file' },
            { status: 500 }
        )
    }
}
