// Brevo Email Service using fetch API
// This approach is more reliable than the SDK for Next.js

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

// Get the app URL for logo and links
const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://barbershoprdv.fsp57.com'

export const isBrevoConfigured = () => {
  return !!process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your-brevo-api-key'
}

interface EmailData {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  if (!isBrevoConfigured()) {
    console.warn('Brevo not configured. Email not sent.')
    return false
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Barber SHOP',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@barbershop.com'
        },
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Brevo API error:', errorData)
      return false
    }

    console.log('Email sent successfully')
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// =============================================================================
// SVG ICONS - Minimalist line style for emails
// =============================================================================

const icons = {
  // Calendar icon
  calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  
  // Clock icon
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`,
  
  // Scissors icon
  scissors: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`,
  
  // User icon
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  
  // Timer/Duration icon
  timer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`,
  
  // Check icon
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>`,
  
  // X icon
  x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  
  // Bell icon
  bell: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  
  // Star icon
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon></svg>`,
  
  // Mail icon
  mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  
  // Alert/Warning icon
  alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
}

// Helper to wrap icon with color
const icon = (name: keyof typeof icons, color: string = '#71717a') => {
  return `<span style="display: inline-block; vertical-align: middle; margin-right: 6px; color: ${color};">${icons[name]}</span>`
}

// =============================================================================
// BASE EMAIL TEMPLATE
// Modern, clean design that works in light and dark email clients
// =============================================================================

interface BaseEmailOptions {
  title: string
  badgeText?: string
  badgeColor?: 'green' | 'red' | 'blue' | 'yellow' | 'orange'
  content: string
  footer?: string
}

function getBaseEmailTemplate(options: BaseEmailOptions): string {
  const { title, badgeText, badgeColor = 'green', content, footer } = options
  const appUrl = getAppUrl()
  
  // Badge colors
  const badgeColors = {
    green: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
    red: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    blue: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    yellow: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    orange: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' }
  }
  
  const badge = badgeColors[badgeColor]

  // Logo as inline SVG with gradient (works everywhere)
  const logoSvg = `
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1A5F1A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#166534;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="14" fill="url(#logoGrad)"/>
      <path d="M28 14C20.268 14 14 20.268 14 28C14 35.732 20.268 42 28 42C35.732 42 42 35.732 42 28C42 20.268 35.732 14 28 14ZM33 24C33.552 24 34 24.448 34 25V31C34 31.552 33.552 32 33 32C32.448 32 32 31.552 32 31V25C32 24.448 32.448 24 33 24ZM23 24C23.552 24 24 24.448 24 25V31C24 31.552 23.552 32 23 32C22.448 32 22 31.552 22 31V25C22 24.448 22.448 24 23 24ZM28 38C24.134 38 21 35.866 21 33H35C35 35.866 31.866 38 28 38Z" fill="white"/>
    </svg>
  `

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; }
    .email-body { background-color: #f4f4f5 !important; }
    .email-card { background-color: #ffffff !important; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #18181b !important; }
      .email-card { background-color: #27272a !important; }
      .email-text { color: #fafafa !important; }
      .email-muted { color: #a1a1aa !important; }
      .email-details { background-color: #3f3f46 !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-body" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    ${logoSvg}
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span class="email-text" style="font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.3px;">
                      Barber<span style="color: #1A5F1A;">SHOP</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                ${badgeText ? `
                <!-- Status Badge -->
                <tr>
                  <td align="center" style="padding: 24px 24px 0 24px;">
                    <span style="display: inline-block; background: ${badge.bg}; color: ${badge.text}; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${badge.border};">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Content -->
                <tr>
                  <td style="padding: 24px;">
                    ${content}
                  </td>
                </tr>
                
                ${footer ? `
                <!-- Footer Message -->
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <p class="email-muted" style="margin: 0; font-size: 12px; color: #71717a; text-align: center; line-height: 1.5;">
                      ${footer}
                    </p>
                  </td>
                </tr>
                ` : ''}
                
              </table>
            </td>
          </tr>
          
          <!-- Email Footer -->
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <p class="email-muted" style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa;">
                © 2025 Barber SHOP · Tous droits réservés
              </p>
              <p class="email-muted" style="margin: 0; font-size: 11px; color: #a1a1aa;">
                <a href="${appUrl}" style="color: #1A5F1A; text-decoration: none;">Visiter notre site</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>
  `
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Generate Google Calendar URL
function generateGoogleCalendarUrl(data: {
  title: string
  date: string // format: dd/MM/yyyy
  time: string // format: HH:mm
  duration: number // in minutes
  description: string
  location?: string
}): string {
  const [day, month, year] = data.date.split('/')
  const [hour, minute] = data.time.split(':')
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
  const endDate = new Date(startDate.getTime() + data.duration * 60 * 1000)

  const formatDate = (d: Date) => {
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0') +
      'T' +
      d.getHours().toString().padStart(2, '0') +
      d.getMinutes().toString().padStart(2, '0') + '00'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: data.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: data.description,
    location: data.location || 'Barber SHOP'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

// 1. Booking Confirmation Email
export function getBookingConfirmationEmail(data: {
  clientName: string
  date: string
  time: string
  serviceName: string
  barberName: string
  duration: number
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrl()
  const subject = `Rendez-vous confirmé | Barber SHOP`

  const calendarUrl = generateGoogleCalendarUrl({
    title: `Coiffure - ${data.serviceName}`,
    date: data.date,
    time: data.time,
    duration: data.duration,
    description: `Rendez-vous avec ${data.barberName}\\nService: ${data.serviceName}`
  })

  const icsParams = new URLSearchParams({
    title: `Coiffure - ${data.serviceName}`,
    date: data.date,
    time: data.time,
    duration: data.duration.toString(),
    description: `Rendez-vous avec ${data.barberName}`,
    location: 'Barber SHOP'
  })
  const icsUrl = `${appUrl}/api/calendar?${icsParams.toString()}`

  const content = `
    <!-- Greeting -->
    <p class="email-text" style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; text-align: center;">
      Bonjour <strong style="color: #18181b;">${data.clientName}</strong>,<br>
      votre rendez-vous a bien été enregistré.
    </p>
    
    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('calendar', '#71717a')} Date
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('clock', '#71717a')} Heure
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('scissors', '#71717a')} Service
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.serviceName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('user', '#71717a')} Barbier
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.barberName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('timer', '#71717a')} Durée
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.duration} minutes</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Calendar Buttons -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${calendarUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: white; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 8px; text-decoration: none; margin: 4px;">
            Google Calendar
          </a>
          <a href="${icsUrl}" download="rdv-barbershop.ics" style="display: inline-block; background: #1a1a1a; color: white; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 8px; text-decoration: none; margin: 4px;">
            Apple Calendar
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Warning -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
            ${icon('alert', '#92400e')} En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Sign off -->
    <p class="email-muted" style="margin: 0; font-size: 14px; color: #52525b; text-align: center;">
      À bientôt,<br>
      <strong class="email-text" style="color: #18181b;">L'équipe Barber SHOP</strong>
    </p>
  `

  const html = getBaseEmailTemplate({
    title: 'Confirmation de rendez-vous',
    badgeText: 'Confirmé',
    badgeColor: 'green',
    content
  })

  const text = `
RENDEZ-VOUS CONFIRMÉ

Bonjour ${data.clientName},
Votre rendez-vous a bien été enregistré.

Date: ${data.date}
Heure: ${data.time}
Service: ${data.serviceName}
Barbier: ${data.barberName}
Durée: ${data.duration} min

Ajouter à Google Calendar: ${calendarUrl}

En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.

À bientôt,
L'équipe Barber SHOP
  `

  return { subject, html, text }
}

// 2. Appointment Cancelled Email
export function getAppointmentCancelledEmail(data: {
  clientName: string
  date: string
  time: string
  serviceName: string
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrl()
  const subject = `Rendez-vous annulé | Barber SHOP`

  const content = `
    <!-- Greeting -->
    <p class="email-text" style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; text-align: center;">
      Bonjour <strong style="color: #18181b;">${data.clientName}</strong>,<br>
      votre rendez-vous a été annulé.
    </p>
    
    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('calendar', '#71717a')} Date
                </span><br>
                <span style="font-size: 15px; font-weight: 500; color: #a1a1aa; text-decoration: line-through;">${data.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('clock', '#71717a')} Heure
                </span><br>
                <span style="font-size: 15px; font-weight: 500; color: #a1a1aa; text-decoration: line-through;">${data.time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('scissors', '#71717a')} Service
                </span><br>
                <span style="font-size: 15px; font-weight: 500; color: #a1a1aa; text-decoration: line-through;">${data.serviceName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A5F1A 0%, #166534 100%); color: white; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none;">
            Reprendre un rendez-vous
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Sign off -->
    <p class="email-muted" style="margin: 0; font-size: 14px; color: #52525b; text-align: center;">
      <strong class="email-text" style="color: #18181b;">L'équipe Barber SHOP</strong>
    </p>
  `

  const html = getBaseEmailTemplate({
    title: 'Rendez-vous annulé',
    badgeText: 'Annulé',
    badgeColor: 'red',
    content
  })

  const text = `
RENDEZ-VOUS ANNULÉ

Bonjour ${data.clientName},
Votre rendez-vous a été annulé.

Date: ${data.date}
Heure: ${data.time}
Service: ${data.serviceName}

Reprendre un rendez-vous: ${appUrl}

L'équipe Barber SHOP
  `

  return { subject, html, text }
}

// 3. Appointment Reminder Email
export function getAppointmentReminderEmail(data: {
  clientName: string
  date: string
  time: string
  serviceName: string
  barberName: string
}): { subject: string; html: string; text: string } {
  const subject = `Rappel: Rendez-vous demain | Barber SHOP`

  const content = `
    <!-- Greeting -->
    <p class="email-text" style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; text-align: center;">
      Bonjour <strong style="color: #18181b;">${data.clientName}</strong>,<br>
      n'oubliez pas, votre rendez-vous est prévu <strong>demain</strong>.
    </p>
    
    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('calendar', '#71717a')} Date
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('clock', '#71717a')} Heure
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('scissors', '#71717a')} Service
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.serviceName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span class="email-muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                  ${icon('user', '#71717a')} Barbier
                </span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.barberName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Sign off -->
    <p class="email-muted" style="margin: 0; font-size: 14px; color: #52525b; text-align: center;">
      Nous vous attendons avec impatience !<br><br>
      <strong class="email-text" style="color: #18181b;">L'équipe Barber SHOP</strong>
    </p>
  `

  const html = getBaseEmailTemplate({
    title: 'Rappel de rendez-vous',
    badgeText: 'Rappel',
    badgeColor: 'blue',
    content
  })

  const text = `
