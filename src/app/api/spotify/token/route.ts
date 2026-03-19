import { NextResponse } from 'next/server'
import { getSpotifyConnectionStatus } from '@/lib/spotify'

/**
 * GET /api/spotify/token
 * Returns a fresh Spotify access token (auto-refreshes if needed).
 * Used by the Web Playback SDK on display pages.
 */
export async function GET() {
    try {
        const status = await getSpotifyConnectionStatus()

        if (!status.connected || !status.access_token) {
            const statusCode =
                status.reason === 'not_connected' ||
                status.reason === 'missing_refresh_token' ||
                status.reason === 'refresh_failed'
                    ? 401
                    : 500

            return NextResponse.json(
                {
                    error: status.reason,
                    message: status.message,
                },
                { status: statusCode }
            )
        }

        return NextResponse.json({
            access_token: status.access_token,
            message: status.message,
        })
    } catch (error) {
        console.error('Error getting Spotify token:', error)
        return NextResponse.json(
            { error: 'server_error', message: 'Failed to get Spotify token' },
            { status: 500 }
        )
    }
}
