'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, Music, QrCode, Wifi, WifiOff, X } from 'lucide-react'
import { useSpotifySDK } from '@/hooks/useSpotifySDK'
import { subscribeToDisplayState, updateDisplayState } from '@/lib/firebase/firestore'
import type { SpotifyPlaybackState } from '@/hooks/useSpotifySDK'

// ─── Public ref API (for announcement ducking) ──────────────────────────────

export interface SpotifyPlayerRef {
    pause: () => void
    resume: () => void
    nextTrack: () => void
    previousTrack: () => void
    seekForward: () => void
    toggleMute: () => void
    openSpotifyLogin: () => void
    closeSpotifyLogin: () => boolean
}

interface SpotifyPlayerProps {
    displayId: 'display1' | 'display2' | 'display3'
    className?: string
    /** Called when playback state updates (for parent UI) */
    onPlaybackUpdate?: (state: SpotifyPlaybackState | null) => void
    /** Ref-like callback so parent can imperatively pause/resume for announcements */
    onControlsReady?: (ref: SpotifyPlayerRef) => void
}

/**
 * Extract a Spotify URI from a URL or raw input.
 */
export function extractSpotifyUri(input: string): string | null {
    const trimmed = input.trim()
    if (trimmed.startsWith('spotify:')) return trimmed

    const urlMatch = trimmed.match(
        /(?:open\.spotify\.com)\/(track|album|playlist|artist|show|episode)\/([a-zA-Z0-9]+)/
    )
    if (urlMatch) return `spotify:${urlMatch[1]}:${urlMatch[2]}`

    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return `spotify:playlist:${trimmed}`

    return null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpotifyPlayer({ displayId, className, onPlaybackUpdate, onControlsReady }: SpotifyPlayerProps) {

    const { ready, connected, connectionMode, needsAuth, error, playback, controls, deviceId, isAndroidApp } = useSpotifySDK(
        `Fly Barbershop ${displayId}`
    )
    const {
        play,
        setVolume,
        nextTrack,
        previousTrack,
        seekForward,
        pause,
        resume,
    } = controls

    const lastCommandTsRef = useRef(0)
    const currentUriRef = useRef('')
    const isMutedRef = useRef(false)
    const volumeRef = useRef(0.8)
    const firstSnapshotRef = useRef(true)
    const [showQrOverlay, setShowQrOverlay] = useState(false)
    const [spotifyLinked, setSpotifyLinked] = useState<boolean | null>(null)
    const [spotifyLinkStatusMessage, setSpotifyLinkStatusMessage] = useState<string | null>(null)
    const [checkingSpotifyLink, setCheckingSpotifyLink] = useState(false)
    
    // DRM error only applies if we ARE NOT in the Android App (which handles DRM itself)
    const isUnsupportedPlayback =
        !isAndroidApp && !!error && /not supported|drm|widevine|failed on this tv\/webview/i.test(error)

    const phoneLoginPath = useMemo(() => {
        const params = new URLSearchParams({ returnTo: '/spotify/linked' })
        return `/api/spotify/auth?${params.toString()}`
    }, [])

    const phoneLoginUrl = useMemo(() => {
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}${phoneLoginPath}`
    }, [phoneLoginPath])

    const qrImageUrl = useMemo(() => {
        if (!phoneLoginUrl) return ''
        return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(phoneLoginUrl)}`
    }, [phoneLoginUrl])

    const checkSpotifyLinked = useCallback(async () => {
        setCheckingSpotifyLink(true)
        try {
            const response = await fetch('/api/spotify/token', { cache: 'no-store' })
            const data = await response.json().catch(() => null) as { message?: string } | null
            setSpotifyLinked(response.ok)
            if (response.ok) {
                setSpotifyLinkStatusMessage('Spotify account detected.')
            } else {
                setSpotifyLinkStatusMessage(
                    typeof data?.message === 'string' && data.message.length > 0
                        ? data.message
                        : 'Spotify connection not detected yet.'
                )
            }
        } catch {
            setSpotifyLinked(false)
            setSpotifyLinkStatusMessage('Unable to verify Spotify connection right now.')
        } finally {
            setCheckingSpotifyLink(false)
        }
    }, [])

    const toggleMute = useCallback(() => {
        const nextMuted = !isMutedRef.current
        isMutedRef.current = nextMuted
        setVolume(nextMuted ? 0 : volumeRef.current)
        updateDisplayState(displayId, { isMuted: nextMuted }).catch(() => {})
    }, [displayId, setVolume])

    const openSpotifyLogin = useCallback(() => {
        setShowQrOverlay(true)
    }, [])

    const closeSpotifyLogin = useCallback(() => {
        if (!showQrOverlay) return false
        setShowQrOverlay(false)
        return true
    }, [showQrOverlay])

    // Expose pause/resume to parent for announcement ducking
    useEffect(() => {
        onControlsReady?.({
            pause,
            resume,
            nextTrack,
            previousTrack,
            seekForward: () => seekForward(),
            toggleMute,
            openSpotifyLogin,
            closeSpotifyLogin,
        })
    }, [pause, resume, nextTrack, previousTrack, seekForward, toggleMute, openSpotifyLogin, closeSpotifyLogin, onControlsReady])

    // Forward playback state to parent
    useEffect(() => {
        onPlaybackUpdate?.(playback)
    }, [playback, onPlaybackUpdate])

    // ── Subscribe to Firestore commands from the remote ──────────────────
    useEffect(() => {
        if (!ready || !deviceId) return

        firstSnapshotRef.current = true

        const unsubscribe = subscribeToDisplayState(displayId, (state) => {
            if (firstSnapshotRef.current) {
                firstSnapshotRef.current = false
                lastCommandTsRef.current = state.commandTs || 0
            }

            // Handle URI change → start playing new content
            if (state.spotifyUri && state.spotifyUri !== currentUriRef.current) {
                currentUriRef.current = state.spotifyUri
                play(state.spotifyUri)
            }

            // Handle mute
            isMutedRef.current = state.isMuted
            volumeRef.current = Math.max(0, Math.min(1, state.volume / 100))
            setVolume(state.isMuted ? 0 : volumeRef.current)

            // Handle instant commands (next, prev, forward)
            if (state.commandTs && state.commandTs !== lastCommandTsRef.current) {
                lastCommandTsRef.current = state.commandTs
                switch (state.command) {
                    case 'next':
                        nextTrack()
                        break
                    case 'prev':
                        previousTrack()
                        break
                    case 'forward':
                        seekForward()
                        break
                }
                // Clear the command after executing
                updateDisplayState(displayId, { command: null }).catch(() => {})
            }
        })

        return () => unsubscribe()
    }, [ready, deviceId, displayId, play, setVolume, nextTrack, previousTrack, seekForward])

    // ── Auto-play default playlist on first connect ──────────────────────
    useEffect(() => {
        if (!ready || !deviceId) return
        if (currentUriRef.current) return // Already playing something

        const defaultUri = 'spotify:playlist:37i9dQZF1DWWQRwui0ExPn'
        currentUriRef.current = defaultUri
        play(defaultUri)
    }, [ready, deviceId, play])

    const isShowingAnyQr = isUnsupportedPlayback || needsAuth || showQrOverlay

    useEffect(() => {
        if (!isShowingAnyQr) return

        void checkSpotifyLinked()
        const intervalId = window.setInterval(() => {
            void checkSpotifyLinked()
        }, 3000)

        return () => window.clearInterval(intervalId)
    }, [checkSpotifyLinked, isShowingAnyQr])

    const renderQrLogin = (title: string, subtitle: string) => (
        <div className={`${className} flex flex-col items-center justify-center bg-zinc-900 text-white gap-4 p-6 text-center`}>
            <QrCode className="w-12 h-12 text-green-500" />
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-zinc-400 max-w-md">{subtitle}</p>

            {qrImageUrl ? (
                <img
                    src={qrImageUrl}
                    alt="QR code login Spotify"
                    className="h-56 w-56 rounded-2xl border border-white/20 bg-white p-3"
                />
            ) : (
                <p className="text-xs text-zinc-500">QR indisponible, utilisez le bouton ci-dessous.</p>
            )}

            <a
                href={phoneLoginPath}
                className="rounded-full bg-green-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-green-400 transition-colors"
            >
                Ouvrir login Spotify
            </a>

            {phoneLoginUrl && (
                <p className="max-w-lg break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-zinc-400">
                    {phoneLoginUrl}
                </p>
            )}

            {spotifyLinked === true && (
                <div className="mt-4 max-w-md w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                    <p className="font-semibold text-emerald-300">Compte lié avec succès !</p>
                    {isAndroidApp && !connected ? (
                        <p className="mt-2 text-xs text-emerald-200/80">
                            Veuillez ouvrir l&apos;application <strong>Spotify TV</strong> via le menu de la télévision pour démarrer la lecture.
                        </p>
                    ) : (
                        <p className="mt-2 text-xs text-emerald-200/80">
                            Fermeture automatique dans quelques instants...
                        </p>
                    )}
                </div>
            )}
        </div>
    )

    // ── Render ───────────────────────────────────────────────────────────

    if (isUnsupportedPlayback) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-zinc-900 text-white gap-3 p-6 text-center`}>
                <QrCode className="w-12 h-12 text-green-500" />
                <p className="text-lg font-semibold">Connexion Spotify par mobile</p>
                <p className="max-w-xl text-sm text-zinc-400">
                    Scannez le QR code et connectez le compte Spotify sur votre telephone.
                    Sur emulateur TV, la lecture doit etre lancee depuis le mobile.
                </p>

                {qrImageUrl ? (
                    <img
                        src={qrImageUrl}
                        alt="QR code login Spotify"
                        className="h-56 w-56 rounded-2xl border border-white/20 bg-white p-3"
                    />
                ) : (
                    <p className="text-xs text-zinc-500">QR indisponible, utilisez le lien ci-dessous.</p>
                )}

                <a
                    href={phoneLoginPath}
                    className="rounded-full bg-green-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-green-400 transition-colors"
                >
                    Ouvrir login Spotify
                </a>

                <button
                    type="button"
                    onClick={() => void checkSpotifyLinked()}
                    disabled={checkingSpotifyLink}
                    className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 disabled:opacity-60"
                >
                    {checkingSpotifyLink ? 'Verification...' : 'Verifier la connexion Spotify'}
                </button>

                {spotifyLinked === true && (
                    <p className="max-w-xl text-xs text-emerald-300">
                        {spotifyLinkStatusMessage || 'Compte Spotify detecte. Sur emulateur, la lecture locale peut rester indisponible.'}
                    </p>
                )}
                {spotifyLinked === false && (
                    <p className="max-w-xl text-xs text-zinc-400">
                        {spotifyLinkStatusMessage || 'Connexion Spotify non detectee pour le moment.'}
                    </p>
                )}
            </div>
        )
    }

    if (needsAuth) {
        return renderQrLogin(
            'Connectez Spotify avec votre telephone',
            'Scannez le QR code, connectez le compte du salon, puis revenez sur la TV.'
        )
    }

    if (error && !ready) {
        return renderQrLogin('Spotify indisponible', error)
    }

    if (!ready) {
        if (showQrOverlay) {
            return renderQrLogin(
                'Connectez Spotify avec votre telephone',
                'Scannez le QR code pendant le chargement pour lier le compte du salon.'
            )
        }

        return (
            <div className={`${className} flex flex-col items-center justify-center bg-zinc-900 text-white gap-3 p-6 text-center`}>
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-400">Connexion a Spotify...</p>
                <button
                    type="button"
                    onClick={() => setShowQrOverlay(true)}
                    className="mt-1 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-500/25"
                >
                    Afficher QR Login
                </button>
            </div>
        )
    }

    const track = playback?.track
    const albumArt = track?.album?.images?.[0]?.url

    return (
        <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden`}>
            {/* Album art background (blurred) */}
            {albumArt && (
                <div className="absolute inset-0">
                    <img src={albumArt} alt="" className="w-full h-full object-cover blur-3xl opacity-30 scale-110" />
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-4 p-6">
                {/* Connection status */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    {connected
                        ? <><Wifi className="w-3 h-3 text-green-500" /><span className="text-green-500">{connectionMode === 'fallback' ? 'Web API (Fallback)' : isAndroidApp ? 'Spotify App SDK' : 'Spotify Connect'}</span></>
                        : <><WifiOff className="w-3 h-3" /><span>Deconnecte</span></>
                    }
                </div>

                {/* Album art */}
                {albumArt ? (
                    <img
                        src={albumArt}
                        alt={track?.album?.name || ''}
                        className="w-48 h-48 rounded-2xl shadow-2xl shadow-black/60"
                    />
                ) : (
                    <div className="w-48 h-48 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Music className="w-16 h-16 text-zinc-600" />
                    </div>
                )}

                {/* Track info / Image Fallback */}
                {track ? (
                    <div className="text-center max-w-xs">
                        <p className="text-lg font-bold truncate">{track.name}</p>
                        <p className="text-sm text-zinc-400 truncate">
                            {track.artists.map((a) => a.name).join(', ')}
                        </p>
                        {track.album.name && <p className="text-xs text-zinc-500 truncate">{track.album.name}</p>}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-zinc-400">En attente de lecture...</p>
                    </div>
                )}

                {/* Playback indicator */}
                {playback && !playback.paused && (
                    <div className="flex items-center gap-1">
                        {[10, 18, 14, 22].map((height, i) => (
                            <div
                                key={i}
                                className="w-1 bg-green-500 rounded-full animate-pulse"
                                style={{
                                    height: `${height}px`,
                                    animationDelay: `${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showQrOverlay && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6">
                    <div className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-zinc-900/95 p-6 text-center shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setShowQrOverlay(false)}
                            className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/30 p-2 text-white/80 hover:bg-black/50"
                            aria-label="Fermer QR"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {spotifyLinked === true ? (
                            <div className="text-center py-6">
                                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
                                <p className="mb-2 text-xl font-bold text-white">Compte lié avec succès !</p>
                                {isAndroidApp && !connected ? (
                                    <p className="text-sm text-zinc-300 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        Pour lancer la musique, veuillez quitter cet écran et ouvrir l&apos;application <strong>Spotify TV</strong> déjà installée sur cette télévision.
                                    </p>
                                ) : (
                                    <p className="text-sm text-zinc-300">
                                        Le contrôle à distance est désormais disponible.
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowQrOverlay(false)}
                                    className="mt-6 inline-flex rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
                                >
                                    Fermer
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="mb-1 text-lg font-semibold text-white">Login Spotify par QR</p>
                                <p className="mb-4 text-sm text-zinc-400">Scannez avec votre telephone pour connecter le compte du salon.</p>

                                {qrImageUrl ? (
                                    <img
                                        src={qrImageUrl}
                                        alt="QR code login Spotify"
                                        className="mx-auto h-64 w-64 rounded-2xl border border-white/20 bg-white p-3"
                                    />
                                ) : (
                                    <p className="text-xs text-zinc-500">QR indisponible, utilisez le bouton ci-dessous.</p>
                                )}

                                <a
                                    href={phoneLoginPath}
                                    className="mt-4 inline-flex rounded-full bg-green-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-green-400"
                                >
                                    Ouvrir login Spotify
                                </a>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
