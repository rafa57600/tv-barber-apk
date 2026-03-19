'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, User, Loader2, Search, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getAllProfiles, updateProfile } from '@/lib/firebase/firestore'
import type { Profile } from '@/types/database.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-500/10 text-red-600', icon: Shield },
    client: { label: 'Client', color: 'bg-blue-500/10 text-blue-600', icon: User }
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            setLoading(true)
            const data = await getAllProfiles()
            setUsers(data)
        } catch (error) {
            console.error('Error loading users:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'client') => {
        setUpdatingUserId(userId)
        try {
            await updateProfile(userId, { role: newRole })
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ))
            toast.success('Rôle mis à jour')
        } catch {
            toast.error('Erreur')
        } finally {
            setUpdatingUserId(null)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    const adminCount = users.filter(u => u.role === 'admin').length
    const clientCount = users.filter(u => u.role === 'client').length

    const formatDate = (createdAt: unknown): string => {
        if (!createdAt) return ''
        try {
            if (typeof createdAt === 'object' && createdAt && 'toDate' in createdAt) {
                return format((createdAt as { toDate: () => Date }).toDate(), 'dd MMM yyyy', { locale: fr })
            }
            if (typeof createdAt === 'string') {
                return format(new Date(createdAt), 'dd MMM yyyy', { locale: fr })
            }
            return ''
        } catch {
            return ''
        }
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
                <h1 className="text-xl font-bold">Utilisateurs</h1>
                <p className="text-sm text-muted-foreground">{users.length} membres</p>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
                <div className="flex-1 bg-card border rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold">{adminCount}</p>
                    <p className="text-xs text-muted-foreground">Admins</p>
                </div>
                <div className="flex-1 bg-card border rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">{clientCount}</p>
                    <p className="text-xs text-muted-foreground">Clients</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-full bg-accent/50 border-0"
                />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2">
                {[
                    { value: 'all', label: 'Tous' },
                    { value: 'admin', label: 'Admins' },
                    { value: 'client', label: 'Clients' }
                ].map(option => (
                    <button
                        key={option.value}
                        onClick={() => setRoleFilter(option.value)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                            roleFilter === option.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent text-muted-foreground"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Aucun utilisateur</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map((user, index) => {
                        const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.client
                        const RoleIcon = role.icon

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="bg-card border rounded-2xl p-4"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-primary">
                                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">
                                                {user.full_name || 'Sans nom'}
                                            </p>
                                            <Badge variant="outline" className={cn("gap-1 text-xs", role.color)}>
                                                <RoleIcon className="w-3 h-3" />
                                                {role.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {user.email || 'Pas d\'email'}
                                        </p>
                                        {formatDate(user.created_at) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Membre depuis {formatDate(user.created_at)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={updatingUserId === user.id}
                                            >
                                                {updatingUserId === user.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <MoreVertical className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {user.role !== 'admin' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                                    <Shield className="w-4 h-4 mr-2 text-red-600" />
                                                    Définir Admin
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'client' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'client')}>
                                                    <User className="w-4 h-4 mr-2 text-blue-600" />
                                                    Définir Client
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
