'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, Music2, QrCode, ShieldCheck } from 'lucide-react'

type SetupStep = 'admin' | 'spotify' | 'redirecting'

type SessionStatusResponse = {
    success: boolean
    status: 'pending' | 'approved'
    expires_at: string
}

type SessionCreateResponse = {
    success: boolean
    session_id: string
    expires_at: string
}

const ADMIN_APPROVAL_STORAGE_KEY = 'barbershop_tv_admin_approved_at'
const ADMIN_APPROVAL_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

function hasRecentAdminApproval(): boolean {
    if (typeof window === 'undefined') return false
    const raw = window.localStorage.getItem(ADMIN_APPROVAL_STORAGE_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts)) return false
    return Date.now() - ts < ADMIN_APPROVAL_TTL_MS
}

function rememberAdminApproval(): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_APPROVAL_STORAGE_KEY, String(Date.now()))
}

type SpotifyTokenCheck = {
    connected: boolean
    message: string | null
}

async function checkSpotifyToken(): Promise<SpotifyTokenCheck> {
    try {
        const response = await fetch('/api/spotify/token', { cache: 'no-store' })
        const data = await response.json().catch(() => null) as { message?: string } | null

        if (response.ok) {
            return { connected: true, message: null }
        }

        const message =
            typeof data?.message === 'string' && data.message.length > 0
                ? data.message
                : 'Spotify login not detected yet. Finish login on your phone, then try again.'
        return { connected: false, message }
    } catch {
        return {
            connected: false,
            message: 'Unable to verify Spotify connection right now. Try again in a few seconds.',
        }
    }
}

