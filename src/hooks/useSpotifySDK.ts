'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Global Interface for Android Bridge ──────────────────────────────────────

declare global {
    interface Window {
        SpotifyBridge?: {
            play: (uri: string) => void
            pause: () => void
            resume: () => void
            skipNext: () => void
            skipPrevious: () => void
            isConnected: () => boolean
        }
        onAndroidSpotifyEvent?: (event: string, data: any) => void
    }
}

// ─── Spotify SDK global types ────────────────────────────────────────────────

interface SpotifyTrack {
    uri: string
    name: string
    artists: { name: string }[]
    album: { name: string; images: { url: string }[] }
    duration_ms: number
}

export interface SpotifyPlaybackState {
    paused: boolean
    position: number
    duration: number
    track: SpotifyTrack | null
}

export interface SpotifySDKControls {
    /** Toggle play / pause */
    togglePlay: () => void
    /** Next track */
    nextTrack: () => void
    /** Previous track */
    previousTrack: () => void
    /** Skip forward by `ms` milliseconds (default 15 s) */
    seekForward: (ms?: number) => void
    /** Set volume 0–1 */
    setVolume: (v: number) => void
    /** Start playing a Spotify URI (playlist, album, track) */
    play: (spotifyUri: string) => void
    /** Pause playback */
    pause: () => void
    /** Resume playback */
    resume: () => void
}

interface UseSpotifySDKReturn {
    ready: boolean
    connected: boolean
    needsAuth: boolean
    error: string | null
    playback: SpotifyPlaybackState | null
    controls: SpotifySDKControls
    deviceId: string | null
    isAndroidApp: boolean
}

// ─── Global SDK script loader ────────────────────────────────────────────────

let sdkScriptLoaded = false

function loadSDKScript(): Promise<void> {
    if (sdkScriptLoaded) return Promise.resolve()
    if (typeof window === 'undefined') return Promise.resolve()

    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('spotify-sdk-script') as HTMLScriptElement | null
        const maybeSpotify = (window as unknown as Record<string, unknown>).Spotify
        if (existingScript && maybeSpotify) {
            sdkScriptLoaded = true
            resolve()
            return
        }

        const timeoutId = window.setTimeout(() => {
            reject(new Error('Spotify SDK load timeout'))
        }, 12000)

        const script = existingScript || document.createElement('script')
        if (!existingScript) {
            script.id = 'spotify-sdk-script'
            script.src = 'https://sdk.scdn.co/spotify-player.js'
            script.async = true
            script.onerror = () => {
                window.clearTimeout(timeoutId)
                reject(new Error('Failed to load Spotify SDK script'))
            }
            document.body.appendChild(script)
        }

        // The SDK calls window.onSpotifyWebPlaybackSDKReady when loaded
        const prev = (window as unknown as Record<string, unknown>).onSpotifyWebPlaybackSDKReady as (() => void) | undefined
        ;(window as unknown as Record<string, (() => void) | undefined>).onSpotifyWebPlaybackSDKReady = () => {
            window.clearTimeout(timeoutId)
            sdkScriptLoaded = true
            prev?.()
            resolve()
        }
    })
}

// ─── Fetch fresh token from our API ──────────────────────────────────────────

