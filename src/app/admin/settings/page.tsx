'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Loader2, Scissors, Bell, Send, Mail, CheckCircle, XCircle, Calendar, Star, UserPlus, Volume2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { NotificationPrompt, NotificationStatus } from '@/components/NotificationPrompt'
import { sendPushNotification } from '@/lib/notifications/client'
import { getAdminFCMTokens, getAllFCMTokens } from '@/lib/firebase/firestore'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getServices, getShopSettings, saveShopSettings } from '@/lib/firebase/firestore'
import type { Service } from '@/types/database.types'

type EmailTestType = 'booking_confirmation' | 'appointment_cancelled' | 'appointment_reminder' | 'welcome' | 'rating_request' | 'new_booking_admin' | null

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testingNotification, setTestingNotification] = useState(false)
    const [testingClientNotification, setTestingClientNotification] = useState(false)
    const [testingEmail, setTestingEmail] = useState<EmailTestType>(null)
    const [testEmail, setTestEmail] = useState('')
    const [services, setServices] = useState<Service[]>([])
    const [defaultServiceId, setDefaultServiceId] = useState<string | null>(null)
    
    // Speech settings
    const [speechRate, setSpeechRate] = useState(1.0)
    const [speechPitch, setSpeechPitch] = useState(1.0)
    const [speechVolume, setSpeechVolume] = useState(1.0)
    const [testingSpeech, setTestingSpeech] = useState(false)

    useEffect(() => {
        loadData()
        loadSpeechSettings()
    }, [])

    // Load speech settings from localStorage
    function loadSpeechSettings() {
        if (typeof window === 'undefined') return
        const saved = localStorage.getItem('speechSettings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                setSpeechRate(settings.rate ?? 1.0)
                setSpeechPitch(settings.pitch ?? 1.0)
                setSpeechVolume(settings.volume ?? 1.0)
            } catch {
                console.error('Error parsing speech settings')
            }
        }
    }

    // Save speech settings to localStorage
    function saveSpeechSettings(rate: number, pitch: number, volume: number) {
        if (typeof window === 'undefined') return
        localStorage.setItem('speechSettings', JSON.stringify({ rate, pitch, volume }))
        toast.success('Paramètres de voix enregistrés')
    }

    // Test speech with current settings
    function handleTestSpeech() {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            toast.error('Synthèse vocale non supportée')
            return
        }
        
        setTestingSpeech(true)
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(
            'Nouveau rendez-vous! Marie a réservé une coupe, vendredi à 14 heures 30'
        )
        utterance.lang = 'fr-FR'
        utterance.rate = speechRate
        utterance.pitch = speechPitch
        utterance.volume = speechVolume
        
        // Try to find a French voice
        const voices = window.speechSynthesis.getVoices()
        const frenchVoice = voices.find(v => 
            v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find(v => v.lang.startsWith('fr'))
        
        if (frenchVoice) {
            utterance.voice = frenchVoice
        }
        
        utterance.onend = () => setTestingSpeech(false)
        utterance.onerror = () => setTestingSpeech(false)
        
        window.speechSynthesis.speak(utterance)
    }

    async function loadData() {
        try {
            setLoading(true)
            const [servicesData, settingsData] = await Promise.all([
                getServices(false),
                getShopSettings()
            ])

            setServices(servicesData)
            if (settingsData?.default_service_id) {
                setDefaultServiceId(settingsData.default_service_id)
            } else if (servicesData.length > 0) {
                setDefaultServiceId(servicesData[0].id)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await saveShopSettings({
                default_service_id: defaultServiceId,
                auto_assign_barber: true
            })
            toast.success('Paramètres enregistrés')
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleTestNotification = async () => {
        setTestingNotification(true)
        try {
            const adminTokens = await getAdminFCMTokens()
            if (adminTokens.length === 0) {
                toast.error('Aucun abonné aux notifications')
                return
            }
            const success = await sendPushNotification({
                tokens: adminTokens,
                title: '🔔 Test de notification',
                body: 'Ceci est une notification de test de Barber SHOP!',
                data: { type: 'test' }
            })
            if (success) {
                toast.success(`Notification envoyée à ${adminTokens.length} abonné(s)`)
            } else {
                toast.error('Erreur lors de l\'envoi')
            }
        } catch (error) {
            console.error('Test notification error:', error)
            toast.error('Erreur lors du test')
        } finally {
            setTestingNotification(false)
        }
    }

    const handleTestClientNotification = async () => {
        setTestingClientNotification(true)
        try {
            const allTokens = await getAllFCMTokens()
            if (allTokens.length === 0) {
                toast.error('Aucun abonné aux notifications')
                return
            }
            const success = await sendPushNotification({
                tokens: allTokens,
                title: '📢 Test général',
                body: 'Ceci est une notification de test pour tous les abonnés!',
                data: { type: 'test_all' }
            })
            if (success) {
                toast.success(`Notification envoyée à ${allTokens.length} abonné(s)`)
            } else {
                toast.error('Erreur lors de l\'envoi')
            }
        } catch (error) {
            console.error('Test client notification error:', error)
            toast.error('Erreur lors du test')
        } finally {
            setTestingClientNotification(false)
        }
    }

    const handleTestEmail = async (type: EmailTestType) => {
        if (!testEmail) {
            toast.error('Veuillez entrer une adresse email')
            return
        }
        
        if (!type) return
        setTestingEmail(type)
        
        try {
            // Sample test data
            const testData = {
                email: testEmail,
                clientName: 'Client Test',
                clientEmail: testEmail,
                date: '27/12/2024',
                time: '14:00',
                serviceName: 'Coupe Classique',
                barberName: 'Jean Dupont',
                duration: 30
            }
            
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data: testData })
            })
            
            const result = await response.json()
            
            if (result.success) {
                toast.success('Email envoyé!')
            } else {
                toast.error(result.message || 'Erreur d\'envoi')
            }
        } catch (error) {
            console.error('Test email error:', error)
            toast.error('Erreur lors de l\'envoi')
        } finally {
            setTestingEmail(null)
        }
    }

    const selectedService = services.find(s => s.id === defaultServiceId)

    // Email test buttons configuration
    const emailTests = [
        { type: 'booking_confirmation' as const, label: 'Confirmation', icon: CheckCircle, color: 'text-green-600 bg-green-500/10' },
        { type: 'appointment_cancelled' as const, label: 'Annulation', icon: XCircle, color: 'text-red-600 bg-red-500/10' },
        { type: 'appointment_reminder' as const, label: 'Rappel', icon: Calendar, color: 'text-blue-600 bg-blue-500/10' },
        { type: 'welcome' as const, label: 'Bienvenue', icon: UserPlus, color: 'text-green-600 bg-green-500/10' },
        { type: 'rating_request' as const, label: 'Avis', icon: Star, color: 'text-yellow-600 bg-yellow-500/10' },
        { type: 'new_booking_admin' as const, label: 'Admin', icon: Bell, color: 'text-orange-600 bg-orange-500/10' },
    ]

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
            <div>
                <h1 className="text-xl font-bold">Paramètres</h1>
                <p className="text-sm text-muted-foreground">Configuration de la boutique</p>
            </div>

            {/* Default Service Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-2xl p-5 space-y-4"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Service par défaut</h2>
                        <p className="text-sm text-muted-foreground">
                            Ce service sera utilisé pour toutes les réservations
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Select
                        value={defaultServiceId || ''}
                        onValueChange={setDefaultServiceId}
                    >
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Sélectionner un service" />
                        </SelectTrigger>
                        <SelectContent>
                            {services.map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{service.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({service.duration_minutes} min)
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedService && (
                    <div className="p-3 bg-accent/50 rounded-xl">
                        <p className="text-sm">
                            <strong>{selectedService.name}</strong>
                        </p>
                        {selectedService.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {selectedService.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Durée: {selectedService.duration_minutes} minutes
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border rounded-2xl p-5"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Attribution automatique</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Les clients ne choisissent pas de barbier. Le système attribue automatiquement
                            le premier barbier disponible pour l&apos;heure choisie.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Notifications Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border rounded-2xl p-5 space-y-4"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">Notifications push</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Recevez une notification quand un client effectue une réservation.
                        </p>
                        <div className="mt-3">
                            <NotificationStatus />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <NotificationPrompt variant="minimal" className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestNotification}
                        disabled={testingNotification}
                        className="gap-2"
                    >
                        {testingNotification ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Admins
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestClientNotification}
                        disabled={testingClientNotification}
                        className="gap-2"
                    >
                        {testingClientNotification ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Tous
                    </Button>
                </div>
            </motion.div>

            {/* Email Testing Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border rounded-2xl p-5 space-y-4"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">Test des emails</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Testez les templates d&apos;emails avec des données fictives.
                        </p>
                    </div>
                </div>
                
                {/* Email Input */}
                <div className="space-y-2">
                    <Label htmlFor="testEmail">Email de test</Label>
                    <Input
                        id="testEmail"
                        type="email"
                        placeholder="votre@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="h-12 rounded-xl"
                    />
                </div>
                
                {/* Email Test Buttons Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {emailTests.map(({ type, label, icon: Icon, color }) => (
                        <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestEmail(type)}
                            disabled={testingEmail !== null || !testEmail}
                            className={cn(
                                "flex-col h-auto py-3 gap-1.5 transition-all",
                                testingEmail === type && "opacity-70"
                            )}
                        >
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
                                {testingEmail === type ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                        </Button>
                    ))}
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                    Les emails seront envoyés à l&apos;adresse indiquée ci-dessus.
                </p>
            </motion.div>

            {/* Speech Settings Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border rounded-2xl p-5 space-y-4"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Annonces vocales</h2>
                        <p className="text-sm text-muted-foreground">
                            Configurez la voix pour les annonces de rendez-vous
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Rate Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Vitesse</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {speechRate.toFixed(1)}x
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Lent</span>
                            <span>Normal</span>
                            <span>Rapide</span>
                        </div>
                    </div>

                    {/* Pitch Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Tonalité</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {speechPitch.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speechPitch}
                            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Grave</span>
                            <span>Normal</span>
                            <span>Aigu</span>
                        </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Volume</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {Math.round(speechVolume * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={speechVolume}
                            onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Faible</span>
                            <span>Moyen</span>
                            <span>Fort</span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleTestSpeech}
                        disabled={testingSpeech}
                        className="flex-1"
                    >
                        {testingSpeech ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Play className="w-4 h-4 mr-2" />
                        )}
                        Tester
                    </Button>
                    <Button
                        onClick={() => saveSpeechSettings(speechRate, speechPitch, speechVolume)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                    </Button>
                </div>
            </motion.div>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-full gradient-gold text-white shadow-gold"
            >
                {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                    </>
                )}
            </Button>
        </div>
    )
}