RAPPEL DE RENDEZ-VOUS

Bonjour ${data.clientName},
N'oubliez pas, votre rendez-vous est prévu demain.

Date: ${data.date}
Heure: ${data.time}
Service: ${data.serviceName}
Barbier: ${data.barberName}

Nous vous attendons avec impatience !

L'équipe Barber SHOP
  `

  return { subject, html, text }
}

// 4. Welcome Email
export function getWelcomeEmail(data: {
  clientName: string
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrl()
  const subject = `Bienvenue chez Barber SHOP`

  const content = `
    <!-- Greeting -->
    <h2 class="email-text" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center;">
      Bienvenue, ${data.clientName} !
    </h2>
    
    <p class="email-text" style="margin: 0 0 24px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; text-align: center;">
      Nous sommes ravis de vous accueillir parmi nos clients.<br>
      Merci de nous avoir choisi pour prendre soin de vous.
    </p>
    
    <!-- Features -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0;">
                ${icon('check', '#1A5F1A')}
                <span class="email-text" style="font-size: 14px; color: #3f3f46;">Réservation en ligne simple et rapide</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                ${icon('scissors', '#1A5F1A')}
                <span class="email-text" style="font-size: 14px; color: #3f3f46;">Barbiers professionnels à votre service</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                ${icon('mail', '#1A5F1A')}
                <span class="email-text" style="font-size: 14px; color: #3f3f46;">Confirmations et rappels automatiques</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A5F1A 0%, #166534 100%); color: white; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none;">
            Prendre rendez-vous
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Sign off -->
    <p class="email-muted" style="margin: 0; font-size: 14px; color: #52525b; text-align: center;">
      À très bientôt,<br>
      <strong class="email-text" style="color: #18181b;">L'équipe Barber SHOP</strong>
    </p>
  `

  const html = getBaseEmailTemplate({
    title: 'Bienvenue chez Barber SHOP',
    badgeText: 'Bienvenue',
    badgeColor: 'green',
    content
  })

  const text = `
