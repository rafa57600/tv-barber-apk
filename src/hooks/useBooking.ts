'use client'

import { useState, useCallback } from 'react'
import { format, addMinutes } from 'date-fns'
import { createAppointment, getAvailableTimeSlots } from '@/lib/firebase/firestore'
import type { Service, Barber } from '@/types/database.types'

export interface BookingState {
    step: number
    selectedDate: Date | null
    selectedTime: string | null
    selectedService: Service | null
    selectedBarber: Barber | null
    notes: string
}

const initialState: BookingState = {
    step: 1,
    selectedDate: null,
    selectedTime: null,
    selectedService: null,
    selectedBarber: null,
    notes: ''
}

export function useBooking() {
    const [state, setState] = useState<BookingState>(initialState)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const setStep = useCallback((step: number) => {
        setState(prev => ({ ...prev, step }))
    }, [])

    const setDate = useCallback((date: Date) => {
        setState(prev => ({ ...prev, selectedDate: date, selectedTime: null }))
    }, [])

    const setTime = useCallback((time: string) => {
        setState(prev => ({ ...prev, selectedTime: time }))
    }, [])

    const setService = useCallback((service: Service) => {
        setState(prev => ({ ...prev, selectedService: service }))
    }, [])

    const setBarber = useCallback((barber: Barber) => {
        setState(prev => ({ ...prev, selectedBarber: barber, selectedTime: null }))
    }, [])

    const setNotes = useCallback((notes: string) => {
        setState(prev => ({ ...prev, notes }))
    }, [])

    const nextStep = useCallback(() => {
        setState(prev => ({ ...prev, step: Math.min(prev.step + 1, 3) }))
    }, [])

    const prevStep = useCallback(() => {
        setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }))
    }, [])

    const loadAvailableSlots = useCallback(async () => {
        if (!state.selectedDate || !state.selectedBarber) return

        setLoading(true)
        setError(null)
        try {
            const dateStr = format(state.selectedDate, 'yyyy-MM-dd')
            const duration = state.selectedService?.duration_minutes || 30
            const slots = await getAvailableTimeSlots(dateStr, state.selectedBarber.id, duration)
            setAvailableSlots(slots)
        } catch (err) {
            setError('Erreur lors du chargement des créneaux disponibles')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [state.selectedDate, state.selectedBarber, state.selectedService])

    const confirmBooking = useCallback(async (clientId: string) => {
        if (!state.selectedDate || !state.selectedTime || !state.selectedBarber || !state.selectedService) {
            throw new Error('Informations de réservation incomplètes')
        }

        setLoading(true)
        setError(null)
        try {
            const dateStr = format(state.selectedDate, 'yyyy-MM-dd')
            const endTime = format(
                addMinutes(
                    new Date(`${dateStr}T${state.selectedTime}`),
                    state.selectedService.duration_minutes
                ),
                'HH:mm'
            )

            const appointmentId = await createAppointment({
                client_id: clientId,
                barber_id: state.selectedBarber.id,
                service_id: state.selectedService.id,
                date: dateStr,
                start_time: state.selectedTime,
                end_time: endTime,
                status: 'pending',
                notes: state.notes || null
            })

            return appointmentId
        } catch (err) {
            setError('Erreur lors de la confirmation de la réservation')
            console.error(err)
            throw err
        } finally {
            setLoading(false)
        }
    }, [state])

    const reset = useCallback(() => {
        setState(initialState)
        setAvailableSlots([])
        setError(null)
    }, [])

    return {
        ...state,
        availableSlots,
        loading,
        error,
        setStep,
        setDate,
        setTime,
        setService,
        setBarber,
        setNotes,
        nextStep,
        prevStep,
        loadAvailableSlots,
        confirmBooking,
        reset
    }
}
