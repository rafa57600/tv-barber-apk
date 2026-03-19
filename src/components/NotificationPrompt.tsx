'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface NotificationPromptProps {
    className?: string
    variant?: 'banner' | 'card' | 'minimal'
    showOnlyAfterBooking?: boolean
}

export function NotificationPrompt({ className, variant = 'card', showOnlyAfterBooking = false }: NotificationPromptProps) {
    const { permission, isSupported, isEnabled, loading, requestPermission } = useNotifications()
    const [dismissed, setDismissed] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMounted(true)
    }, [])

    // Don't render anything until mounted to prevent hydration mismatch
    if (!hasMounted) {
        return null
    }

    // Don't show if not supported, already enabled, or dismissed
    if (!isSupported || isEnabled || dismissed || permission === 'denied') {
        return null
    }

    if (variant === 'minimal') {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={requestPermission}
                disabled={loading}
                className={cn("gap-2", className)}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Bell className="w-4 h-4" />
                )}
                Activer les notifications
            </Button>
        )
    }

    if (variant === 'banner') {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                        "fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3",
                        className
                    )}
                >
                    <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5" />
                            <p className="text-sm">Activez les notifications pour être informé de vos rendez-vous</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={requestPermission}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activer'}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setDismissed(true)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        )
    }

    // Card variant (default)
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-card border rounded-2xl p-4",
                className
            )}
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">Activer les notifications</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Recevez des rappels et des mises à jour en temps réel pour vos rendez-vous
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={requestPermission}
                            disabled={loading}
                            className="gradient-gold text-white"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Bell className="w-4 h-4 mr-2" />
                                    Activer
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDismissed(true)}
                        >
                            Plus tard
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Status indicator for notification settings
export function NotificationStatus({ className }: { className?: string }) {
    const { isEnabled, isSupported, permission } = useNotifications()

    if (!isSupported) return null

    return (
        <div className={cn("flex items-center gap-2 text-sm", className)}>
            {isEnabled ? (
                <>
                    <Bell className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Notifications activées</span>
                </>
            ) : permission === 'denied' ? (
                <>
                    <BellOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Notifications bloquées</span>
                </>
            ) : (
                <>
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Notifications désactivées</span>
                </>
            )}
        </div>
    )
}