BIENVENUE CHEZ BARBER SHOP

Bonjour ${data.clientName},

Nous sommes ravis de vous accueillir parmi nos clients.
Merci de nous avoir choisi pour prendre soin de vous.

Ce que nous vous offrons :
- Réservation en ligne simple et rapide
- Barbiers professionnels à votre service
- Confirmations et rappels automatiques

Prendre rendez-vous: ${appUrl}

À très bientôt,
L'équipe Barber SHOP
  `

  return { subject, html, text }
}

// 5. Rating Request Email
export function getRatingRequestEmail(data: {
  clientName: string
  barberName: string
  serviceName: string
  date: string
  ratingUrl?: string
}): { subject: string; html: string; text: string } {
  const googleReviewUrl = 'https://g.page/r/CRVPLfSwlk7pEBM/review'
  const subject = `Donnez-nous votre avis | Barber SHOP`

  // Star icons
  const starRow = `
    <span style="color: #f59e0b; font-size: 28px; letter-spacing: 4px;">
      ${icons.star}${icons.star}${icons.star}${icons.star}${icons.star}
    </span>
  `

  const content = `
    <!-- Greeting -->
    <h2 class="email-text" style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #18181b; text-align: center;">
      Comment s'est passée votre visite ?
    </h2>
    
    <p class="email-text" style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; text-align: center;">
      Bonjour <strong>${data.clientName}</strong>,<br>
      nous espérons que votre expérience avec <strong>${data.barberName}</strong> a été agréable.
    </p>
    
    <!-- Visit Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="email-muted" style="font-size: 13px; color: #71717a; padding: 4px 0;">
                ${icon('calendar', '#71717a')} ${data.date}
              </td>
            </tr>
            <tr>
              <td class="email-muted" style="font-size: 13px; color: #71717a; padding: 4px 0;">
                ${icon('scissors', '#71717a')} ${data.serviceName}
              </td>
            </tr>
            <tr>
              <td class="email-muted" style="font-size: 13px; color: #71717a; padding: 4px 0;">
                ${icon('user', '#71717a')} ${data.barberName}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Stars -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td align="center">
          <a href="${googleReviewUrl}" target="_blank" style="text-decoration: none; color: #f59e0b;">
            ${starRow}
          </a>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${googleReviewUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #1A5F1A 0%, #166534 100%); color: white; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none;">
            Laisser un avis Google
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Sign off -->
    <p class="email-muted" style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.5;">
      Votre avis nous aide à nous améliorer.<br><br>
      Merci pour votre confiance,<br>
      <strong class="email-text" style="color: #18181b;">L'équipe Barber SHOP</strong>
    </p>
  `

  const html = getBaseEmailTemplate({
    title: 'Donnez-nous votre avis',
    badgeText: 'Avis',
    badgeColor: 'yellow',
    content
  })

  const text = `
DONNEZ-NOUS VOTRE AVIS

Bonjour ${data.clientName},

Nous espérons que votre expérience avec ${data.barberName} a été agréable.

Date: ${data.date}
Service: ${data.serviceName}
Barbier: ${data.barberName}

Laisser un avis Google: ${googleReviewUrl}

Votre avis nous aide à nous améliorer !

Merci pour votre confiance,
L'équipe Barber SHOP
  `

  return { subject, html, text }
}

// 6. New Booking Admin Notification Email
export function getNewBookingAdminEmail(data: {
  clientName: string
  clientEmail: string
  date: string
  time: string
  serviceName: string
  barberName: string
  duration: number
}): { subject: string; html: string; text: string } {
  const appUrl = getAppUrl()
  const subject = `Nouvelle réservation - ${data.clientName} le ${data.date} à ${data.time}`

  const content = `
    <!-- Alert Header -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <span style="color: white;">${icons.bell}</span>
          <h2 style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: white;">Nouvelle réservation</h2>
        </td>
      </tr>
    </table>
    
    <!-- Client Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #fef3c7; border-radius: 12px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase;">
            ${icon('user', '#92400e')} Client
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #78350f;">${data.clientName}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #92400e;">${data.clientEmail}</p>
        </td>
      </tr>
    </table>
    
    <!-- Appointment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-details" style="background: #f4f4f5; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 12px; color: #71717a;">${icon('calendar', '#71717a')} Date</span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 12px; color: #71717a;">${icon('clock', '#71717a')} Heure</span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                <span class="email-muted" style="font-size: 12px; color: #71717a;">${icon('scissors', '#71717a')} Service</span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.serviceName} (${data.duration} min)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span class="email-muted" style="font-size: 12px; color: #71717a;">${icon('user', '#71717a')} Barbier</span><br>
                <span class="email-text" style="font-size: 15px; font-weight: 600; color: #18181b;">${data.barberName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${appUrl}/admin/appointments" style="display: inline-block; background: linear-gradient(135deg, #1A5F1A 0%, #166534 100%); color: white; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 50px; text-decoration: none;">
            Voir les rendez-vous
          </a>
        </td>
      </tr>
    </table>
  `

  const html = getBaseEmailTemplate({
    title: 'Nouvelle réservation',
    content,
    footer: 'BARBER SHOP - Notification automatique'
  })

  const text = `
NOUVELLE RÉSERVATION

Client: ${data.clientName}
Email: ${data.clientEmail}

Date: ${data.date}
Heure: ${data.time}
Service: ${data.serviceName} (${data.duration} min)
Barbier: ${data.barberName}

Voir les rendez-vous: ${appUrl}/admin/appointments

BARBER SHOP
  `

  return { subject, html, text }
}
