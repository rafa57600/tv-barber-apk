'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, User, X } from 'lucide-react'

export interface AnnouncementData {
    clientName: string
    serviceName: string
    dayName: string
    time: string
}

interface AnnouncementBannerProps {
    announcement: AnnouncementData | null
    isSpeaking?: boolean
    onDismiss?: () => void
}

/**
 * Premium "Floating Island" announcement banner.
 * Matches website's Glass-Dark aesthetic with vibrant green glow.
 */
export function AnnouncementBanner({ announcement, isSpeaking, onDismiss }: AnnouncementBannerProps) {
    return (
        <AnimatePresence>
            {announcement && (
                <motion.div
                    initial={{ y: -50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-6"
                >
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/80 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] glass-dark">
                        {/* Subtle Green Glow */}
                        <div className="absolute inset-0 bg-green-500/5 blur-3xl pointer-events-none" />
                        
                        {/* Top Animated Border Gradient (Glow Green) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />

                        <div className="relative flex items-center gap-6 px-8 py-6">
                            {/* Left Section: Pulsing Icon + Visualizer */}
                            <div className="flex shrink-0 flex-col items-center gap-2">
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-white/5 shadow-inner">
                                    <Calendar className="h-9 w-9 text-green-400" />
                                    {isSpeaking && (
                                        <div className="absolute -bottom-1 flex items-end gap-0.5 h-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [4, 12, 4] }}
                                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                    className="w-1 bg-green-400 rounded-full"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Center Section: Details */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <motion.p 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400/80"
                                >
                                    Nouveau Rendez-vous
                                </motion.p>
                                <motion.h2 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="truncate text-3xl font-bold tracking-tight text-white"
                                >
                                    {announcement.clientName}
                                </motion.h2>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex items-center gap-4 text-zinc-400"
                                >
                                    <span className="flex items-center gap-2 text-base font-medium">
                                        <Clock className="h-4 w-4 text-green-400/60" />
                                        {announcement.time}
                                    </span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                                    <span className="truncate text-base font-medium">
                                        {announcement.serviceName}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Right Section: Large Day/Date */}
                            <div className="shrink-0 border-l border-white/5 pl-6 text-right">
                                <p className="text-xl font-bold text-white uppercase tracking-wider">
                                    {announcement.dayName}
                                </p>
                                <p className="text-sm font-medium text-zinc-500">Aujourd&apos;hui</p>
                            </div>

                            {/* Close Button */}
                            {onDismiss && (
                                <button
                                    onClick={onDismiss}
                                    className="ml-2 shrink-0 rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Progress Bar (Linked to speech duration if possible, otherwise fixed fallback) */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
                            <motion.div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 glow-green"
                                initial={{ width: '0%' }}
                                animate={{ width: isSpeaking ? '100%' : '100%' }}
                                transition={{ 
                                    duration: isSpeaking ? 15 : 8, // Rough estimate if not perfectly synced
                                    ease: "linear"
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
