'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, Scissors, CheckCircle, PartyPopper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Service } from '@/types/database.types'
import { useAuth } from '@/hooks/useAuth'

interface ConfirmationProps {
    selectedDate: Date
    selectedTime: string
    selectedService: Service | null
    onConfirm: () => void
    onBack: () => void
    isLoading?: boolean
    isComplete?: boolean
    onReset?: () => void
}

export function Confirmation({
    selectedDate,
    selectedTime,
    selectedService,
    onConfirm,
    onBack,
    isLoading = false,
    isComplete = false,
    onReset
}: ConfirmationProps) {
    const { user, signInWithGoogle } = useAuth()

    const handleConfirm = async () => {
        if (!user) {
            await signInWithGoogle()
            return
        }
        onConfirm()
    }

    // Booking complete state
    if (isComplete) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                    >
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-2xl font-bold mb-2">Rendez-vous confirmé !</h2>
                        <p className="text-muted-foreground mb-6">
                            Votre réservation a été enregistrée avec succès.
                        </p>

                        <div className="bg-accent/50 rounded-xl p-4 mb-6 text-left">
                            <div className="flex items-center gap-3 mb-3">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="font-medium">
                                    {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className="w-5 h-5 text-primary" />
                                <span className="font-medium">{selectedTime}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Scissors className="w-5 h-5 text-primary" />
                                <span className="font-medium">
                                    {selectedService?.name} ({selectedService?.duration_minutes} min)
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Un email de confirmation vous a été envoyé.
                        </p>

                        {onReset && (
                            <Button
                                onClick={onReset}
                                className="gradient-gold text-white shadow-gold"
                            >
                                Nouvelle réservation
                            </Button>
                        )}
                    </motion.div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">
                    Détails de votre rendez-vous
                </CardTitle>
                <CardDescription>
                    Vérifiez les détails et confirmez votre réservation
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Booking Summary */}
                <motion.div
                    className="bg-accent/50 rounded-xl p-6 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Date */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-semibold text-foreground">
                                    {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Heure</p>
                                <p className="font-semibold text-foreground">{selectedTime}</p>
                            </div>
                        </div>

                        {/* Service */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Scissors className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Service</p>
                                <p className="font-semibold text-foreground">
                                    {selectedService?.name || 'Coupe de Cheveux'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedService?.duration_minutes || 30} min
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Separator className="my-6" />

                {/* Login/Confirm Section */}
                {!user ? (
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-accent rounded-xl p-4 mb-4">
                            <p className="text-muted-foreground">
                                Connectez-vous avec Google pour confirmer votre réservation
                            </p>
                        </div>
                        <Button
                            onClick={signInWithGoogle}
                            className="gradient-gold text-white shadow-gold w-full md:w-auto"
                            size="lg"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Se connecter avec Google
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span>Connecté en tant que {user.email}</span>
                        </div>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t mt-6">
                    <Button variant="outline" onClick={onBack}>
                        Retour
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="gradient-gold text-white shadow-gold"
                    >
                        {isLoading ? 'Confirmation...' : user ? 'Confirmer la réservation' : 'Se connecter avec Google'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
