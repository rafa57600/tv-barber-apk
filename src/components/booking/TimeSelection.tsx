'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, isBefore, parse, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TimeSelectionProps {
    selectedDate: Date
    selectedTime: string | null
    onSelectTime: (time: string) => void
    onNext: () => void
    onBack: () => void
    availableSlots?: string[]
    bookedSlots?: string[]
}

type SlotStatus = 'available' | 'reserved' | 'passed'

// Generate all time slots for a day
function generateTimeSlots(startHour = 9, endHour = 19, intervalMinutes = 30): string[] {
    const slots: string[] = []
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        }
    }
    return slots
}

const allSlots = generateTimeSlots()

export function TimeSelection({
    selectedDate,
    selectedTime,
    onSelectTime,
    onNext,
    onBack,
    availableSlots,
    bookedSlots = []
}: TimeSelectionProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    const getSlotStatus = (slot: string): SlotStatus => {
        // Check if slot is booked
        if (bookedSlots.includes(slot)) {
            return 'reserved'
        }

        // Check if slot is in the past (for today only)
        if (isToday(selectedDate)) {
            const slotTime = parse(slot, 'HH:mm', selectedDate)
            if (isBefore(slotTime, currentTime)) {
                return 'passed'
            }
        }

        // If we have specific available slots, check against them
        if (availableSlots && !availableSlots.includes(slot)) {
            return 'reserved'
        }

        return 'available'
    }

    const statusConfig = {
        available: {
            dotClass: 'bg-green-500',
            cardClass: 'hover:border-primary hover:shadow-md cursor-pointer',
            textClass: 'text-foreground'
        },
        reserved: {
            dotClass: 'hidden',
            badgeClass: 'bg-primary text-primary-foreground',
            cardClass: 'opacity-60 cursor-not-allowed',
            textClass: 'text-muted-foreground'
        },
        passed: {
            dotClass: 'bg-gray-400',
            cardClass: 'opacity-40 cursor-not-allowed',
            textClass: 'text-muted-foreground'
        }
    }

    const handleSelectSlot = (slot: string) => {
        const status = getSlotStatus(slot)
        if (status === 'available') {
            onSelectTime(slot)
        }
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">
                    Sélectionnez une Heure
                </CardTitle>
                <CardDescription>
                    Choisissez votre horaire préféré pour le {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Time Slots Grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                    {allSlots.map((slot, index) => {
                        const status = getSlotStatus(slot)
                        const config = statusConfig[status]
                        const isSelected = selectedTime === slot

                        return (
                            <motion.div
                                key={slot}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => handleSelectSlot(slot)}
                                className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all duration-200 text-center",
                                    config.cardClass,
                                    isSelected
                                        ? "border-primary bg-accent shadow-gold"
                                        : "border-transparent bg-card"
                                )}
                            >
                                {/* Status Indicator */}
                                <div className="absolute top-1 right-1">
                                    {status === 'available' && (
                                        <span className={cn("w-2 h-2 rounded-full block", config.dotClass)} />
                                    )}
                                    {status === 'reserved' && (
                                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                            R
                                        </span>
                                    )}
                                    {status === 'passed' && (
                                        <span className={cn("w-2 h-2 rounded-full block", config.dotClass)} />
                                    )}
                                </div>

                                {/* Time */}
                                <span className={cn(
                                    "text-lg font-semibold",
                                    isSelected ? "text-primary" : config.textClass
                                )}>
                                    {slot}
                                </span>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            R
                        </span>
                        <span className="text-muted-foreground">Réservé</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-muted-foreground">Passé</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={onBack}>
                        Retour
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!selectedTime}
                        className="gradient-gold text-white shadow-gold"
                    >
                        Continuer
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