async function fetchToken(): Promise<string | null> {
    try {
        const res = await fetch('/api/spotify/token', { cache: 'no-store' })
        if (!res.ok) return null
        const data = await res.json()
        return data.access_token ?? null
    } catch {
        return null
    }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSpotifySDK(playerName: string = 'BarberSHOP Display'): UseSpotifySDKReturn {
    const [ready, setReady] = useState(false)
    const [connected, setConnected] = useState(false)
    const [needsAuth, setNeedsAuth] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null)
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [isAndroidApp, setIsAndroidApp] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null)
    const tokenRef = useRef<string | null>(null)
    const activationCleanupRef = useRef<(() => void) | null>(null)
    const retryTimerRef = useRef<number | null>(null)
    const deviceIdRef = useRef<string | null>(null)
    const lastRequestedUriRef = useRef<string>('spotify:playlist:37i9dQZF1DWWQRwui0ExPn')

    // ── Android Bridge Integration ────────────────────────────────────────

    useEffect(() => {
        if (typeof window === 'undefined') return
        
        if (window.SpotifyBridge) {
            console.log('SpotifyBridge detected! Using Android Native SDK.')
            setIsAndroidApp(true)
            setReady(true)
            setConnected(window.SpotifyBridge.isConnected())
            setNeedsAuth(false)
            setDeviceId('android-native-device')

            window.onAndroidSpotifyEvent = (event: string, data: any) => {
                switch (event) {
                    case 'onSpotifyConnected':
                        setConnected(Boolean(data))
                        break
                    case 'onSpotifyPlaybackState':
                        const state = typeof data === 'string' ? JSON.parse(data) : data
                        setPlayback({
                            paused: state.paused,
                            position: state.position,
                            duration: state.track?.duration || 0,
                            track: state.track ? {
                                uri: state.track.uri,
                                name: state.track.name,
                                artists: [{ name: state.track.artist }],
                                album: { name: '', images: [] }, // Android SDK art is separate
                                duration_ms: state.track.duration
                            } : null
                        })
                        break
                }
            }
        }
    }, [])

    const startPlayback = useCallback(async (spotifyUri: string): Promise<boolean> => {
        if (window.SpotifyBridge) {
            window.SpotifyBridge.play(spotifyUri)
            return true
        }

        lastRequestedUriRef.current = spotifyUri
        const targetDeviceId = deviceIdRef.current
        if (!targetDeviceId) return false

        const freshToken = await fetchToken()
        if (!freshToken) {
            setNeedsAuth(true)
            setReady(false)
            setConnected(false)
            setError('Spotify non connecte')
            return false
        }

        tokenRef.current = freshToken
        const body: Record<string, unknown> = {}
        if (spotifyUri.includes(':track:')) {
            body.uris = [spotifyUri]
        } else {
            body.context_uri = spotifyUri
        }

        try {
            const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${freshToken}`,
                },
                body: JSON.stringify(body),
            })
            return res.ok
        } catch (err) {
            console.error('Spotify play error:', err)
            return false
        }
    }, [])

    const ensureContextLoaded = useCallback(async (): Promise<boolean> => {
        if (window.SpotifyBridge) return true
        
        const player = playerRef.current
        if (!player) return false

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const state = await player.getCurrentState() as any
            if (state?.track_window?.current_track) {
                return true
            }
        } catch {}
        return startPlayback(lastRequestedUriRef.current)
    }, [startPlayback])

    // ── Initialise the SDK player (only if not Android Bridge) ─────────────

    useEffect(() => {
        if (typeof window === 'undefined' || window.SpotifyBridge) return

        let destroyed = false
        const clearRetry = () => {
            if (retryTimerRef.current !== null) {
                window.clearTimeout(retryTimerRef.current)
                retryTimerRef.current = null
            }
        }

        const scheduleRetry = (delayMs: number = 8000) => {
            if (destroyed) return
            clearRetry()
            retryTimerRef.current = window.setTimeout(() => {
                void init()
            }, delayMs)
        }

        async function init() {
            try {
                setError(null)
                const token = await fetchToken()
                if (destroyed) return

                if (!token) {
                    setNeedsAuth(true)
                    setReady(false)
                    setConnected(false)
                    setError('Spotify non connecte')
                    scheduleRetry(5000)
                    return
                }

                tokenRef.current = token
                setNeedsAuth(false)
                if (playerRef.current) return

                await loadSDKScript()
                if (destroyed) return

                const Spotify = (window as unknown as Record<string, any>).Spotify
                if (!Spotify) {
                    setError('SDK Spotify indisponible sur cet appareil')
                    scheduleRetry(10000)
                    return
                }

                const player = new Spotify.Player({
                    name: playerName,
                    getOAuthToken: (cb: (t: string) => void) => {
                        fetchToken().then((t) => {
                            if (t) {
                                tokenRef.current = t
                                cb(t)
                            }
                        })
                    },
                    volume: 0.8,
                })

                const activatePlayer = () => {
                    player.activateElement?.()
                    window.removeEventListener('click', activatePlayer)
                    window.removeEventListener('keydown', activatePlayer)
                    window.removeEventListener('touchstart', activatePlayer)
                }

                window.addEventListener('click', activatePlayer)
                window.addEventListener('keydown', activatePlayer)
                window.addEventListener('touchstart', activatePlayer)

                activationCleanupRef.current = () => {
                    window.removeEventListener('click', activatePlayer)
                    window.removeEventListener('keydown', activatePlayer)
                    window.removeEventListener('touchstart', activatePlayer)
                }

                player.addListener('ready', ({ device_id }: { device_id: string }) => {
                    if (destroyed) return
                    deviceIdRef.current = device_id
                    setDeviceId(device_id)
                    setReady(true)
                    setConnected(true)
                    setNeedsAuth(false)
                    setError(null)
                    clearRetry()
                })

                player.addListener('not_ready', () => {
                    if (destroyed) return
                    setConnected(false)
                })

                player.addListener('player_state_changed', (state: unknown) => {
                    if (destroyed || !state) return
                    const s = state as any
                    const currentTrack = s.track_window?.current_track ?? null
                    if (currentTrack?.uri) lastRequestedUriRef.current = currentTrack.uri

                    setPlayback({
                        paused: s.paused,
                        position: s.position,
                        duration: s.duration,
                        track: currentTrack ? {
                            uri: currentTrack.uri,
                            name: currentTrack.name,
                            artists: currentTrack.artists,
                            album: currentTrack.album,
                            duration_ms: currentTrack.duration_ms,
                        } : null,
                    })
                })

                player.addListener('initialization_error', ({ message }: { message: string }) => {
                    if (destroyed) return
                    const normalized = message.toLowerCase()
                    if (normalized.includes('failed to initialize player')) {
                        setNeedsAuth(false)
                        setReady(false)
                        setConnected(false)
                        setError('Spotify player initialization failed on this TV/WebView. DRM support is likely missing.')
                        clearRetry()
                        return
                    }
                    setError(`Erreur d'initialisation Spotify: ${message}`)
                })

                player.addListener('authentication_error', ({ message }: { message: string }) => {
                    if (destroyed) return
                    setNeedsAuth(true)
                    setReady(false)
                    setConnected(false)
                    deviceIdRef.current = null
                    setError('Session Spotify invalide. Reconnectez le compte.')
                    player.disconnect()
                    playerRef.current = null
                    scheduleRetry(4000)
                })

                player.addListener('account_error', ({ message }: { message: string }) => {
                    if (destroyed) return
                    setError('Compte Spotify Premium requis pour la lecture TV')
                })

                player.addListener('playback_error', ({ message }: { message: string }) => {
                    if (destroyed) return
                    const normalized = message.toLowerCase()
                    if (normalized.includes('no list was loaded')) {
                        void startPlayback(lastRequestedUriRef.current)
                        return
                    }
                    setError(`Erreur de lecture: ${message}`)
                })

                const didConnect = await player.connect()
                if (!didConnect && !destroyed) {
                    setError('Connexion Spotify impossible sur cet appareil')
                    setReady(false)
                    setConnected(false)
                    scheduleRetry(8000)
                    return
                }
                playerRef.current = player
            } catch (err) {
                if (destroyed) return
                setError('Impossible de connecter Spotify pour le moment')
                setReady(false)
                setConnected(false)
                scheduleRetry(10000)
            }
        }

        init()

        return () => {
            destroyed = true
            clearRetry()
            activationCleanupRef.current?.()
            activationCleanupRef.current = null
            playerRef.current?.disconnect()
            playerRef.current = null
            deviceIdRef.current = null
        }
    }, [playerName, startPlayback])

    // ── Control helpers ──────────────────────────────────────────────────

    const togglePlay = useCallback(() => {
        if (window.SpotifyBridge) {
            if (playback?.paused) window.SpotifyBridge.resume()
            else window.SpotifyBridge.pause()
            return
        }
        void ensureContextLoaded().then((hasContext) => {
            if (hasContext) playerRef.current?.togglePlay()
        })
    }, [ensureContextLoaded, playback?.paused])

    const nextTrack = useCallback(() => {
        if (window.SpotifyBridge) {
            window.SpotifyBridge.skipNext()
            return
        }
        void ensureContextLoaded().then((hasContext) => {
            if (hasContext) playerRef.current?.nextTrack()
        })
    }, [ensureContextLoaded])

    const previousTrack = useCallback(() => {
        if (window.SpotifyBridge) {
            window.SpotifyBridge.skipPrevious()
            return
        }
        void ensureContextLoaded().then((hasContext) => {
            if (hasContext) playerRef.current?.previousTrack()
        })
    }, [ensureContextLoaded])

    const seekForward = useCallback((ms: number = 15_000) => {
        if (window.SpotifyBridge) return // Android SDK doesn't easily support arbitrary seek via App Remote without more code
        void ensureContextLoaded().then((hasContext) => {
            if (!hasContext) return
            playerRef.current?.getCurrentState().then((state: any) => {
                if (state) playerRef.current?.seek(state.position + ms)
            })
        })
    }, [ensureContextLoaded])

    const setVolume = useCallback((v: number) => {
        if (window.SpotifyBridge) return // App Remote volume is usually system volume or handled by native app
        playerRef.current?.setVolume(v)
    }, [])

    const play = useCallback((spotifyUri: string) => {
        void startPlayback(spotifyUri)
    }, [startPlayback])

    const pause = useCallback(() => {
        if (window.SpotifyBridge) window.SpotifyBridge.pause()
        else playerRef.current?.pause()
    }, [])

    const resume = useCallback(() => {
        if (window.SpotifyBridge) window.SpotifyBridge.resume()
        else playerRef.current?.resume()
    }, [])

    return {
        ready,
        connected,
        needsAuth,
        error,
        playback,
        controls: { togglePlay, nextTrack, previousTrack, seekForward, setVolume, play, pause, resume },
        deviceId,
        isAndroidApp
    }
}
