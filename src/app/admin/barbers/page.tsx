'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Scissors, Loader2, MoreVertical, Power, PowerOff, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    getBarbers,
    createBarber,
    updateBarber,
    deleteBarber,
    getBarberAvailability,
    setBarberAvailability
} from '@/lib/firebase/firestore'
import type { Barber, BarberAvailability } from '@/types/database.types'

const daysOfWeek = [
    { key: 0, label: 'Dimanche', short: 'Dim' },
    { key: 1, label: 'Lundi', short: 'Lun' },
    { key: 2, label: 'Mardi', short: 'Mar' },
    { key: 3, label: 'Mercredi', short: 'Mer' },
    { key: 4, label: 'Jeudi', short: 'Jeu' },
    { key: 5, label: 'Vendredi', short: 'Ven' },
    { key: 6, label: 'Samedi', short: 'Sam' },
]

interface DayAvailability {
    day_of_week: number
    is_available: boolean
    start_time: string
    end_time: string
}

const defaultAvailability: DayAvailability[] = daysOfWeek.map(day => ({
    day_of_week: day.key,
    is_available: day.key >= 1 && day.key <= 5, // Mon-Fri by default
    start_time: '09:00',
    end_time: '19:00'
}))

export default function BarbersPage() {
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false)
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
    const [availabilityBarber, setAvailabilityBarber] = useState<Barber | null>(null)
    const [availability, setAvailability] = useState<DayAvailability[]>(defaultAvailability)
    const [formData, setFormData] = useState({
        name: '',
        specialties: ''
    })

    useEffect(() => {
        loadBarbers()
    }, [])

    async function loadBarbers() {
        try {
            setLoading(true)
            const data = await getBarbers(false)
            setBarbers(data)
        } catch (error) {
            console.error('Error loading barbers:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (barber?: Barber) => {
        if (barber) {
            setEditingBarber(barber)
            setFormData({
                name: barber.name,
                specialties: barber.specialties?.join(', ') || ''
            })
        } else {
            setEditingBarber(null)
            setFormData({ name: '', specialties: '' })
        }
        setIsDialogOpen(true)
    }

    const handleOpenAvailabilityDialog = async (barber: Barber) => {
        setAvailabilityBarber(barber)
        setSaving(true)

        try {
            const existingAvailability = await getBarberAvailability(barber.id)

            if (existingAvailability.length > 0) {
                // Merge with default to ensure all days are covered
                const merged = defaultAvailability.map(day => {
                    const existing = existingAvailability.find(a => a.day_of_week === day.day_of_week)
                    return existing ? {
                        day_of_week: existing.day_of_week,
                        is_available: existing.is_available,
                        start_time: existing.start_time,
                        end_time: existing.end_time
                    } : day
                })
                setAvailability(merged)
            } else {
                setAvailability([...defaultAvailability])
            }
        } catch {
            setAvailability([...defaultAvailability])
        } finally {
            setSaving(false)
        }

        setIsAvailabilityDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis')
            return
        }

        setSaving(true)
        try {
            if (editingBarber) {
                await updateBarber(editingBarber.id, {
                    name: formData.name,
                    specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : null
                })
                toast.success('Barbier modifié')
            } else {
                await createBarber({
                    name: formData.name,
                    specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : null,
                    is_active: true,
                    profile_id: null,
                    avatar_url: null
                })
                toast.success('Barbier ajouté')
            }

            setIsDialogOpen(false)
            loadBarbers()
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveAvailability = async () => {
        if (!availabilityBarber) return

        setSaving(true)
        try {
            await setBarberAvailability(availabilityBarber.id, availability)
            toast.success('Disponibilités enregistrées')
            setIsAvailabilityDialogOpen(false)
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const updateDayAvailability = (dayOfWeek: number, updates: Partial<DayAvailability>) => {
        setAvailability(prev => prev.map(day =>
            day.day_of_week === dayOfWeek ? { ...day, ...updates } : day
        ))
    }

    const handleToggleActive = async (barber: Barber) => {
        try {
            await updateBarber(barber.id, { is_active: !barber.is_active })
            toast.success(barber.is_active ? 'Barbier désactivé' : 'Barbier activé')
            loadBarbers()
        } catch {
            toast.error('Erreur')
        }
    }

    const handleDelete = async (barberId: string) => {
        if (!confirm('Êtes-vous sûr ?')) return
        try {
            await deleteBarber(barberId)
            toast.success('Barbier supprimé')
            loadBarbers()
        } catch {
            toast.error('Erreur')
        }
    }

    const activeCount = barbers.filter(b => b.is_active).length

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Équipe</h1>
                    <p className="text-sm text-muted-foreground">
                        {activeCount} actif{activeCount !== 1 ? 's' : ''} sur {barbers.length}
                    </p>
                </div>
                <Button
                    size="icon"
                    className="h-10 w-10 rounded-full gradient-gold shadow-gold"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            {/* Barbers List */}
            {barbers.length === 0 ? (
                <div className="text-center py-12">
                    <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">Aucun barbier</p>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {barbers.map((barber, index) => (
                        <motion.div
                            key={barber.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                                "bg-card border rounded-2xl p-4",
                                !barber.is_active && "opacity-60"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
                                    barber.is_active ? "gradient-gold" : "bg-muted"
                                )}>
                                    <span className="text-xl font-bold text-white">
                                        {barber.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{barber.name}</p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs",
                                                barber.is_active
                                                    ? "bg-green-500/10 text-green-600"
                                                    : "bg-gray-500/10 text-gray-500"
                                            )}
                                        >
                                            {barber.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    {barber.specialties && barber.specialties.length > 0 && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {barber.specialties.join(', ')}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenAvailabilityDialog(barber)}>
                                            <Clock className="w-4 h-4 mr-2" />
                                            Disponibilités
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDialog(barber)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleActive(barber)}>
                                            {barber.is_active ? (
                                                <>
                                                    <PowerOff className="w-4 h-4 mr-2" />
                                                    Désactiver
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="w-4 h-4 mr-2" />
                                                    Activer
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(barber.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-sm mx-4 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBarber ? 'Modifier' : 'Nouveau barbier'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nom du barbier"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialties">Spécialités</Label>
                            <Input
                                id="specialties"
                                value={formData.specialties}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                                placeholder="Ex: Coupes classiques, Barbe"
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl gradient-gold text-white"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Availability Dialog */}
            <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
                <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Disponibilités - {availabilityBarber?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {daysOfWeek.slice(1).concat(daysOfWeek.slice(0, 1)).map(day => {
                            const dayAvail = availability.find(a => a.day_of_week === day.key)
                            if (!dayAvail) return null

                            return (
                                <div key={day.key} className="bg-accent/30 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                                dayAvail.is_available
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted text-muted-foreground"
                                            )}>
                                                {day.short}
                                            </div>
                                            <span className="font-medium text-sm">{day.label}</span>
                                        </div>
                                        <Switch
                                            checked={dayAvail.is_available}
                                            onCheckedChange={(checked) =>
                                                updateDayAvailability(day.key, { is_available: checked })
                                            }
                                        />
                                    </div>

                                    {dayAvail.is_available && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={dayAvail.start_time}
                                                onChange={(e) =>
                                                    updateDayAvailability(day.key, { start_time: e.target.value })
                                                }
                                                className="flex-1 h-9 rounded-lg text-center text-sm"
                                            />
                                            <span className="text-muted-foreground text-sm">→</span>
                                            <Input
                                                type="time"
                                                value={dayAvail.end_time}
                                                onChange={(e) =>
                                                    updateDayAvailability(day.key, { end_time: e.target.value })
                                                }
                                                className="flex-1 h-9 rounded-lg text-center text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                            onClick={() => setIsAvailabilityDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl gradient-gold text-white"
                            onClick={handleSaveAvailability}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
