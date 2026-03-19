'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface QuickStatsProps {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    activeFilter: string
    onFilterChange: (filter: string) => void
}

export function QuickStats({
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    activeFilter,
    onFilterChange
}: QuickStatsProps) {
    const stats = [
        { id: 'all', label: 'Total', value: total, color: 'border-primary', textColor: 'text-primary', bgColor: 'bg-primary/10' },
        { id: 'pending', label: 'Attente', value: pending, color: 'border-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
        { id: 'confirmed', label: 'Confirmés', value: confirmed, color: 'border-green-500', textColor: 'text-green-600', bgColor: 'bg-green-500/10' },
        { id: 'completed', label: 'Terminés', value: completed, color: 'border-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    ]

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 pt-2 -mx-4 px-4 no-scrollbar">
            {stats.map((stat, index) => (
                <motion.button
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onFilterChange(stat.id)}
                    className={cn(
                        "flex-shrink-0 w-20 text-center transition-all",
                        activeFilter === stat.id && "scale-105"
                    )}
                >
                    <div className={cn(
                        "w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center mb-1 transition-all",
                        stat.color,
                        stat.bgColor,
                        activeFilter === stat.id && "ring-2 ring-offset-2 ring-offset-background"
                    )}>
                        <span className={cn("text-xl font-bold", stat.textColor)}>
                            {stat.value}
                        </span>
                    </div>
                    <span className={cn(
                        "text-xs transition-colors",
                        activeFilter === stat.id ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                        {stat.label}
                    </span>
                </motion.button>
            ))}
        </div>
    )
}
