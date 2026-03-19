'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { EnrichedAppointment } from './AppointmentCard'

interface TimelineProgressProps {
    appointments: EnrichedAppointment[]
    currentTime: string // HH:mm format
    onSelectAppointment?: (appointment: EnrichedAppointment) => void
}

const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    cancelled: 'bg-red-500',
    completed: 'bg-blue-500'
}

export function TimelineProgress({
    appointments,
    currentTime,
    onSelectAppointment
}: TimelineProgressProps) {
    if (appointments.length === 0) return null

    // Sort appointments by time
    const sortedAppointments = [...appointments].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
    )

    // Get timeline bounds
    const firstTime = sortedAppointments[0].start_time
    const lastTime = sortedAppointments[sortedAppointments.length - 1].start_time

    // Convert time to minutes for positioning
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    const firstMinutes = timeToMinutes(firstTime)
    const lastMinutes = timeToMinutes(lastTime)
    const currentMinutes = timeToMinutes(currentTime)
    const totalRange = Math.max(lastMinutes - firstMinutes, 60) // At least 1 hour range

    // Calculate position percentage
    const getPosition = (time: string) => {
        const minutes = timeToMinutes(time)
        return ((minutes - firstMinutes) / totalRange) * 100
    }

    // Current time position
    const currentPosition = Math.min(100, Math.max(0, getPosition(currentTime)))

    // Find current/next appointment
    const currentAppointment = sortedAppointments.find(apt => {
        const aptStartMinutes = timeToMinutes(apt.start_time)
        const aptEndMinutes = timeToMinutes(apt.end_time)
        return currentMinutes >= aptStartMinutes && currentMinutes < aptEndMinutes &&
            (apt.status === 'confirmed' || apt.status === 'pending')
    })

    const nextAppointment = sortedAppointments.find(apt => {
        const aptStartMinutes = timeToMinutes(apt.start_time)
        return aptStartMinutes > currentMinutes &&
            (apt.status === 'confirmed' || apt.status === 'pending')
    })

    // Count completed appointments
    const completedCount = sortedAppointments.filter(apt =>
        apt.status === 'completed' ||
        (apt.status === 'confirmed' && timeToMinutes(apt.end_time) < currentMinutes)
    ).length
    const totalActive = sortedAppointments.filter(apt =>
        apt.status !== 'cancelled'
    ).length

    return (
        <div className="bg-card border rounded-2xl p-4">
            {/* Progress text */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{completedCount}/{totalActive} terminés</span>
                <span className="text-xs text-muted-foreground">
                    {currentAppointment ? 'En cours' : nextAppointment ? `Prochain: ${nextAppointment.start_time}` : 'Journée terminée'}
                </span>
            </div>

            {/* Timeline bar */}
            <div className="relative h-12">
                {/* Background track */}
                <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-accent rounded-full" />

                {/* Progress fill */}
                <motion.div
                    className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentPosition}%` }}
                    transition={{ duration: 0.5 }}
                />

                {/* Appointment dots */}
                {sortedAppointments.map((apt, index) => {
                    const position = getPosition(apt.start_time)
                    const isActive = apt === currentAppointment
                    const isNext = apt === nextAppointment
                    const statusColor = statusColors[apt.status as keyof typeof statusColors]

                    return (
                        <motion.button
                            key={apt.id}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all",
                                isActive ? "w-5 h-5 ring-4 ring-primary/30" : isNext ? "w-4 h-4" : "w-3 h-3",
                                statusColor,
                                apt.status === 'cancelled' && "opacity-40"
                            )}
                            style={{ left: `${position}%` }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelectAppointment?.(apt)}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isActive && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-75" />
                            )}
                        </motion.button>
                    )
                })}

                {/* Current time indicator */}
                <motion.div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${currentPosition}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {currentTime}
                    </span>
                    <div className="w-0.5 h-2 bg-primary mt-0.5" />
                </motion.div>

                {/* Time labels */}
                <div className="absolute bottom-0 left-0 text-[10px] text-muted-foreground">
                    {firstTime}
                </div>
                <div className="absolute bottom-0 right-0 text-[10px] text-muted-foreground">
                    {lastTime}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Attente</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Confirmé</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Terminé</span>
                </div>
            </div>
        </div>
    )
}
