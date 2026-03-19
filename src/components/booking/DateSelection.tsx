'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, isBefore, startOfDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { getDateAvailability, getShopSchedule, getShopClosures } from '@/lib/firebase/firestore'

interface DateSelectionProps {
    selectedDate: Date | null
    onSelectDate: (date: Date) => void
    onNext: () => void
    onBack?: () => void
    daysToShow?: number
}

type DateStatus = 'available' | 'limited' | 'full' | 'closed' | 'loading'

const statusConfig = {
    available: {
        label: 'Disponible',
        dotClass: 'bg-green-500',
        textClass: 'text-green-600',
        cardClass: 'hover:border-primary hover:shadow-gold cursor-pointer'
    },
    limited: {
        label: 'Places limitées',
        dotClass: 'bg-yellow-500',
        textClass: 'text-yellow-600',
        cardClass: 'hover:border-yellow-500 cursor-pointer'
    },
    full: {
        label: 'Complet',
        dotClass: 'bg-red-500',
        textClass: 'text-red-600',
        cardClass: 'opacity-60 cursor-not-allowed'
    },
    closed: {
        label: 'Fermé',
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-500',
        cardClass: 'opacity-40 cursor-not-allowed'
    },
    loading: {
        label: '...',
        dotClass: 'bg-gray-300',
        textClass: 'text-gray-400',
        cardClass: 'cursor-wait'
    }
}

export function DateSelection({
    selectedDate,
    onSelectDate,
    onNext,
    onBack,
    daysToShow = 7
}: DateSelectionProps) {
    const today = startOfDay(new Date())
    const dates = Array.from({ length: daysToShow }, (_, i) => addDays(today, i))

    const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatus>>({})
    const [loading, setLoading] = useState(true)

    // Load availability from Firebase
    useEffect(() => {
        loadAvailability()
    }, [])

    async function loadAvailability() {
        setLoading(true)
        try {
            // Get schedule and closures once
            const [scheduleData, closures] = await Promise.all([
                getShopSchedule(),
                getShopClosures()
            ])

            const statuses: Record<string, DateStatus> = {}

            for (const date of dates) {
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayOfWeek = date.getDay()

                // Check if it's before today
                if (isBefore(date, today) && !isToday(date)) {
                    statuses[dateStr] = 'closed'
                    continue
                }

                // Check if it's a closure day
                if (closures.some(c => c.date === dateStr)) {
                    statuses[dateStr] = 'closed'
                    continue
                }

                // Check weekly schedule
                if (scheduleData && scheduleData.schedule) {
                    const daySchedule = scheduleData.schedule.find(s => s.day === dayOfWeek)
                    if (daySchedule && !daySchedule.is_open) {
                        statuses[dateStr] = 'closed'
                        continue
                    }
                } else {
                    // Default: Sunday is closed if no schedule exists
                    if (dayOfWeek === 0) {
                        statuses[dateStr] = 'closed'
                        continue
                    }
                }

                // For now, mark as available (could fetch appointment counts for more accuracy)
                statuses[dateStr] = 'available'
            }

            setDateStatuses(statuses)
        } catch (error) {
            console.error('Error loading availability:', error)
            // Fallback to basic logic if Firebase fails
            const statuses: Record<string, DateStatus> = {}
            for (const date of dates) {
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayOfWeek = date.getDay()
                statuses[dateStr] = dayOfWeek === 0 ? 'closed' : 'available'
            }
            setDateStatuses(statuses)
        } finally {
            setLoading(false)
        }
    }

    const getStatus = (date: Date): DateStatus => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return dateStatuses[dateStr] || 'loading'
    }

    const handleSelectDate = (date: Date) => {
        const status = getStatus(date)
        if (status !== 'full' && status !== 'closed' && status !== 'loading') {
            onSelectDate(date)
        }
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">
                    Sélectionnez une Date
                </CardTitle>
                <CardDescription>
                    Choisissez votre date de rendez-vous préférée
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Grid */}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                    {dates.map((date, index) => {
                        const status = getStatus(date)
                        const config = statusConfig[status]
                        const isSelected = selectedDate &&
                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')

                        return (
                            <motion.div
                                key={date.toISOString()}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectDate(date)}
                                className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all duration-200",
                                    config.cardClass,
                                    isSelected
                                        ? "border-primary bg-accent shadow-gold"
                                        : "border-transparent bg-card"
                                )}
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    {status === 'loading' ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                    ) : (
                                        <span className={cn("w-2 h-2 rounded-full", config.dotClass)} />
                                    )}
                                    <span className={cn("text-[10px] font-medium", config.textClass)}>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Day Name */}
                                <div className="text-xs text-muted-foreground font-medium uppercase text-center">
                                    {format(date, 'EEE', { locale: fr })}
                                </div>

                                {/* Day Number */}
                                <div className={cn(
                                    "text-2xl font-bold text-center",
                                    isSelected ? "text-primary" : "text-foreground"
                                )}>
                                    {format(date, 'd')}
                                </div>

                                {/* Month */}
                                <div className="text-xs text-muted-foreground text-center">
                                    {format(date, 'MMM', { locale: fr })}
                                </div>

                                {/* Today indicator */}
                                {isToday(date) && (
                                    <motion.div
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
                    {Object.entries(statusConfig)
                        .filter(([key]) => key !== 'loading')
                        .map(([key, config]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className={cn("w-3 h-3 rounded-full", config.dotClass)} />
                                <span className="text-muted-foreground">{config.label}</span>
                            </div>
                        ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    {onBack && (
                        <Button variant="outline" onClick={onBack}>
                            Retour
                        </Button>
                    )}
                    <div className={!onBack ? 'ml-auto' : ''}>
                        <Button
                            onClick={onNext}
                            disabled={!selectedDate || loading}
                            className="gradient-gold text-white shadow-gold"
                        >
                            Continuer
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
