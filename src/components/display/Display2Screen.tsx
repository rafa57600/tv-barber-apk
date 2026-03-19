'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock, User, ChevronUp, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getAppointments, getBarbers, getServices } from '@/lib/firebase/firestore'
import { useNewAppointmentAnnouncer } from '@/hooks/useVoiceAnnouncement'
import { SpotifyPlayer } from '@/components/display/SpotifyPlayer'
import { AnnouncementBanner } from '@/components/display/AnnouncementBanner'
import { WeatherWidget } from '@/components/display/WeatherWidget'
import type { SpotifyPlayerRef } from '@/components/display/SpotifyPlayer'
import type { Appointment, Barber, Service } from '@/types/database.types'

interface EnrichedAppointment extends Appointment {
    barberData?: Barber
    serviceData?: Service
}

const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-500' },
    confirmed: { label: 'Confirme', color: 'bg-green-500' },
    completed: { label: 'Termine', color: 'bg-blue-500' },
    cancelled: { label: 'Annule', color: 'bg-red-500' }
}

export function Display2Screen() {
    const AUTO_COLLAPSE_MS = 14000
    const REMOTE_HINT_MS = 4000

    const rootRef = useRef<HTMLDivElement>(null)
    const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const remoteHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const spotifyCtrl = useRef<SpotifyPlayerRef | null>(null)

    const [isHydrated, setIsHydrated] = useState(false)
    const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
    const [recentAppointments, setRecentAppointments] = useState<EnrichedAppointment[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isExpanded, setIsExpanded] = useState(false)
    const [showRemoteHint, setShowRemoteHint] = useState(false)

    // ─── Timers ──────────────────────────────────────────────────────────

    const clearAutoCollapseTimer = useCallback(() => {
        if (!autoCollapseTimerRef.current) return
        clearTimeout(autoCollapseTimerRef.current)
        autoCollapseTimerRef.current = null
    }, [])

    const clearRemoteHintTimer = useCallback(() => {
        if (!remoteHintTimerRef.current) return
        clearTimeout(remoteHintTimerRef.current)
        remoteHintTimerRef.current = null
    }, [])

    const showRemoteHintTemporarily = useCallback(() => {
        setShowRemoteHint(true)
        clearRemoteHintTimer()
        remoteHintTimerRef.current = setTimeout(() => setShowRemoteHint(false), REMOTE_HINT_MS)
    }, [REMOTE_HINT_MS, clearRemoteHintTimer])

    const scheduleAutoCollapse = useCallback(() => {
        clearAutoCollapseTimer()
        autoCollapseTimerRef.current = setTimeout(() => {
            setIsExpanded(false)
            setShowRemoteHint(false)
        }, AUTO_COLLAPSE_MS)
    }, [AUTO_COLLAPSE_MS, clearAutoCollapseTimer])

    const expandPanel = useCallback(() => {
        setIsExpanded(true)
        scheduleAutoCollapse()
        showRemoteHintTemporarily()
    }, [scheduleAutoCollapse, showRemoteHintTemporarily])

    const collapsePanel = useCallback(() => {
        setIsExpanded(false)
        setShowRemoteHint(false)
        clearAutoCollapseTimer()
        clearRemoteHintTimer()
    }, [clearAutoCollapseTimer, clearRemoteHintTimer])

    const toggleExpanded = useCallback(() => {
        if (isExpanded) {
            collapsePanel()
            return
        }
        expandPanel()
    }, [collapsePanel, expandPanel, isExpanded])

    const registerRemoteInteraction = useCallback(() => {
        if (!isExpanded) return
        scheduleAutoCollapse()
        showRemoteHintTemporarily()
    }, [isExpanded, scheduleAutoCollapse, showRemoteHintTemporarily])

    const handleNextTrack = useCallback(() => {
        spotifyCtrl.current?.nextTrack()
        registerRemoteInteraction()
    }, [registerRemoteInteraction])

    const handlePreviousTrack = useCallback(() => {
        spotifyCtrl.current?.previousTrack()
        registerRemoteInteraction()
    }, [registerRemoteInteraction])

    const handleForwardTrack = useCallback(() => {
        spotifyCtrl.current?.seekForward()
        registerRemoteInteraction()
    }, [registerRemoteInteraction])

    const handleToggleMute = useCallback(() => {
        spotifyCtrl.current?.toggleMute()
        registerRemoteInteraction()
    }, [registerRemoteInteraction])

    // ─── Announcements ──────────────────────────────────────────────────

    const handlePause = useCallback(() => { spotifyCtrl.current?.pause() }, [])
    const handleResume = useCallback(() => { spotifyCtrl.current?.resume() }, [])

    const { activeAnnouncement, dismissAnnouncement, isSpeaking } = useNewAppointmentAnnouncer(
        recentAppointments, true, handlePause, handleResume
    )

    // ─── Data loading ────────────────────────────────────────────────────

    const loadAppointments = useCallback(async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd')
            const [a, b, s] = await Promise.all([getAppointments({ date: today }), getBarbers(false), getServices(false)])
            setAppointments(
                a.filter(x => x.status !== 'cancelled')
                    .map(x => ({ ...x, barberData: b.find(bb => bb.id === x.barber_id), serviceData: s.find(ss => ss.id === x.service_id) }))
                    .sort((x, y) => x.start_time.localeCompare(y.start_time))
            )
        } catch (e) { console.error('Error loading appointments:', e) }
    }, [])

    const loadRecentAppointments = useCallback(async () => {
        try {
            const { getRecentlyCreatedAppointments } = await import('@/lib/firebase/firestore')
            const [r, b, s] = await Promise.all([getRecentlyCreatedAppointments(2), getBarbers(false), getServices(false)])
            setRecentAppointments(
                r.filter(x => x.status !== 'cancelled')
                    .map(x => ({ ...x, barberData: b.find(bb => bb.id === x.barber_id), serviceData: s.find(ss => ss.id === x.service_id) }))
            )
        } catch (e) { console.error('Error loading recent appointments:', e) }
    }, [])

    // ─── Effects ─────────────────────────────────────────────────────────

    useEffect(() => { setIsHydrated(true) }, [])
    useEffect(() => { if (isHydrated) rootRef.current?.focus() }, [isHydrated])

    useEffect(() => {
        loadAppointments(); loadRecentAppointments()
        const d = setInterval(loadAppointments, 30000)
        const a = setInterval(loadRecentAppointments, 15000)
        return () => { clearInterval(d); clearInterval(a) }
    }, [loadAppointments, loadRecentAppointments])

    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => () => { clearAutoCollapseTimer(); clearRemoteHintTimer() }, [clearAutoCollapseTimer, clearRemoteHintTimer])

    useEffect(() => {
        if (!isExpanded) { clearAutoCollapseTimer(); return }
        scheduleAutoCollapse()
    }, [clearAutoCollapseTimer, isExpanded, scheduleAutoCollapse])

    // Keyboard / TV remote controls
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null
            if (el && el !== document.body) el.blur()

            if (e.key === 'ArrowUp') {
                e.preventDefault()
                expandPanel()
                return
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                collapsePanel()
                return
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                registerRemoteInteraction()
                toggleExpanded()
                return
            }

            if (e.key === 'ArrowRight' || e.key === 'MediaTrackNext') {
                e.preventDefault()
                handleNextTrack()
                return
            }

            if (e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious') {
                e.preventDefault()
                handlePreviousTrack()
                return
            }

            if (e.key === 'MediaFastForward') {
                e.preventDefault()
                handleForwardTrack()
                return
            }

            if (e.key === 'AudioVolumeMute') {
                e.preventDefault()
                handleToggleMute()
                return
            }

            if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
                e.preventDefault()

                const closedSpotifyLogin = spotifyCtrl.current?.closeSpotifyLogin() || false
                if (closedSpotifyLogin) {
                    return
                }

                if (activeAnnouncement) {
                    dismissAnnouncement()
                    return
                }
                collapsePanel()
                return
            }

            if (e.key === 'Delete' || e.key === 'MediaStop') {
                e.preventDefault()
                dismissAnnouncement()
            }
        }
        window.addEventListener('keydown', handler, true)
        return () => window.removeEventListener('keydown', handler, true)
    }, [
        activeAnnouncement,
        collapsePanel,
        dismissAnnouncement,
        expandPanel,
        handleForwardTrack,
        handleNextTrack,
        handlePreviousTrack,
        handleToggleMute,
        registerRemoteInteraction,
        toggleExpanded,
    ])

    // ─── Derived ─────────────────────────────────────────────────────────

    const ts = format(currentTime, 'HH:mm')
    const curr = appointments.find(a => a.start_time <= ts && a.end_time > ts && a.status === 'confirmed')
    const next = appointments.filter(a => a.start_time > ts && (a.status === 'pending' || a.status === 'confirmed'))
    const count = next.length + (curr ? 1 : 0)
    const nextOne = next[0]

    if (!isHydrated) return <div className="h-screen w-screen bg-black" />

    return (
        <div ref={rootRef} className="h-screen w-screen bg-black relative overflow-hidden" tabIndex={0}>
            <AnnouncementBanner announcement={activeAnnouncement} isSpeaking={isSpeaking} onDismiss={dismissAnnouncement} />

            {/* Full-screen Spotify player */}
            <SpotifyPlayer
                displayId="display2"
                className="absolute inset-0 w-full h-full"
                onControlsReady={(ref) => { spotifyCtrl.current = ref }}
            />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2">
                    <img src="/icons/icon-512.png" alt="BarberSHOP" className="w-10 h-10 rounded-xl" />
                    <span className="text-lg font-bold text-white">Barber<span className="text-green-500">SHOP</span></span>
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl px-6 py-2 flex items-center gap-4">
                    <span className="text-white/60 text-sm">{format(currentTime, 'EEEE d MMMM', { locale: fr })}</span>
                    <span className="text-3xl font-bold text-white font-mono">{format(currentTime, 'HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <WeatherWidget />
                    {activeAnnouncement && (
                        <button
                            type="button"
                            onClick={dismissAnnouncement}
                            className="rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/30"
                        >
                            Ignorer annonce
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom drawer */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div key="expanded" initial={{ opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                            className="mx-auto max-w-6xl rounded-3xl border border-white/15 bg-black/82 backdrop-blur-2xl px-6 pb-6 pt-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                        >
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                                    <span className="h-2 w-2 rounded-full bg-green-400" />Planning du salon
                                </div>
                                <button type="button" className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/85"
                                    onClick={collapsePanel} tabIndex={-1}>
                                    <ChevronDown className="h-4 w-4" />Masquer
                                </button>
                            </div>

                            {curr && (
                                <div className="rounded-2xl border border-green-500/45 bg-green-500/15 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-green-300">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                                        </span>En cours
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/20"><User className="h-7 w-7 text-green-300" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-2xl font-semibold text-white">{curr.serviceData?.name}</p>
                                            <p className="truncate text-base text-green-200">{curr.barberData?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-white">{curr.start_time}</p>
                                            <p className="text-sm text-zinc-300">{`-> ${curr.end_time}`}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between text-sm text-white/70"><span>A venir</span><span>{count} RDV</span></div>
                                <div className="max-h-[38vh] space-y-2 overflow-y-auto pr-1">
                                    {next.map(apt => {
                                        const st = statusConfig[apt.status as keyof typeof statusConfig]
                                        return (
                                            <div key={apt.id} className="rounded-xl border border-white/10 bg-white/10 p-4">
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <span className="text-2xl font-bold text-white">{apt.start_time}</span>
                                                    <span className={cn('h-2 w-2 rounded-full', st?.color)} />
                                                </div>
                                                <p className="truncate text-base font-semibold text-white">{apt.serviceData?.name}</p>
                                                <p className="truncate text-sm text-zinc-300">{apt.barberData?.name} · {apt.end_time}</p>
                                            </div>
                                        )
                                    })}
                                    {next.length === 0 && !curr && (
                                        <div className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-9 text-zinc-300">
                                            <div className="text-center"><Clock className="mx-auto mb-2 h-9 w-9 opacity-70" /><p className="text-lg">Aucun rendez-vous prévu</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.button key="collapsed" type="button" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                            className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/72 px-4 py-3 text-left backdrop-blur-xl"
                            onClick={expandPanel} tabIndex={-1}>
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/50">Now / Next</div>
                                {curr ? (
                                    <div className="mb-1 flex items-center gap-2 text-white">
                                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" /></span>
                                        <span className="truncate text-base font-semibold">{curr.serviceData?.name}</span>
                                        <span className="shrink-0 text-sm text-zinc-300">{curr.start_time}</span>
                                    </div>
                                ) : <p className="mb-1 truncate text-base font-semibold text-zinc-200">Aucun rendez-vous en cours</p>}
                                <p className="truncate text-sm text-zinc-300">{nextOne ? `Prochain: ${nextOne.start_time} - ${nextOne.serviceData?.name}` : `Prochain: aucun rendez-vous`}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 pl-2 text-white/90">
                                <span className="text-lg font-semibold">{count} RDV</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/75"><ChevronUp className="h-4 w-4" />Details</span>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isExpanded && showRemoteHint && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="mx-auto mt-3 w-fit rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs text-white/80 backdrop-blur-md">
                            OK: ouvrir | Left/Right: piste | FF: +15s | Mute: son | Back: fermer/skip annonce
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
