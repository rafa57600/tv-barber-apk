/**
 * Spotify Web Playback SDK helpers.
 * Server-side token management via Firebase Admin SDK.
 */
import admin from '@/lib/firebase/admin'

const SPOTIFY_TOKEN_DOC = 'config/spotify_tokens'
const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
]

export const SPOTIFY_SCOPES = SCOPES.join(' ')

interface StoredTokens {
    access_token: string
    refresh_token: string
    expires_at: number // Unix seconds
    updated_at: FirebaseFirestore.Timestamp
}

type SpotifyStatusReason =
    | 'connected'
    | 'not_connected'
    | 'missing_credentials'
    | 'missing_refresh_token'
    | 'invalid_token_document'
    | 'storage_error'
    | 'refresh_failed'

export interface SpotifyConnectionStatus {
    connected: boolean
    reason: SpotifyStatusReason
    message: string
    access_token?: string
}

function getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function hasSpotifyCredentials(): boolean {
    return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}

function summarizeSpotifyError(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message.length > 220 ? `${error.message.slice(0, 220)}...` : error.message
    }
    const fallback = String(error)
    return fallback.length > 220 ? `${fallback.slice(0, 220)}...` : fallback
}

export function getRedirectUri(origin?: string): string {
    if (process.env.SPOTIFY_REDIRECT_URI) {
        return process.env.SPOTIFY_REDIRECT_URI
    }
    if (origin) {
        return `${origin}/api/spotify/callback`
    }
    return `${getAppUrl()}/api/spotify/callback`
}

export function getAuthUrl(options?: { state?: string; origin?: string }): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID || '',
        scope: SPOTIFY_SCOPES,
        redirect_uri: getRedirectUri(options?.origin),
        show_dialog: 'true',
    })
    if (options?.state) {
        params.set('state', options.state)
    }
    return `https://accounts.spotify.com/authorize?${params.toString()}`
}

/** Exchange authorization code for access + refresh tokens. */
export async function exchangeCode(code: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
}>
export async function exchangeCode(code: string, options: { origin?: string }): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
}>
export async function exchangeCode(code: string, options?: { origin?: string }): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
}> {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: getRedirectUri(options?.origin),
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Spotify token exchange failed: ${text}`)
    }

    return res.json()
}

/** Refresh an expired access token. */
async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    expires_in: number
    refresh_token?: string
}> {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Spotify token refresh failed: ${text}`)
    }

    return res.json()
}

/**
 * Persist latest Spotify tokens in Firestore.
 * If refresh token is omitted by Spotify, we keep the existing one.
 */
export async function saveTokens(data: {
    access_token: string
    refresh_token?: string
    expires_in: number
}): Promise<void> {
    const db = admin.firestore()
    let refreshToken = data.refresh_token

    if (!refreshToken) {
        const existingSnap = await db.doc(SPOTIFY_TOKEN_DOC).get()
        const existingData = existingSnap.data() as Partial<StoredTokens> | undefined
        if (typeof existingData?.refresh_token === 'string' && existingData.refresh_token) {
            refreshToken = existingData.refresh_token
        }
    }

    if (!refreshToken) {
        throw new Error('Spotify did not return a refresh token. Reconnect and approve again.')
    }

    await db.doc(SPOTIFY_TOKEN_DOC).set({
        access_token: data.access_token,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in - 60, // 1 min buffer
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })
}

/**
 * Get current Spotify connection status and a valid access token when available.
 */
export async function getSpotifyConnectionStatus(): Promise<SpotifyConnectionStatus> {
    if (!hasSpotifyCredentials()) {
        return {
            connected: false,
            reason: 'missing_credentials',
            message: 'Spotify server credentials are missing (SPOTIFY_CLIENT_ID/SECRET).',
        }
    }

    const db = admin.firestore()

    let snap: FirebaseFirestore.DocumentSnapshot
    try {
        snap = await db.doc(SPOTIFY_TOKEN_DOC).get()
    } catch (error) {
        const details = summarizeSpotifyError(error)
        return {
            connected: false,
            reason: 'storage_error',
            message: `Cannot read Spotify token storage: ${details}`,
        }
    }

    if (!snap.exists) {
        return {
            connected: false,
            reason: 'not_connected',
            message: 'Spotify account is not connected yet. Complete QR login first.',
        }
    }

    const data = snap.data() as Partial<StoredTokens> | undefined
    if (!data || typeof data.access_token !== 'string' || typeof data.expires_at !== 'number') {
        return {
            connected: false,
            reason: 'invalid_token_document',
            message: 'Stored Spotify token data is invalid. Reconnect Spotify.',
        }
    }

    const now = Math.floor(Date.now() / 1000)
    if (data.expires_at > now) {
        return {
            connected: true,
            reason: 'connected',
            message: 'Spotify connected.',
            access_token: data.access_token,
        }
    }

    if (typeof data.refresh_token !== 'string' || data.refresh_token.length === 0) {
        return {
            connected: false,
            reason: 'missing_refresh_token',
            message: 'Spotify refresh token is missing. Reconnect Spotify using QR login.',
        }
    }

    try {
        const refreshed = await refreshAccessToken(data.refresh_token)
        const accessToken = refreshed.access_token
        const refreshToken = refreshed.refresh_token || data.refresh_token
        const expiresAt = now + refreshed.expires_in - 60

        await db.doc(SPOTIFY_TOKEN_DOC).update({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

        return {
            connected: true,
            reason: 'connected',
            message: 'Spotify connected.',
            access_token: accessToken,
        }
    } catch (error) {
        const details = summarizeSpotifyError(error)
        return {
            connected: false,
            reason: 'refresh_failed',
            message: `Spotify token refresh failed: ${details}`,
        }
    }
}

/**
 * Get a fresh access token.
 * Returns `null` if Spotify is not connected/valid yet.
 */
export async function getAccessToken(): Promise<string | null> {
    const status = await getSpotifyConnectionStatus()
    return status.connected ? status.access_token ?? null : null
}
