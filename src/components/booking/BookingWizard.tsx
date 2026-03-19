'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StepIndicator } from './StepIndicator'
import { DateSelection } from './DateSelection'
import { TimeSelection } from './TimeSelection'
import { Confirmation } from './Confirmation'
import { useAuth } from '@/hooks/useAuth'
import {
    getServices,
    createAppointment,
    getAllAppointments,
    getShopSettings,
    getAvailableSlotsForDate,
    AvailableSlot
} from '@/lib/firebase/firestore'
import { sendBookingConfirmationEmail, sendWelcomeEmail, sendNewBookingNotificationToAdmins } from '@/lib/email/client'
import { sendPushNotification, NotificationTemplates } from '@/lib/notifications/client'
import { getAdminFCMTokens } from '@/lib/firebase/firestore'
import { format, addMinutes } from 'date-fns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Service } from '@/types/database.types'

const steps = [
    { number: 1, label: 'Date' },
    { number: 2, label: 'Heure' },
    { number: 3, label: 'Confirmation' }
]

const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
}

export function BookingWizard() {
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingComplete, setBookingComplete] = useState(false)

    // Load default service from shop settings
    useEffect(() => {
        loadData()
    }, [])

    // Load available slots when date changes
    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots()
        }
    }, [selectedDate])

    async function loadData() {
        try {
            setLoading(true)
            const [servicesData, settings] = await Promise.all([
                getServices(true),  // Only active services
                getShopSettings()
            ])

            // Use default service from settings, or first service
            if (settings?.default_service_id) {
                const defaultService = servicesData.find(s => s.id === settings.default_service_id)
                setSelectedService(defaultService || servicesData[0] || null)
            } else if (servicesData.length > 0) {
                setSelectedService(servicesData[0])
            }
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    async function loadAvailableSlots() {
        if (!selectedDate) return

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const slots = await getAvailableSlotsForDate(dateStr)
            setAvailableSlots(slots)
        } catch (error) {
            console.error('Error loading available slots:', error)
            setAvailableSlots([])
        }
    }

    const handleConfirmBooking = async () => {
        if (!user || !selectedDate || !selectedTime || !selectedService) {
            toast.error('Veuillez compléter toutes les étapes')
            return
        }

        // Find the barber assigned to this time slot
        const assignedSlot = availableSlots.find(s => s.time === selectedTime)
        if (!assignedSlot) {
            toast.error('Ce créneau n\'est plus disponible')
            return
        }

        setBookingLoading(true)
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const endTime = format(
                addMinutes(new Date(`${dateStr}T${selectedTime}`), selectedService.duration_minutes),
                'HH:mm'
            )

            await createAppointment({
                client_id: user.uid,
                barber_id: assignedSlot.barberId, // Auto-assigned barber
                service_id: selectedService.id,
                date: dateStr,
                start_time: selectedTime,
                end_time: endTime,
                status: 'pending',
                notes: null
            })

            // Check if this is the user's first booking
            if (user.email) {
                try {
                    const allAppointments = await getAllAppointments()
                    const userAppointments = allAppointments.filter(apt => apt.client_id === user.uid)
                    const isFirstBooking = userAppointments.length === 1 // Only the one we just created

                    // Send welcome email for first-time users
                    if (isFirstBooking) {
                        sendWelcomeEmail({
                            email: user.email,
                            clientName: user.displayName || 'Client'
                        }).catch(err => console.error('Failed to send welcome email:', err))
                    }
                } catch (err) {
                    console.error('Error checking first-time user:', err)
                }

                // Send confirmation email
                const formattedDate = format(selectedDate, 'dd/MM/yyyy')
                sendBookingConfirmationEmail({
                    email: user.email,
                    clientName: user.displayName || 'Client',
                    date: formattedDate,
                    time: selectedTime,
                    serviceName: selectedService.name,
                    barberName: assignedSlot.barberName,
                    duration: selectedService.duration_minutes
                }).catch(err => console.error('Failed to send confirmation email:', err))
            }

            // Send push notification to barbers/admin
            try {
                const adminTokens = await getAdminFCMTokens()
                if (adminTokens.length > 0) {
                    const notification = NotificationTemplates.newBooking(
                        user.displayName || 'Client',
                        selectedTime,
                        format(selectedDate, 'dd/MM')
                    )
                    sendPushNotification({
                        tokens: adminTokens,
                        ...notification
                    }).catch(err => console.error('Failed to send push notification:', err))
                }
            } catch (err) {
                console.error('Error sending push notification:', err)
            }

            // Send email notification to all barbers/admins
            sendNewBookingNotificationToAdmins({
                clientName: user.displayName || 'Client',
                clientEmail: user.email || '',
                date: format(selectedDate, 'dd/MM/yyyy'),
                time: selectedTime,
                serviceName: selectedService.name,
                barberName: assignedSlot.barberName,
                duration: selectedService.duration_minutes
            }).catch(err => console.error('Failed to send admin email notification:', err))

            setBookingComplete(true)
            toast.success('Réservation confirmée !', {
                description: `Votre rendez-vous est prévu le ${format(selectedDate, 'dd/MM/yyyy')} à ${selectedTime}`
            })
        } catch (error) {
            console.error('Booking error:', error)
            toast.error('Erreur lors de la réservation', {
                description: 'Veuillez réessayer plus tard'
            })
        } finally {
            setBookingLoading(false)
        }
    }

    const handleReset = () => {
        setCurrentStep(1)
        setSelectedDate(null)
        setSelectedTime(null)
        setBookingComplete(false)
        setAvailableSlots([])
    }

    // Loading state
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement des disponibilités...</p>
                </div>
            </div>
        )
    }

    // No service available
    if (!selectedService) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
                    <p className="text-muted-foreground mb-2">Aucun service disponible</p>
                    <p className="text-sm text-muted-foreground">
                        Veuillez contacter le salon pour plus d&apos;informations.
                    </p>
                </div>
            </div>
        )
    }

    // Booking complete state
    if (bookingComplete) {
        return (
            <div className="max-w-2xl mx-auto">
                <Confirmation
                    selectedDate={selectedDate!}
                    selectedTime={selectedTime!}
                    selectedService={selectedService}
                    onBack={() => setCurrentStep(2)}
                    onConfirm={handleConfirmBooking}
                    isLoading={bookingLoading}
                    isComplete={true}
                    onReset={handleReset}
                />
            </div>
        )
    }

    // Get available time strings for TimeSelection
    const availableTimes = availableSlots.map(s => s.time)

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <StepIndicator steps={steps} currentStep={currentStep} />

            {/* Wizard Content */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <DateSelection
                                selectedDate={selectedDate}
                                onSelectDate={setSelectedDate}
                                onNext={() => setCurrentStep(2)}
                            />
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <TimeSelection
                                selectedDate={selectedDate!}
                                selectedTime={selectedTime}
                                onSelectTime={setSelectedTime}
                                onNext={() => setCurrentStep(3)}
                                onBack={() => setCurrentStep(1)}
                                availableSlots={availableTimes}
                                bookedSlots={[]} // All slots from getAvailableSlotsForDate are already available
                            />
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <Confirmation
                                selectedDate={selectedDate!}
                                selectedTime={selectedTime!}
                                selectedService={selectedService}
                                onBack={() => setCurrentStep(2)}
                                onConfirm={handleConfirmBooking}
                                isLoading={bookingLoading}
                                isComplete={false}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
