'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock, User, Calendar } from 'lucide-react'
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
    pending: { label: 'En attente', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    confirmed: { label: 'Confirme', color: 'bg-green-500', textColor: 'text-green-500' },
    completed: { label: 'Termine', color: 'bg-blue-500', textColor: 'text-blue-500' },
    cancelled: { label: 'Annule', color: 'bg-red-500', textColor: 'text-red-500' }
}

export default function Display1Page() {
    const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
    const [recentAppointments, setRecentAppointments] = useState<EnrichedAppointment[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const spotifyCtrl = useRef<SpotifyPlayerRef | null>(null)

    // Pause Spotify during announcements
    const handlePauseForAnnouncement = useCallback(() => {
        spotifyCtrl.current?.pause()
    }, [])

    const handleResumeAfterAnnouncement = useCallback(() => {
        spotifyCtrl.current?.resume()
    }, [])

    const { activeAnnouncement } = useNewAppointmentAnnouncer(
        recentAppointments,
        true,
        handlePauseForAnnouncement,
        handleResumeAfterAnnouncement
    )

    // Load today's appointments
    const loadAppointments = useCallback(async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd')
            const [appointmentsData, barbersData, servicesData] = await Promise.all([
                getAppointments({ date: today }),
                getBarbers(false),
                getServices(false)
            ])

            const enriched: EnrichedAppointment[] = appointmentsData
                .filter(apt => apt.status !== 'cancelled')
                .map(apt => ({
                    ...apt,
                    barberData: barbersData.find(b => b.id === apt.barber_id),
                    serviceData: servicesData.find(s => s.id === apt.service_id)
                }))
                .sort((a, b) => a.start_time.localeCompare(b.start_time))

            setAppointments(enriched)
        } catch (error) {
            console.error('Error loading appointments:', error)
        }
    }, [])

    // Load recently created appointments (for announcements)
    const loadRecentAppointments = useCallback(async () => {
        try {
            const { getRecentlyCreatedAppointments } = await import('@/lib/firebase/firestore')
            const [recentData, barbersData, servicesData] = await Promise.all([
                getRecentlyCreatedAppointments(2),
                getBarbers(false),
                getServices(false)
            ])

            const enriched: EnrichedAppointment[] = recentData
                .filter(apt => apt.status !== 'cancelled')
                .map(apt => ({
                    ...apt,
                    barberData: barbersData.find(b => b.id === apt.barber_id),
                    serviceData: servicesData.find(s => s.id === apt.service_id)
                }))

            setRecentAppointments(enriched)
        } catch (error) {
            console.error('Error loading recent appointments:', error)
        }
    }, [])

    useEffect(() => {
        loadAppointments()
        loadRecentAppointments()
        const d = setInterval(loadAppointments, 30000)
        const a = setInterval(loadRecentAppointments, 15000)
        return () => { clearInterval(d); clearInterval(a) }
    }, [loadAppointments, loadRecentAppointments])

    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    const currentTimeStr = format(currentTime, 'HH:mm')
    const currentAppointment = appointments.find(apt =>
        apt.start_time <= currentTimeStr && apt.end_time > currentTimeStr && apt.status === 'confirmed'
    )
    const nextAppointments = appointments
        .filter(apt => apt.start_time > currentTimeStr && (apt.status === 'pending' || apt.status === 'confirmed'))
        .slice(0, 5)

    return (
        <div className="h-screen w-screen bg-black flex overflow-hidden">
            <AnnouncementBanner announcement={activeAnnouncement} />

            {/* Left – Appointments */}
            <div className="w-1/2 h-full bg-gradient-to-br from-zinc-900 to-black p-8 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2">
                        <img src="/icons/icon-512.png" alt="Fly Barbershop" className="w-10 h-10 rounded-xl" />
                        <span className="text-lg font-bold text-white">Fly <span className="text-green-500">Barbershop</span></span>
                    </div>
                    <div className="text-right">
                        <p className="text-zinc-400 text-sm mb-1">{format(currentTime, 'EEEE d MMMM', { locale: fr })}</p>
                        <div className="text-5xl font-bold text-white font-mono">{format(currentTime, 'HH:mm')}</div>
                        <div className="text-zinc-500 text-lg">{format(currentTime, ':ss')}</div>
                    </div>
                </div>

                {/* Current */}
                {currentAppointment && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
                        <p className="text-green-500 text-sm font-semibold mb-2 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            EN COURS
                        </p>
                        <div className="bg-gradient-to-r from-green-600/20 to-green-700/10 border border-green-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <User className="w-8 h-8 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-2xl font-bold text-white">{currentAppointment.serviceData?.name}</p>
                                    <p className="text-green-400">{currentAppointment.barberData?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-white">{currentAppointment.start_time}</p>
                                    <p className="text-zinc-400">{`-> ${currentAppointment.end_time}`}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Next */}
                <div className="flex-1 overflow-hidden">
                    <p className="text-zinc-400 text-sm font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        A VENIR
                    </p>
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {nextAppointments.map((apt, index) => {
                                const status = statusConfig[apt.status as keyof typeof statusConfig]
                                return (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">{apt.start_time}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{apt.serviceData?.name}</p>
                                            <p className="text-sm text-zinc-400">{apt.barberData?.name}</p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${status?.color}`} />
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                        {nextAppointments.length === 0 && !currentAppointment && (
                            <div className="text-center py-12 text-zinc-500">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun rendez-vous prevu</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Aujourd&apos;hui</span>
                        <div className="flex gap-4">
                            <span className="text-white font-semibold">{appointments.length} RDV</span>
                            <span className="text-green-500">{appointments.filter(a => a.status === 'completed').length} termines</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right – Spotify SDK Player */}
            <SpotifyPlayer
                displayId="display1"
                className="w-1/2 h-full"
                onControlsReady={(ref) => { spotifyCtrl.current = ref }}
            />
        </div>
    )
}
