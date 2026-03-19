'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Calendar,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Scissors,
    Loader2,
    ChevronRight,
    RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getDashboardStats, getAppointments, getBarbers, getServices, updateAppointment } from '@/lib/firebase/firestore'
import type { Appointment, Barber, Service } from '@/types/database.types'
import { toast } from 'sonner'

const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: AlertCircle },
    confirmed: { label: 'Confirmé', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
    completed: { label: 'Terminé', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: CheckCircle }
}

export default function AdminDashboard() {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingBookings: 0,
        totalClients: 0,
        totalBarbers: 0,
        totalServices: 0
    })
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [services, setServices] = useState<Service[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData(isRefresh = false) {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            const [statsData, appointmentsData, barbersData, servicesData] = await Promise.all([
                getDashboardStats(),
                getAppointments({ date: todayStr }),
                getBarbers(false),
                getServices(false)
            ])

            setStats(statsData)
            setTodayAppointments(appointmentsData)
            setBarbers(barbersData)
            setServices(servicesData)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleConfirm = async (appointmentId: string) => {
        try {
            await updateAppointment(appointmentId, { status: 'confirmed' })
            toast.success('Confirmé')
            loadData(true)
        } catch {
            toast.error('Erreur')
        }
    }

    const handleCancel = async (appointmentId: string) => {
        try {
            await updateAppointment(appointmentId, { status: 'cancelled' })
            toast.success('Annulé')
            loadData(true)
        } catch {
            toast.error('Erreur')
        }
    }

    const getBarberName = (barberId: string | null) => {
        if (!barberId) return 'Non assigné'
        return barbers.find(b => b.id === barberId)?.name || 'Inconnu'
    }

    const getServiceName = (serviceId: string | null) => {
        if (!serviceId) return 'Non spécifié'
        return services.find(s => s.id === serviceId)?.name || 'Inconnu'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Bonjour 👋</h1>
                    <p className="text-sm text-muted-foreground">
                        {format(today, "EEEE d MMMM", { locale: fr })}
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

            {/* Stats Row - Instagram Stories Style */}
            <div className="flex gap-3 overflow-x-auto pb-2 pt-2 -mx-4 px-4 no-scrollbar">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0"
                >
                    <div className="w-20 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-1">
                            <span className="text-xl font-bold text-primary">{stats.todayAppointments}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Aujourd'hui</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex-shrink-0"
                >
                    <div className="w-20 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center mb-1">
                            <span className="text-xl font-bold text-yellow-600">{stats.pendingBookings}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">En attente</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-shrink-0"
                >
                    <div className="w-20 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center mb-1">
                            <span className="text-xl font-bold text-blue-600">{stats.totalBarbers}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Barbiers</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex-shrink-0"
                >
                    <div className="w-20 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center mb-1">
                            <span className="text-xl font-bold text-purple-600">{stats.totalServices}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Services</span>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/appointments">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-2xl p-4 active:scale-95 transition-transform"
                    >
                        <Calendar className="w-8 h-8 text-primary mb-2" />
                        <p className="font-semibold">Rendez-vous</p>
                        <p className="text-xs text-muted-foreground">Gérer les RDV</p>
                    </motion.div>
                </Link>

                <Link href="/admin/users">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border rounded-2xl p-4 active:scale-95 transition-transform"
                    >
                        <Users className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="font-semibold">Clients</p>
                        <p className="text-xs text-muted-foreground">Voir les clients</p>
                    </motion.div>
                </Link>
            </div>

            {/* Today's Appointments */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Aujourd'hui</h2>
                    <Link href="/admin/appointments" className="text-sm text-primary flex items-center gap-1">
                        Tout voir <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {todayAppointments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card border rounded-2xl p-8 text-center"
                    >
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Aucun rendez-vous</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {todayAppointments.slice(0, 5).map((appointment, index) => {
                            const status = statusConfig[appointment.status as keyof typeof statusConfig]
                            const StatusIcon = status?.icon || AlertCircle

                            return (
                                <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-card border rounded-2xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Time */}
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold text-primary">
                                                {appointment.start_time.split(':')[0]}
                                            </span>
                                            <span className="text-xs text-primary">
                                                :{appointment.start_time.split(':')[1]}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {getServiceName(appointment.service_id)}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {getBarberName(appointment.barber_id)}
                                            </p>
                                            <Badge variant="outline" className={cn("mt-1 gap-1", status?.color)}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status?.label}
                                            </Badge>
                                        </div>

                                        {/* Actions */}
                                        {appointment.status === 'pending' && (
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-green-600 hover:bg-green-500/10"
                                                    onClick={() => handleConfirm(appointment.id)}
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleCancel(appointment.id)}
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
