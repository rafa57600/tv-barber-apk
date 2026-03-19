import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/spotify'

/**
 * GET /api/spotify/auth
 * Redirects the user to the Spotify OAuth consent screen.
 */
export async function GET(request: NextRequest) {
    const requestedReturnTo = request.nextUrl.searchParams.get('returnTo') || '/admin/settings'
    const safeReturnTo = requestedReturnTo.startsWith('/') ? requestedReturnTo : '/admin/settings'
    const url = getAuthUrl({
        state: safeReturnTo,
        origin: request.nextUrl.origin,
    })
    return NextResponse.redirect(url)
}
