import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, saveTokens } from '@/lib/spotify'

/**
 * GET /api/spotify/callback?code=...
 * Handles the Spotify OAuth redirect, exchanges the code for tokens,
 * persists them, and redirects back to the admin settings page.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')
    const error = request.nextUrl.searchParams.get('error')
    const state = request.nextUrl.searchParams.get('state')
    const errorDescription = request.nextUrl.searchParams.get('error_description')

    const appUrl = request.nextUrl.origin
    let decodedState = ''
    if (state) {
        try {
            decodedState = decodeURIComponent(state)
        } catch {
            decodedState = ''
        }
    }
    const returnTo = decodedState.startsWith('/') ? decodedState : '/admin/settings'

    const withStatus = (status: 'connected' | 'error', reason?: string) => {
        const base = new URL(returnTo, appUrl)
        base.searchParams.set('spotify', status)
        if (reason) {
            base.searchParams.set('reason', reason)
        }
        return base.toString()
    }

    if (error || !code) {
        console.error('Spotify OAuth error:', error, errorDescription || '')
        const reason = error ? error.toLowerCase() : 'missing_code'
        return NextResponse.redirect(withStatus('error', reason))
    }

    try {
        const tokens = await exchangeCode(code, { origin: request.nextUrl.origin })
        await saveTokens(tokens)
        return NextResponse.redirect(withStatus('connected'))
    } catch (err) {
        console.error('Spotify token exchange failed:', err)
        const raw = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()

        let reason = 'token_exchange_failed'
        if (raw.includes('invalid_client')) {
            reason = 'invalid_client'
        } else if (raw.includes('invalid_grant')) {
            reason = 'invalid_grant'
        } else if (raw.includes('redirect_uri')) {
            reason = 'redirect_uri_mismatch'
        } else if (raw.includes('refresh token')) {
            reason = 'missing_refresh_token'
        }

        return NextResponse.redirect(withStatus('error', reason))
    }
}
