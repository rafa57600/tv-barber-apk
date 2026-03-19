'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Plus, Trash2, Loader2, Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    getShopSchedule,
    saveShopSchedule,
    getShopClosures,
    createShopClosure,
    deleteShopClosure
} from '@/lib/firebase/firestore'
import type { ShopClosure } from '@/types/database.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const daysOfWeek = [
    { key: 'monday', label: 'Lundi', short: 'Lun' },
    { key: 'tuesday', label: 'Mardi', short: 'Mar' },
    { key: 'wednesday', label: 'Mercredi', short: 'Mer' },
    { key: 'thursday', label: 'Jeudi', short: 'Jeu' },
    { key: 'friday', label: 'Vendredi', short: 'Ven' },
    { key: 'saturday', label: 'Samedi', short: 'Sam' },
    { key: 'sunday', label: 'Dimanche', short: 'Dim' }
] as const

type DayKey = typeof daysOfWeek[number]['key']

interface DaySchedule {
    isOpen: boolean
    openTime: string
    closeTime: string
}

const defaultSchedule: Record<DayKey, DaySchedule> = {
    monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
}

export default function SchedulePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(defaultSchedule)
    const [closures, setClosures] = useState<ShopClosure[]>([])
    const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false)
    const [newClosure, setNewClosure] = useState({ date: '', reason: '' })
    const [activeTab, setActiveTab] = useState<'hours' | 'closures'>('hours')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [scheduleData, closuresData] = await Promise.all([
                getShopSchedule(),
                getShopClosures()
            ])

            if (scheduleData) {
                // Convert schedule data to our local format
                const converted: Record<DayKey, DaySchedule> = { ...defaultSchedule }
                const data = scheduleData as unknown as Record<string, DaySchedule>
                for (const day of daysOfWeek) {
                    const dayData = data[day.key]
                    if (dayData) {
                        converted[day.key] = {
                            isOpen: dayData.isOpen ?? true,
                            openTime: dayData.openTime ?? '09:00',
                            closeTime: dayData.closeTime ?? '19:00'
                        }
                    }
                }
                setSchedule(converted)
            }
            setClosures(closuresData)
        } catch (error) {
            console.error('Error loading schedule:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSchedule = async () => {
        setSaving(true)
        try {
            // Convert to ShopSchedule format (array of DaySchedule objects)
            const scheduleArray = daysOfWeek.map(day => ({
                day: day.key,
                ...schedule[day.key]
            }))
            await saveShopSchedule(scheduleArray as unknown as Parameters<typeof saveShopSchedule>[0])
            toast.success('Horaires enregistrés')
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleAddClosure = async () => {
        if (!newClosure.date) {
            toast.error('Veuillez sélectionner une date')
            return
        }

        try {
            await createShopClosure({
                date: newClosure.date,
                reason: newClosure.reason || null
            })
            toast.success('Fermeture ajoutée')
            setIsClosureDialogOpen(false)
            setNewClosure({ date: '', reason: '' })
            loadData()
        } catch {
            toast.error('Erreur')
        }
    }

    const handleRemoveClosure = async (closureId: string) => {
        try {
            await deleteShopClosure(closureId)
            toast.success('Fermeture supprimée')
            loadData()
        } catch {
            toast.error('Erreur')
        }
    }

    const updateDaySchedule = (day: DayKey, updates: Partial<DaySchedule>) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], ...updates }
        }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="px-4 py-6 space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold">Horaires</h1>
                <p className="text-sm text-muted-foreground">Gérez vos disponibilités</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-accent rounded-full">
                <button
                    onClick={() => setActiveTab('hours')}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all",
                        activeTab === 'hours'
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground"
                    )}
                >
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    Horaires
                </button>
                <button
                    onClick={() => setActiveTab('closures')}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all",
                        activeTab === 'closures'
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground"
                    )}
                >
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Fermetures
                </button>
            </div>

            {/* Hours Tab */}
            {activeTab === 'hours' && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                >
                    {daysOfWeek.map((day, index) => {
                        const daySchedule = schedule[day.key]

                        return (
                            <motion.div
                                key={day.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-card border rounded-2xl p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                                            daySchedule.isOpen
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {day.short}
                                        </div>
                                        <span className="font-medium">{day.label}</span>
                                    </div>
                                    <Switch
                                        checked={daySchedule.isOpen}
                                        onCheckedChange={(checked) => updateDaySchedule(day.key, { isOpen: checked })}
                                    />
                                </div>

                                {daySchedule.isOpen && (
                                    <div className="flex items-center gap-2 pl-13">
                                        <Input
                                            type="time"
                                            value={daySchedule.openTime}
                                            onChange={(e) => updateDaySchedule(day.key, { openTime: e.target.value })}
                                            className="flex-1 h-10 rounded-xl text-center"
                                        />
                                        <span className="text-muted-foreground">→</span>
                                        <Input
                                            type="time"
                                            value={daySchedule.closeTime}
                                            onChange={(e) => updateDaySchedule(day.key, { closeTime: e.target.value })}
                                            className="flex-1 h-10 rounded-xl text-center"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}

                    {/* Save Button */}
                    <Button
                        onClick={handleSaveSchedule}
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
                </motion.div>
            )}

            {/* Closures Tab */}
            {activeTab === 'closures' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    {/* Add Closure Button */}
                    <Button
                        onClick={() => setIsClosureDialogOpen(true)}
                        className="w-full h-12 rounded-full gradient-gold text-white shadow-gold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une fermeture
                    </Button>

                    {/* Closures List */}
                    {closures.length === 0 ? (
                        <div className="text-center py-12 bg-card border rounded-2xl">
                            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">Aucune fermeture prévue</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {closures
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map((closure, index) => (
                                    <motion.div
                                        key={closure.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="bg-card border rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-red-600">
                                                    {format(new Date(closure.date), 'd')}
                                                </span>
                                                <span className="text-[10px] text-red-600 uppercase">
                                                    {format(new Date(closure.date), 'MMM', { locale: fr })}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">
                                                    {format(new Date(closure.date), 'EEEE d MMMM', { locale: fr })}
                                                </p>
                                                {closure.reason && (
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {closure.reason}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveClosure(closure.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Add Closure Dialog */}
            <Dialog open={isClosureDialogOpen} onOpenChange={setIsClosureDialogOpen}>
                <DialogContent className="max-w-sm mx-4 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Nouvelle fermeture</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={newClosure.date}
                                onChange={(e) => setNewClosure(prev => ({ ...prev, date: e.target.value }))}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Raison (optionnel)</Label>
                            <Input
                                id="reason"
                                value={newClosure.reason}
                                onChange={(e) => setNewClosure(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Ex: Jour férié"
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                            onClick={() => setIsClosureDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl gradient-gold text-white"
                            onClick={handleAddClosure}
                        >
                            Ajouter
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
