'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, MessageCircle, Mail, Calendar, Clock, Scissors, User, CheckCircle, XCircle, Check, Star, MapPin, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { EnrichedAppointment } from './AppointmentCard'

interface AppointmentDetailModalProps {
    appointment: EnrichedAppointment | null
    isOpen: boolean
    onClose: () => void
    onConfirm?: (id: string) => void
    onCancel?: (id: string) => void
    onComplete?: (id: string) => void
    onRequestRating?: (appointment: EnrichedAppointment) => void
}

const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', dotColor: 'bg-yellow-500' },
    confirmed: { label: 'Confirmé', color: 'bg-green-500/10 text-green-600 border-green-500/30', dotColor: 'bg-green-500' },
    cancelled: { label: 'Annulé', color: 'bg-red-500/10 text-red-600 border-red-500/30', dotColor: 'bg-red-500' },
    completed: { label: 'Terminé', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', dotColor: 'bg-blue-500' }
}

export function AppointmentDetailModal({
    appointment,
    isOpen,
    onClose,
    onConfirm,
    onCancel,
    onComplete,
    onRequestRating
}: AppointmentDetailModalProps) {
    if (!appointment) return null

    const status = statusConfig[appointment.status as keyof typeof statusConfig]
    const clientName = appointment.clientData?.full_name || 'Client'
    const clientPhone = appointment.clientData?.phone
    const clientEmail = appointment.clientData?.email
    const serviceName = appointment.serviceData?.name || 'Service'
    const serviceDescription = appointment.serviceData?.description
    const barberName = appointment.barberData?.name || 'Barbier'
    const serviceDuration = appointment.serviceData?.duration_minutes || 30

    const handleCall = () => {
        if (clientPhone) {
            window.location.href = `tel:${clientPhone}`
        }
    }

    const handleSMS = () => {
        if (clientPhone) {
            window.location.href = `sms:${clientPhone}`
        }
    }

    const handleEmail = () => {
        if (clientEmail) {
            window.location.href = `mailto:${clientEmail}`
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto safe-area-bottom"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
                            <h2 className="font-semibold text-lg">Détails du RDV</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Status Badge */}
                            <div className="flex justify-center">
                                <Badge className={cn("text-sm px-4 py-1.5", status?.color)}>
                                    <span className={cn("w-2 h-2 rounded-full mr-2", status?.dotColor)}></span>
                                    {status?.label}
                                </Badge>
                            </div>

                            {/* Client Profile Card */}
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                        <User className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl">{clientName}</h3>
                                        {clientPhone && (
                                            <p className="text-muted-foreground">{clientPhone}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Actions */}
                                <div className="flex gap-2">
                                    {clientPhone && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-background/50"
                                                onClick={handleCall}
                                            >
                                                <Phone className="w-4 h-4 mr-2" />
                                                Appeler
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-background/50"
                                                onClick={handleSMS}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                SMS
                                            </Button>
                                        </>
                                    )}
                                    {clientEmail && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-background/50"
                                            onClick={handleEmail}
                                        >
                                            <Mail className="w-4 h-4 mr-2" />
                                            Email
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Détails</h4>
                                
                                {/* Date & Time */}
                                <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                        </p>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {appointment.start_time} - {appointment.end_time}
                                            <span className="text-xs">({serviceDuration} min)</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Service */}
                                <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Scissors className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{serviceName}</p>
                                        {serviceDescription && (
                                            <p className="text-sm text-muted-foreground">{serviceDescription}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Barber */}
                                <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <User className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{barberName}</p>
                                        <p className="text-sm text-muted-foreground">Coiffeur/Barbier</p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {appointment.notes && (
                                    <div className="p-3 bg-accent/50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">Notes</span>
                                        </div>
                                        <p className="text-sm">{appointment.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-4 border-t">
                                {appointment.status === 'pending' && (
                                    <>
                                        <Button
                                            className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-base"
                                            onClick={() => {
                                                onConfirm?.(appointment.id)
                                                onClose()
                                            }}
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Confirmer le rendez-vous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-red-500/50 text-red-500 hover:bg-red-500/10 text-base"
                                            onClick={() => {
                                                onCancel?.(appointment.id)
                                                onClose()
                                            }}
                                        >
                                            <XCircle className="w-5 h-5 mr-2" />
                                            Annuler le rendez-vous
                                        </Button>
                                    </>
                                )}
                                {appointment.status === 'confirmed' && (
                                    <>
                                        <Button
                                            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base"
                                            onClick={() => {
                                                onComplete?.(appointment.id)
                                                onClose()
                                            }}
                                        >
                                            <Check className="w-5 h-5 mr-2" />
                                            Marquer comme terminé
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-red-500/50 text-red-500 hover:bg-red-500/10 text-base"
                                            onClick={() => {
                                                onCancel?.(appointment.id)
                                                onClose()
                                            }}
                                        >
                                            <XCircle className="w-5 h-5 mr-2" />
                                            Annuler le rendez-vous
                                        </Button>
                                    </>
                                )}
                                {appointment.status === 'completed' && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 text-base"
                                        onClick={() => {
                                            onRequestRating?.(appointment)
                                            onClose()
                                        }}
                                    >
                                        <Star className="w-5 h-5 mr-2" />
                                        Demander un avis
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
