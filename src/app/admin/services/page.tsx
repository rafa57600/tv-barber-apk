'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Scissors, Clock, Loader2, MoreVertical, Power, PowerOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { getServices, createService, updateService, deleteService } from '@/lib/firebase/firestore'
import type { Service } from '@/types/database.types'

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_minutes: 30
    })

    useEffect(() => {
        loadServices()
    }, [])

    async function loadServices() {
        try {
            setLoading(true)
            const data = await getServices(false)
            setServices(data)
        } catch (error) {
            console.error('Error loading services:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingService(service)
            setFormData({
                name: service.name,
                description: service.description || '',
                duration_minutes: service.duration_minutes
            })
        } else {
            setEditingService(null)
            setFormData({ name: '', description: '', duration_minutes: 30 })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis')
            return
        }

        setSaving(true)
        try {
            if (editingService) {
                await updateService(editingService.id, {
                    name: formData.name,
                    description: formData.description || null,
                    duration_minutes: formData.duration_minutes
                })
                toast.success('Service modifié')
            } else {
                await createService({
                    name: formData.name,
                    description: formData.description || null,
                    duration_minutes: formData.duration_minutes,
                    is_active: true
                })
                toast.success('Service ajouté')
            }

            setIsDialogOpen(false)
            loadServices()
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (service: Service) => {
        try {
            await updateService(service.id, { is_active: !service.is_active })
            toast.success(service.is_active ? 'Service désactivé' : 'Service activé')
            loadServices()
        } catch {
            toast.error('Erreur')
        }
    }

    const handleDelete = async (serviceId: string) => {
        if (!confirm('Êtes-vous sûr ?')) return
        try {
            await deleteService(serviceId)
            toast.success('Service supprimé')
            loadServices()
        } catch {
            toast.error('Erreur')
        }
    }

    const activeCount = services.filter(s => s.is_active).length

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
                    <h1 className="text-xl font-bold">Services</h1>
                    <p className="text-sm text-muted-foreground">
                        {activeCount} actif{activeCount !== 1 ? 's' : ''} sur {services.length}
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

            {/* Services List */}
            {services.length === 0 ? (
                <div className="text-center py-12">
                    <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">Aucun service</p>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                                "bg-card border rounded-2xl p-4",
                                !service.is_active && "opacity-60"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                    service.is_active ? "bg-primary/10" : "bg-muted"
                                )}>
                                    <Scissors className={cn(
                                        "w-6 h-6",
                                        service.is_active ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold truncate">{service.name}</p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs",
                                                service.is_active
                                                    ? "bg-green-500/10 text-green-600"
                                                    : "bg-gray-500/10 text-gray-500"
                                            )}
                                        >
                                            {service.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    {service.description && (
                                        <p className="text-sm text-muted-foreground truncate mb-1">
                                            {service.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{service.duration_minutes} min</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenDialog(service)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                                            {service.is_active ? (
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
                                            onClick={() => handleDelete(service.id)}
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
                            {editingService ? 'Modifier' : 'Nouveau service'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du service</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Coupe de cheveux"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description optionnelle"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Durée (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                                min={5}
                                step={5}
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
        </div>
    )
}
