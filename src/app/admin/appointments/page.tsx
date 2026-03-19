'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar,
    Loader2,
    Search,
    RefreshCw,
    History,
    CalendarCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format, isToday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    getAppointments,
    getBarbers,
    getServices,
    updateAppointment,
    getProfile,
    getAllProfiles
} from '@/lib/firebase/firestore'
import { sendRatingRequestEmail } from '@/lib/email/client'
import type { Barber, Service, Profile } from '@/types/database.types'
import {
    AppointmentCard,
    AppointmentDetailModal,
    TimelineProgress,
    QuickStats,
    type EnrichedAppointment
} from '@/components/admin'

// Tab definitions
const tabs = [
    { id: 'today', label: "Aujourd'hui", icon: Calendar },
    { id: 'upcoming', label: 'À venir', icon: CalendarCheck },
    { id: 'history', label: 'Historique', icon: History }
]

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [barbers, setBarbers] = useState<Barber[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [services, setServices] = useState<Service[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null)
    const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm'))

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(format(new Date(), 'HH:mm'))
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData(isRefresh = false) {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            const [appointmentsData, barbersData, servicesData, profilesData] = await Promise.all([
                getAppointments({}),
                getBarbers(false),
                getServices(false),
                getAllProfiles()
            ])

            setBarbers(barbersData)
            setServices(servicesData)
            setProfiles(profilesData)

            // Enrich appointments with barber, service and client data
            const enriched: EnrichedAppointment[] = appointmentsData.map(apt => ({
                ...apt,
                barberData: barbersData.find(b => b.id === apt.barber_id),
                serviceData: servicesData.find(s => s.id === apt.service_id),
                clientData: profilesData.find(p => p.id === apt.client_id)
            }))

            setAppointments(enriched)
        } catch (error) {
            console.error('Error loading appointments:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleConfirm = async (id: string) => {
        try {
            await updateAppointment(id, { status: 'confirmed' })
            toast.success('RDV confirmé ✓')
            loadData(true)
        } catch {
            toast.error('Erreur')
        }
    }

    const handleCancel = async (id: string) => {
        try {
            await updateAppointment(id, { status: 'cancelled' })
            toast.success('RDV annulé')
            loadData(true)
        } catch {
            toast.error('Erreur')
        }
    }

    const handleComplete = async (id: string) => {
        try {
            await updateAppointment(id, { status: 'completed' })
            toast.success('RDV terminé ✓')
            loadData(true)
        } catch {
            toast.error('Erreur')
        }
    }

    const handleRequestRating = async (appointment: EnrichedAppointment) => {
        if (!appointment.client_id) {
            toast.error('Client non trouvé')
            return
        }

        try {
            const profile = await getProfile(appointment.client_id)
            if (!profile?.email) {
                toast.error('Email du client non trouvé')
                return
            }

            await sendRatingRequestEmail({
                email: profile.email,
                clientName: profile.full_name || 'Client',
                barberName: appointment.barberData?.name || 'Barbier',
                serviceName: appointment.serviceData?.name || 'Service',
                date: appointment.date
            })
            toast.success('Demande d\'avis envoyée')
        } catch {
            toast.error('Erreur d\'envoi')
        }
    }

    // Filter appointments based on tab and search
    const filteredAppointments = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd')

        return appointments.filter(apt => {
            // Tab filter
            const aptDate = apt.date
            if (activeTab === 'today' && aptDate !== today) return false
            if (activeTab === 'upcoming' && aptDate <= today) return false
            if (activeTab === 'history' && aptDate >= today) return false

            // Status filter
            if (statusFilter !== 'all' && apt.status !== statusFilter) return false

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesClient = apt.clientData?.full_name?.toLowerCase().includes(query)
                const matchesBarber = apt.barberData?.name?.toLowerCase().includes(query)
                const matchesService = apt.serviceData?.name?.toLowerCase().includes(query)
                const matchesPhone = apt.clientData?.phone?.includes(query)
                if (!matchesClient && !matchesBarber && !matchesService && !matchesPhone) return false
            }

            return true
        }).sort((a, b) => {
            // Sort by date then time
            if (a.date !== b.date) {
                return activeTab === 'history'
                    ? b.date.localeCompare(a.date) // Newest first for history
                    : a.date.localeCompare(b.date)
            }
            return a.start_time.localeCompare(b.start_time)
        })
    }, [appointments, activeTab, statusFilter, searchQuery])

    // Calculate stats for current tab
    const stats = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd')
        let relevantApts = appointments

        if (activeTab === 'today') {
            relevantApts = appointments.filter(apt => apt.date === today)
        } else if (activeTab === 'upcoming') {
            relevantApts = appointments.filter(apt => apt.date > today)
        } else {
            relevantApts = appointments.filter(apt => apt.date < today)
        }

        return {
            total: relevantApts.length,
            pending: relevantApts.filter(apt => apt.status === 'pending').length,
            confirmed: relevantApts.filter(apt => apt.status === 'confirmed').length,
            completed: relevantApts.filter(apt => apt.status === 'completed').length,
            cancelled: relevantApts.filter(apt => apt.status === 'cancelled').length
        }
    }, [appointments, activeTab])

    // Get today's appointments for timeline
    const todayAppointments = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return appointments
            .filter(apt => apt.date === today && apt.status !== 'cancelled')
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
    }, [appointments])

    // Find next appointment
    const nextAppointment = useMemo(() => {
        const now = new Date()
        const today = format(now, 'yyyy-MM-dd')
        const currentTimeStr = format(now, 'HH:mm')

        return appointments.find(apt => {
            if (apt.date < today) return false
            if (apt.date === today && apt.start_time < currentTimeStr) return false
            return apt.status === 'pending' || apt.status === 'confirmed'
        })
    }, [appointments])

    // Get pending count for notification badge
    const pendingCount = useMemo(() =>
        appointments.filter(apt => apt.status === 'pending').length,
        [appointments]
    )

    // Group appointments by date for display
    const groupedAppointments = useMemo(() => {
        const groups: Record<string, EnrichedAppointment[]> = {}
        filteredAppointments.forEach(apt => {
            if (!groups[apt.date]) groups[apt.date] = []
            groups[apt.date].push(apt)
        })
        return groups
    }, [filteredAppointments])

    const sortedDates = Object.keys(groupedAppointments).sort((a, b) =>
        activeTab === 'history' ? b.localeCompare(a) : a.localeCompare(b)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="pb-4">
            {/* Header */}
            <div className="sticky top-14 z-30 bg-background border-b px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Rendez-vous
                            {pendingCount > 0 && (
                                <span className="relative flex h-5 min-w-5 px-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                                    <span className="relative inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-yellow-500 text-white text-xs font-bold">
                                        {pendingCount}
                                    </span>
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(), "EEEE d MMMM", { locale: fr })}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
                    </Button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-accent/50 p-1 rounded-xl">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as typeof activeTab)
                                    setStatusFilter('all')
                                }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="px-4 pt-4 space-y-4">
                {/* Quick Stats */}
                <QuickStats
                    total={stats.total}
                    pending={stats.pending}
                    confirmed={stats.confirmed}
                    completed={stats.completed}
                    cancelled={stats.cancelled}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />

                {/* Timeline Progress - Only show for today */}
                {activeTab === 'today' && todayAppointments.length > 0 && (
                    <TimelineProgress
                        appointments={todayAppointments}
                        currentTime={currentTime}
                        onSelectAppointment={setSelectedAppointment}
                    />
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher client, service, téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-full bg-accent/50 border-0"
                    />
                </div>

                {/* Next Appointment Hero Card - Only show for today tab */}
                {activeTab === 'today' && nextAppointment && nextAppointment.date === format(new Date(), 'yyyy-MM-dd') && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AppointmentCard
                            appointment={nextAppointment}
                            isNext={true}
                            onConfirm={handleConfirm}
                            onCancel={handleCancel}
                            onComplete={handleComplete}
                            onRequestRating={handleRequestRating}
                            onClick={setSelectedAppointment}
                        />
                    </motion.div>
                )}

                {/* Appointments List */}
                {filteredAppointments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? 'Aucun résultat'
                                : activeTab === 'today'
                                    ? "Aucun rendez-vous aujourd'hui"
                                    : activeTab === 'upcoming'
                                        ? "Aucun rendez-vous à venir"
                                        : "Aucun historique"
                            }
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {sortedDates.map(date => {
                            // Skip next appointment in list if it's already shown as hero
                            const appointmentsForDate = groupedAppointments[date].filter(apt =>
                                !(activeTab === 'today' && apt.id === nextAppointment?.id && nextAppointment.date === format(new Date(), 'yyyy-MM-dd'))
                            )

                            if (appointmentsForDate.length === 0) return null

                            return (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm font-semibold capitalize">
                                            {isToday(parseISO(date))
                                                ? "Aujourd'hui"
                                                : format(parseISO(date), 'EEEE d MMMM', { locale: fr })
                                            }
                                        </span>
                                        <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                                            {appointmentsForDate.length}
                                        </span>
                                    </div>

                                    {/* Appointments for this date */}
                                    <div className="space-y-3">
                                        {appointmentsForDate.map((apt, index) => (
                                            <AppointmentCard
                                                key={apt.id}
                                                appointment={apt}
                                                onConfirm={handleConfirm}
                                                onCancel={handleCancel}
                                                onComplete={handleComplete}
                                                onRequestRating={handleRequestRating}
                                                onClick={setSelectedAppointment}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Appointment Detail Modal */}
            <AppointmentDetailModal
                appointment={selectedAppointment}
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onRequestRating={handleRequestRating}
            />
        </div>
    )
}