export default function TvSetupPage() {
    const router = useRouter()

    const [sessionId, setSessionId] = useState('')
    const [step, setStep] = useState<SetupStep>('admin')
    const [origin, setOrigin] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [spotifyStatusMessage, setSpotifyStatusMessage] = useState<string | null>(null)
    const [checkingSpotify, setCheckingSpotify] = useState(false)
    const [creatingSession, setCreatingSession] = useState(true)
    const spotifyCheckInFlight = useRef(false)
    const sessionPollInFlight = useRef(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        setOrigin(window.location.origin)
    }, [])

    useEffect(() => {
        let cancelled = false

        const createSession = async () => {
            if (hasRecentAdminApproval()) {
                if (!cancelled) {
                    setStep('spotify')
                    setCreatingSession(false)
                }
                return
            }

            setCreatingSession(true)
            setError(null)

            try {
                const response = await fetch('/api/tv/setup-session', {
                    method: 'POST',
                    cache: 'no-store',
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const data = await response.json() as SessionCreateResponse
                if (!data.session_id) {
                    throw new Error('Missing session_id in response')
                }

                if (!cancelled) {
                    setSessionId(data.session_id)
                }
            } catch (sessionError) {
                console.error('Failed to initialize TV setup session:', sessionError)
                if (!cancelled) {
                    setError('Unable to initialize TV setup flow.')
                }
            } finally {
                if (!cancelled) {
                    setCreatingSession(false)
                }
            }
        }

        void createSession()

        return () => {
            cancelled = true
        }
    }, [])

    const checkSessionStatus = useCallback(async () => {
        if (!sessionId || step !== 'admin' || sessionPollInFlight.current) return

        sessionPollInFlight.current = true
        try {
            const response = await fetch(`/api/tv/setup-session?session=${encodeURIComponent(sessionId)}`, {
                cache: 'no-store',
            })

            if (!response.ok) return

            const data = await response.json() as SessionStatusResponse
            const expiresAt = new Date(data.expires_at)
            if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
                setError('This TV setup session expired. Reload TV setup to generate a new QR code.')
                return
            }

            if (data.status === 'approved') {
                setError(null)
                rememberAdminApproval()
                setStep('spotify')
            }
        } catch (sessionError) {
            console.error('Failed to read TV setup session:', sessionError)
        } finally {
            sessionPollInFlight.current = false
        }
    }, [sessionId, step])

    useEffect(() => {
        if (step !== 'admin' || !sessionId) return

        void checkSessionStatus()
        const intervalId = window.setInterval(() => {
            void checkSessionStatus()
        }, 3000)

        return () => window.clearInterval(intervalId)
    }, [checkSessionStatus, sessionId, step])

    const checkSpotifyConnection = useCallback(async () => {
        if (spotifyCheckInFlight.current) return

        spotifyCheckInFlight.current = true
        setCheckingSpotify(true)

        try {
            const spotifyState = await checkSpotifyToken()
            if (spotifyState.connected) {
                setSpotifyStatusMessage('Spotify connected. Opening display...')
                setStep('redirecting')
                router.replace('/tv/display2')
            } else {
                setSpotifyStatusMessage(
                    spotifyState.message || 'Spotify login not detected yet. Finish login on your phone, then try again.'
                )
            }
        } catch {
            setSpotifyStatusMessage('Unable to verify Spotify connection right now. Try again in a few seconds.')
        } finally {
            spotifyCheckInFlight.current = false
            setCheckingSpotify(false)
        }
    }, [router])

    useEffect(() => {
        if (step !== 'spotify') return

        setSpotifyStatusMessage(null)
        void checkSpotifyConnection()
        const intervalId = window.setInterval(() => {
            void checkSpotifyConnection()
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [checkSpotifyConnection, step])

    const adminLoginUrl = useMemo(() => {
        if (!origin || !sessionId) return ''
        return `${origin}/tv/admin-login?session=${encodeURIComponent(sessionId)}`
    }, [origin, sessionId])

    const spotifyLoginUrl = useMemo(() => {
        if (!origin) return ''
        const params = new URLSearchParams({ returnTo: '/spotify/linked' })
        return `${origin}/api/spotify/auth?${params.toString()}`
    }, [origin])

    const adminQrImageUrl = useMemo(() => {
        if (!adminLoginUrl) return ''
        return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(adminLoginUrl)}`
    }, [adminLoginUrl])

    const spotifyQrImageUrl = useMemo(() => {
        if (!spotifyLoginUrl) return ''
        return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(spotifyLoginUrl)}`
    }, [spotifyLoginUrl])

    return (
        <main className="min-h-screen w-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
            <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 p-6 text-center">
                <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    TV Setup
                </div>

                {error && (
                    <div className="w-full max-w-3xl rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-left text-sm text-amber-100">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {creatingSession && (
                    <section className="w-full max-w-2xl rounded-3xl border border-white/15 bg-black/35 p-7 backdrop-blur-xl">
                        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-zinc-300" />
                        <p className="text-sm text-zinc-300">Preparing TV setup session...</p>
                    </section>
                )}

                {!creatingSession && step === 'admin' && (
                    <section className="w-full max-w-3xl rounded-3xl border border-white/15 bg-black/35 p-7 backdrop-blur-xl">
                        <div className="mb-5 flex items-center justify-center gap-2 text-emerald-300">
                            <ShieldCheck className="h-6 w-6" />
                            <h1 className="text-2xl font-semibold">Step 1: Admin Login</h1>
                        </div>
                        <p className="mb-5 text-sm text-zinc-300">
                            Scan this QR code with an admin phone and approve this TV session.
                        </p>

                        {adminQrImageUrl ? (
                            <img
                                src={adminQrImageUrl}
                                alt="Admin login QR code"
                                className="mx-auto h-72 w-72 rounded-2xl border border-white/20 bg-white p-3"
                            />
                        ) : (
                            <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                            </div>
                        )}

                        {adminLoginUrl && (
                            <p className="mx-auto mt-4 max-w-2xl break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-400">
                                {adminLoginUrl}
                            </p>
                        )}

                        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-400">
                            <QrCode className="h-4 w-4" />
                            <span>Waiting for admin approval...</span>
                        </div>
                    </section>
                )}

                {step === 'spotify' && (
                    <section className="w-full max-w-3xl rounded-3xl border border-white/15 bg-black/35 p-7 backdrop-blur-xl">
                        <div className="mb-5 flex items-center justify-center gap-2 text-emerald-300">
                            <Music2 className="h-6 w-6" />
                            <h1 className="text-2xl font-semibold">Step 2: Spotify Login</h1>
                        </div>
                        <p className="mb-5 text-sm text-zinc-300">
                            Connect the salon Spotify account. TV will continue automatically after login.
                        </p>

                        {spotifyQrImageUrl ? (
                            <img
                                src={spotifyQrImageUrl}
                                alt="Spotify login QR code"
                                className="mx-auto h-72 w-72 rounded-2xl border border-white/20 bg-white p-3"
                            />
                        ) : (
                            <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                            </div>
                        )}

                        {spotifyLoginUrl && (
                            <p className="mx-auto mt-4 max-w-2xl break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-400">
                                {spotifyLoginUrl}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => void checkSpotifyConnection()}
                            disabled={checkingSpotify}
                            className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {checkingSpotify ? 'Checking Spotify...' : 'I connected Spotify'}
                        </button>

                        {spotifyStatusMessage && (
                            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300">
                                {spotifyStatusMessage}
                            </p>
                        )}
                    </section>
                )}

                {step === 'redirecting' && (
                    <section className="w-full max-w-2xl rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-8">
                        <div className="mb-2 flex items-center justify-center gap-2 text-emerald-300">
                            <CheckCircle2 className="h-6 w-6" />
                            <h1 className="text-2xl font-semibold">Setup Complete</h1>
                        </div>
                        <p className="text-zinc-200">Opening display page...</p>
                    </section>
                )}
            </div>
        </main>
    )
}
