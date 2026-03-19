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
    onDismiss?: () => void
}

/**
 * Hospital-style visual announcement banner.
 * Slides down from the top when a new RDV is detected,
 * shows client/service/time, and auto-dismisses when speech ends.
 */
export function AnnouncementBanner({ announcement, onDismiss }: AnnouncementBannerProps) {
    return (
        <AnimatePresence>
            {announcement && (
                <motion.div
                    initial={{ y: -120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -120, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                    className="fixed top-0 left-0 right-0 z-[100]"
                >
                    {/* Glow effect behind the banner */}
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/30 to-transparent blur-2xl pointer-events-none" />

                    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-600/90 via-green-500/85 to-emerald-500/90 shadow-[0_8px_60px_rgba(34,197,94,0.4)] backdrop-blur-xl">
                        {/* Animated pulse stripe */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -left-1/3 top-0 h-full w-2/3 bg-white/10 skew-x-[-18deg] animate-[shimmer_2s_ease-in-out_infinite]" />
                        </div>

                        <div className="relative flex items-center gap-6 px-8 py-5">
                            {/* Left: pulsing icon */}
                            <div className="flex shrink-0 flex-col items-center gap-1">
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                                    <span className="absolute inset-0 animate-ping rounded-2xl bg-white/20" />
                                    <Calendar className="h-8 w-8 text-white" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                                    Nouveau
                                </span>
                            </div>

                            {/* Center: appointment details */}
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                                    Nouveau Rendez-vous
                                </p>
                                <p className="truncate text-2xl font-bold text-white">
                                    {announcement.serviceName}
                                </p>
                                <div className="mt-1 flex items-center gap-4 text-sm text-white/90">
                                    <span className="flex items-center gap-1.5">
                                        <User className="h-4 w-4" />
                                        {announcement.clientName}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {announcement.dayName} {announcement.time}
                                    </span>
                                </div>
                            </div>

                            {/* Right: large time */}
                            <div className="shrink-0 text-right">
                                <p className="text-4xl font-bold text-white">{announcement.time}</p>
                                <p className="text-sm font-semibold capitalize text-white/70">
                                    {announcement.dayName}
                                </p>
                            </div>

                            {onDismiss && (
                                <button
                                    type="button"
                                    aria-label="Fermer annonce"
                                    onClick={onDismiss}
                                    className="shrink-0 rounded-full border border-white/30 bg-black/20 p-2 text-white/90 hover:bg-black/35"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Bottom progress bar */}
                        <div className="h-1 bg-white/20">
                            <motion.div
                                className="h-full bg-white/60"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 8, ease: 'linear' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
