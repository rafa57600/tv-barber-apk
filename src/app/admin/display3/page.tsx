'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock, User, Move, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAppointments, getBarbers, getServices } from '@/lib/firebase/firestore'
import { useNewAppointmentAnnouncer } from '@/hooks/useVoiceAnnouncement'
import { SpotifyPlayer } from '@/components/display/SpotifyPlayer'
import { AnnouncementBanner } from '@/components/display/AnnouncementBanner'
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

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export default function Display3Page() {
    const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
    const [recentAppointments, setRecentAppointments] = useState<EnrichedAppointment[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [pipPosition, setPipPosition] = useState<Position>('bottom-right')
    const [pipSize, setPipSize] = useState<'small' | 'medium' | 'large'>('medium')
    const spotifyCtrl = useRef<SpotifyPlayerRef | null>(null)

    // Announcements
    const handlePause = useCallback(() => { spotifyCtrl.current?.pause() }, [])
    const handleResume = useCallback(() => { spotifyCtrl.current?.resume() }, [])

    const { activeAnnouncement } = useNewAppointmentAnnouncer(
        recentAppointments, true, handlePause, handleResume
    )

    const cyclePosition = () => {
        const positions: Position[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        setPipPosition(positions[(positions.indexOf(pipPosition) + 1) % positions.length])
    }

    const cycleSize = () => {
        const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large']
        setPipSize(sizes[(sizes.indexOf(pipSize) + 1) % sizes.length])
    }

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

    const ts = format(currentTime, 'HH:mm')
    const curr = appointments.find(a => a.start_time <= ts && a.end_time > ts && a.status === 'confirmed')
    const next = appointments.filter(a => a.start_time > ts && (a.status === 'pending' || a.status === 'confirmed')).slice(0, 6)

    const positionClasses = { 'top-left': 'top-4 left-4', 'top-right': 'top-4 right-4', 'bottom-left': 'bottom-4 left-4', 'bottom-right': 'bottom-4 right-4' }
    const sizeClasses = { small: 'w-80 h-48', medium: 'w-96 h-56', large: 'w-[480px] h-72' }

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 relative overflow-hidden p-8">
            <AnnouncementBanner announcement={activeAnnouncement} />

            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2">
                            <img src="/icons/icon-512.png" alt="Fly Barbershop" className="w-10 h-10 rounded-xl" />
                            <span className="text-lg font-bold text-white">Fly <span className="text-green-500">Barbershop</span></span>
                        </div>
                        <p className="text-zinc-400">{format(currentTime, 'EEEE d MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-6xl font-bold text-white font-mono">{format(currentTime, 'HH:mm')}</div>
                        <div className="text-zinc-500 text-2xl font-mono">:{format(currentTime, 'ss')}</div>
                    </div>
                </div>

                {/* Current */}
                {curr && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center gap-2 text-green-500 text-sm font-semibold mb-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                            </span>EN COURS MAINTENANT
                        </div>
                        <div className="bg-gradient-to-r from-green-600/20 via-green-500/10 to-transparent border border-green-500/30 rounded-3xl p-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center"><User className="w-10 h-10 text-green-500" /></div>
                                <div className="flex-1">
                                    <p className="text-3xl font-bold text-white">{curr.serviceData?.name}</p>
                                    <p className="text-xl text-green-400">{curr.barberData?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-bold text-white">{curr.start_time}</p>
                                    <p className="text-xl text-zinc-400">{`-> ${curr.end_time}`}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Grid */}
                <div className="flex-1">
                    <p className="text-zinc-400 text-sm font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" />PROCHAINS RENDEZ-VOUS</p>
                    <div className="grid grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {next.map((apt, i) => {
                                const st = statusConfig[apt.status as keyof typeof statusConfig]
                                return (
                                    <motion.div key={apt.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-2xl font-bold text-white">{apt.start_time}</span>
                                            <span className={cn('w-3 h-3 rounded-full', st?.color)} />
                                        </div>
                                        <p className="font-semibold text-white text-lg">{apt.serviceData?.name}</p>
                                        <p className="text-zinc-400">{apt.barberData?.name}</p>
                                        <p className="text-zinc-500 text-sm mt-2">{apt.serviceData?.duration_minutes} min</p>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                    {next.length === 0 && !curr && (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                            <Clock className="w-16 h-16 mb-4 opacity-30" /><p className="text-xl">Aucun rendez-vous prevu</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Statistiques du jour</span>
                        <div className="flex gap-6">
                            <div><span className="text-3xl font-bold text-white">{appointments.length}</span><span className="text-zinc-500 text-sm ml-2">Total</span></div>
                            <div><span className="text-3xl font-bold text-green-500">{appointments.filter(a => a.status === 'completed').length}</span><span className="text-zinc-500 text-sm ml-2">Termines</span></div>
                            <div><span className="text-3xl font-bold text-yellow-500">{appointments.filter(a => a.status === 'pending').length}</span><span className="text-zinc-500 text-sm ml-2">En attente</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PiP Spotify Player */}
            <motion.div layout className={cn('absolute z-30 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10', positionClasses[pipPosition], sizeClasses[pipSize])}>
                <SpotifyPlayer
                    displayId="display3"
                    className="absolute inset-0 w-full h-full"
                    onControlsReady={(ref) => { spotifyCtrl.current = ref }}
                />

                {/* PiP controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col">
                    <div className="flex items-center justify-end p-2 gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white" onClick={cyclePosition} title="Move"><Move className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white" onClick={cycleSize} title="Resize">
                            {pipSize === 'large' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
