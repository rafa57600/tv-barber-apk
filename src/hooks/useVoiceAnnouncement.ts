'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

import type { AnnouncementData } from '@/components/display/AnnouncementBanner'

interface AnnounceOptions {
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
    onSpeechStart?: () => void
    onSpeechEnd?: () => void
}

/**
 * Hook for text-to-speech announcements
 * Uses Web Speech API (SpeechSynthesis)
 */
export function useVoiceAnnouncement(options: AnnounceOptions = {}) {
    const {
        lang = 'fr-FR',
        rate = 1,
        pitch = 1,
        volume = 1,
        onSpeechStart,
        onSpeechEnd
    } = options

    const isSpeaking = useRef(false)

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn('Speech synthesis not supported')
            return
        }

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        const voices = window.speechSynthesis.getVoices()
        const frenchVoice = voices.find(v =>
            v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find(v => v.lang.startsWith('fr'))

        if (frenchVoice) {
            utterance.voice = frenchVoice
        }

        utterance.onstart = () => {
            isSpeaking.current = true
            onSpeechStart?.()
        }
        utterance.onend = () => {
            isSpeaking.current = false
            onSpeechEnd?.()
        }
        utterance.onerror = () => {
            isSpeaking.current = false
            onSpeechEnd?.()
        }

        window.speechSynthesis.speak(utterance)
    }, [lang, rate, pitch, volume, onSpeechStart, onSpeechEnd])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!window.speechSynthesis) return

        const loadVoices = () => {
            window.speechSynthesis.getVoices()
        }

        loadVoices()
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
        }
    }, [])

    return { speak }
}

// ─── French helpers ──────────────────────────────────────────────────────────

const FRENCH_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

function getFrenchDayName(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return FRENCH_DAYS[date.getDay()]
}

function getSpeechSettings(): { rate: number; pitch: number; volume: number } {
    if (typeof window === 'undefined') return { rate: 1.0, pitch: 1.0, volume: 1.0 }

    try {
        const saved = localStorage.getItem('speechSettings')
        if (saved) {
            const settings = JSON.parse(saved)
            return {
                rate: settings.rate ?? 1.0,
                pitch: settings.pitch ?? 1.0,
                volume: settings.volume ?? 1.0
            }
        }
    } catch {
        console.error('Error reading speech settings')
    }

    return { rate: 1.0, pitch: 1.0, volume: 1.0 }
}

// ─── Appointment announcer ───────────────────────────────────────────────────

interface AppointmentForAnnouncement {
    id: string
    date: string
    start_time: string
    client_name?: string
    serviceData?: { name: string }
}

/**
 * Hook to detect and announce new appointments (hospital-style).
 *
 * - Plays a 3-tone hospital chime
 * - Shows a visual banner (returns `activeAnnouncement`)
 * - Speaks a French TTS announcement
 * - Pauses music before, resumes after
 */
export function useNewAppointmentAnnouncer(
    appointments: AppointmentForAnnouncement[],
    enabled: boolean = true,
    onPauseMusic?: () => void,
    onResumeMusic?: () => void
): { activeAnnouncement: AnnouncementData | null; dismissAnnouncement: () => void; isSpeaking: boolean } {
    const previousIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)
    const [isSpeakingState, setIsSpeakingState] = useState(false)
    const isAnnouncing = useRef(false)
    const [activeAnnouncement, setActiveAnnouncement] = useState<AnnouncementData | null>(null)

    const settings = getSpeechSettings()

    const { speak } = useVoiceAnnouncement({
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
        onSpeechStart: () => {
            setIsSpeakingState(true)
            onPauseMusic?.()
        },
        onSpeechEnd: () => {
            setIsSpeakingState(false)
            isAnnouncing.current = false
            // Dismiss the banner 1s after speech ends
            setTimeout(() => {
                setActiveAnnouncement(null)
                onResumeMusic?.()
            }, 1000)
        }
    })

    const dismissAnnouncement = useCallback(() => {
        if (!activeAnnouncement) return
        isAnnouncing.current = false
        setIsSpeakingState(false)
        setActiveAnnouncement(null)
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        onResumeMusic?.()
    }, [activeAnnouncement, onResumeMusic])

    useEffect(() => {
        if (!enabled) return

        if (isFirstLoad.current) {
            appointments.forEach(apt => previousIds.current.add(apt.id))
            isFirstLoad.current = false
            return
        }

        const currentIds = new Set(appointments.map(apt => apt.id))
        const newAppointments = appointments.filter(apt => !previousIds.current.has(apt.id))

        if (newAppointments.length > 0 && !isAnnouncing.current) {
            const apt = newAppointments[0]
            isAnnouncing.current = true // Keep simple lock here

            // Wait 15 seconds before starting the announcement sequence
            setTimeout(() => {
                const clientName = apt.client_name || 'Un client'
                const serviceName = apt.serviceData?.name || 'une coupe'
                const dayName = getFrenchDayName(apt.date)
                const time = apt.start_time

                // 1. Pause music
                onPauseMusic?.()

                // 2. Show visual banner
                setActiveAnnouncement({ clientName, serviceName, dayName, time })

                // 3. Play hospital chime
                playHospitalChime()

                // 4. Speak announcement after chime finishes (~1.6 s)
                setTimeout(() => {
                    const message =
                        `Une nouvelle réservation vient d'être effectuée par ${clientName}. ` +
                        `Elle concerne une séance de ${serviceName}, prévue ${dayName} à ${time.replace(':', ' heure ')}. ` +
                        `Merci de votre attention.`
                    speak(message)
                }, 1800)
            }, 15000)
        }

        previousIds.current = currentIds
    }, [appointments, enabled, speak, onPauseMusic, onResumeMusic])

    return { activeAnnouncement, dismissAnnouncement, isSpeaking: isSpeakingState }
}

// ─── Hospital-style 3-tone chime ─────────────────────────────────────────────

/**
 * Plays a distinctive hospital PA chime:
 * C5 → E5 → G5 (ascending major triad), then G5 → E5 → C5 (descending).
 * Total duration: ~1.6 s
 */
export function playHospitalChime() {
    if (typeof window === 'undefined') return

    try {
        const AudioCtx = window.AudioContext ||
            (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()

        const playTone = (freq: number, startTime: number, duration: number, gain: number = 0.35) => {
            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()

            osc.connect(gainNode)
            gainNode.connect(ctx.destination)

            osc.frequency.value = freq
            osc.type = 'sine'

            const t = ctx.currentTime + startTime
            gainNode.gain.setValueAtTime(gain, t)
            gainNode.gain.exponentialRampToValueAtTime(0.005, t + duration)

            osc.start(t)
            osc.stop(t + duration)
        }

        // Ascending triad: C5 → E5 → G5
        playTone(523.25, 0, 0.28, 0.38)      // C5
        playTone(659.25, 0.22, 0.28, 0.38)    // E5
        playTone(783.99, 0.44, 0.35, 0.40)    // G5

        // Descending triad: G5 → E5 → C5
        playTone(783.99, 0.85, 0.28, 0.35)    // G5
        playTone(659.25, 1.07, 0.28, 0.35)    // E5
        playTone(523.25, 1.29, 0.35, 0.38)    // C5

        // Release audio resources after chime completion
        window.setTimeout(() => {
            ctx.close().catch(() => {})
        }, 2200)
    } catch (error) {
        console.warn('Could not play hospital chime:', error)
    }
}

// Keep legacy export for backwards compat
export const playNotificationSound = playHospitalChime
