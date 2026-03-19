import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    Timestamp,
    QueryConstraint,
    onSnapshot
} from 'firebase/firestore'
import { db } from './config'
import type {
    Barber,
    Service,
    Appointment,
    BarberAvailability,
    Profile,
    ShopClosure
} from '@/types/database.types'

// Collection references
const COLLECTIONS = {
    PROFILES: 'profiles',
    BARBERS: 'barbers',
    SERVICES: 'services',
    APPOINTMENTS: 'appointments',
    BARBER_AVAILABILITY: 'barber_availability',
    SHOP_CLOSURES: 'shop_closures',
    SHOP_SETTINGS: 'shop_settings',
    FCM_TOKENS: 'fcm_tokens',
    DISPLAY_STATE: 'display_state',
}

// Check if Firebase is configured
function ensureDb() {
    if (!db) {
        throw new Error('Firebase is not configured. Please add your Firebase credentials to .env file.')
    }
    return db
}

// ==================== PROFILES ====================
export async function getProfile(userId: string): Promise<Profile | null> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.PROFILES, userId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Profile : null
}

export async function createProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.PROFILES, userId)
    await setDoc(docRef, {
        ...data,
        role: data.role || 'client',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
    }, { merge: true })
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.PROFILES, userId)
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
    })
}

export async function getAllProfiles(): Promise<Profile[]> {
    const database = ensureDb()
    const q = query(collection(database, COLLECTIONS.PROFILES), orderBy('created_at', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile))
}

// ==================== BARBERS ====================
export async function getBarbers(activeOnly = false): Promise<Barber[]> {
    const database = ensureDb()
    let q
    if (activeOnly) {
        q = query(
            collection(database, COLLECTIONS.BARBERS),
            where('is_active', '==', true)
        )
    } else {
        q = query(collection(database, COLLECTIONS.BARBERS))
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Barber))
}

export async function getBarber(barberId: string): Promise<Barber | null> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.BARBERS, barberId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Barber : null
}

export async function createBarber(data: Omit<Barber, 'id' | 'created_at'>): Promise<string> {
    const database = ensureDb()
    const docRef = await addDoc(collection(database, COLLECTIONS.BARBERS), {
        ...data,
        is_active: data.is_active ?? true,
        created_at: Timestamp.now()
    })
    return docRef.id
}

export async function updateBarber(barberId: string, data: Partial<Barber>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.BARBERS, barberId)
    await updateDoc(docRef, data)
}

export async function deleteBarber(barberId: string): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.BARBERS, barberId)
    await deleteDoc(docRef)
}

// ==================== SERVICES ====================
export async function getServices(activeOnly = false): Promise<Service[]> {
    const database = ensureDb()
    let q
    if (activeOnly) {
        q = query(
            collection(database, COLLECTIONS.SERVICES),
            where('is_active', '==', true)
        )
    } else {
        q = query(collection(database, COLLECTIONS.SERVICES))
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service))
}

export async function getService(serviceId: string): Promise<Service | null> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SERVICES, serviceId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Service : null
}

export async function createService(data: Omit<Service, 'id' | 'created_at'>): Promise<string> {
    const database = ensureDb()
    const docRef = await addDoc(collection(database, COLLECTIONS.SERVICES), {
        ...data,
        duration_minutes: data.duration_minutes ?? 30,
        is_active: data.is_active ?? true,
        created_at: Timestamp.now()
    })
    return docRef.id
}

export async function updateService(serviceId: string, data: Partial<Service>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SERVICES, serviceId)
    await updateDoc(docRef, data)
}

export async function deleteService(serviceId: string): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SERVICES, serviceId)
    await deleteDoc(docRef)
}

// ==================== APPOINTMENTS ====================
export async function getAppointments(filters?: {
    date?: string
    barberId?: string
    clientId?: string
    status?: string
}): Promise<Appointment[]> {
    const database = ensureDb()
    const constraints: QueryConstraint[] = []

    if (filters?.date) {
        constraints.push(where('date', '==', filters.date))
    }
    if (filters?.barberId) {
        constraints.push(where('barber_id', '==', filters.barberId))
    }
    if (filters?.clientId) {
        constraints.push(where('client_id', '==', filters.clientId))
    }
    if (filters?.status) {
        constraints.push(where('status', '==', filters.status))
    }

    const q = query(collection(database, COLLECTIONS.APPOINTMENTS), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
}

export async function getAllAppointments(): Promise<Appointment[]> {
    const database = ensureDb()
    const snapshot = await getDocs(collection(database, COLLECTIONS.APPOINTMENTS))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
}

/**
 * Get appointments created within the last N minutes (for real-time announcements)
 * This fetches ALL recent appointments regardless of their scheduled date
 */
export async function getRecentlyCreatedAppointments(minutesAgo: number = 5): Promise<Appointment[]> {
    const database = ensureDb()
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000)
    
    // Get all appointments and filter by created_at client-side
    // (Firestore Timestamp comparison can be tricky)
    const snapshot = await getDocs(
        query(
            collection(database, COLLECTIONS.APPOINTMENTS),
            orderBy('created_at', 'desc')
        )
    )
    
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        .filter(apt => {
            if (!apt.created_at) return false
            const createdAt = typeof apt.created_at === 'string' 
                ? new Date(apt.created_at) 
                : (apt.created_at as { toDate: () => Date }).toDate?.() || new Date(apt.created_at as unknown as string)
            return createdAt >= cutoffTime
        })
}

export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.APPOINTMENTS, appointmentId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Appointment : null
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const database = ensureDb()
    const docRef = await addDoc(collection(database, COLLECTIONS.APPOINTMENTS), {
        ...data,
        status: data.status || 'pending',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
    })
    return docRef.id
}

export async function updateAppointment(appointmentId: string, data: Partial<Appointment>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.APPOINTMENTS, appointmentId)
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
    })
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
    await updateAppointment(appointmentId, { status: 'cancelled' })
}

// ==================== SHOP CLOSURES ====================
export async function getShopClosures(): Promise<ShopClosure[]> {
    const database = ensureDb()
    const snapshot = await getDocs(collection(database, COLLECTIONS.SHOP_CLOSURES))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopClosure))
}

export async function createShopClosure(data: Omit<ShopClosure, 'id' | 'created_at'>): Promise<string> {
    const database = ensureDb()
    const docRef = await addDoc(collection(database, COLLECTIONS.SHOP_CLOSURES), {
        ...data,
        created_at: Timestamp.now()
    })
    return docRef.id
}

export async function deleteShopClosure(closureId: string): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SHOP_CLOSURES, closureId)
    await deleteDoc(docRef)
}

// ==================== BARBER AVAILABILITY ====================
export async function getBarberAvailability(barberId: string): Promise<BarberAvailability[]> {
    const database = ensureDb()
    const q = query(
        collection(database, COLLECTIONS.BARBER_AVAILABILITY),
        where('barber_id', '==', barberId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BarberAvailability))
}

export async function setBarberAvailability(
    barberId: string,
    availability: Omit<BarberAvailability, 'id' | 'barber_id'>[]
): Promise<void> {
    const database = ensureDb()
    // Delete existing availability for this barber
    const existingAvailability = await getBarberAvailability(barberId)
    await Promise.all(
        existingAvailability.map(a => deleteDoc(doc(database, COLLECTIONS.BARBER_AVAILABILITY, a.id)))
    )

    // Add new availability
    await Promise.all(
        availability.map(a =>
            addDoc(collection(database, COLLECTIONS.BARBER_AVAILABILITY), {
                ...a,
                barber_id: barberId
            })
        )
    )
}

// ==================== UTILITY FUNCTIONS ====================
export async function getAvailableTimeSlots(
    date: string,
    barberId: string,
    serviceDuration: number = 30
): Promise<string[]> {
    // Get barber's availability for this day of week
    const dayOfWeek = new Date(date).getDay()
    const availability = await getBarberAvailability(barberId)
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)

    if (!dayAvailability || !dayAvailability.is_available) {
        return []
    }

    // Get existing appointments for this barber on this date
    const appointments = await getAppointments({ date, barberId })
    const bookedSlots = appointments
        .filter(a => a.status !== 'cancelled')
        .map(a => a.start_time)

    // Generate time slots
    const slots: string[] = []
    const startHour = parseInt(dayAvailability.start_time.split(':')[0])
    const endHour = parseInt(dayAvailability.end_time.split(':')[0])

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            if (!bookedSlots.includes(timeSlot)) {
                slots.push(timeSlot)
            }
        }
    }

    return slots
}

// ==================== STATS ====================
export async function getDashboardStats(): Promise<{
    todayAppointments: number
    pendingBookings: number
    totalClients: number
    totalBarbers: number
    totalServices: number
}> {
    const database = ensureDb()
    const today = new Date().toISOString().split('T')[0]

    // Get today's appointments
    const todayAppointmentsQuery = query(
        collection(database, COLLECTIONS.APPOINTMENTS),
        where('date', '==', today)
    )
    const todaySnapshot = await getDocs(todayAppointmentsQuery)

    // Get pending appointments
    const pendingQuery = query(
        collection(database, COLLECTIONS.APPOINTMENTS),
        where('status', '==', 'pending')
    )
    const pendingSnapshot = await getDocs(pendingQuery)

    // Get total clients
    const profilesSnapshot = await getDocs(collection(database, COLLECTIONS.PROFILES))

    // Get barbers count
    const barbersSnapshot = await getDocs(collection(database, COLLECTIONS.BARBERS))

    // Get services count
    const servicesSnapshot = await getDocs(collection(database, COLLECTIONS.SERVICES))

    return {
        todayAppointments: todaySnapshot.size,
        pendingBookings: pendingSnapshot.size,
        totalClients: profilesSnapshot.size,
        totalBarbers: barbersSnapshot.size,
        totalServices: servicesSnapshot.size
    }
}

// ==================== SHOP SCHEDULE ====================
export interface DaySchedule {
    day: number // 0-6 (Sunday-Saturday)
    is_open: boolean
    start_time: string // HH:mm format
    end_time: string // HH:mm format
}

export interface ShopSchedule {
    id?: string
    schedule: DaySchedule[]
    updated_at?: Date
}

const SHOP_SCHEDULE_DOC_ID = 'default_schedule'

export async function getShopSchedule(): Promise<ShopSchedule | null> {
    const database = ensureDb()
    const docRef = doc(database, 'shop_schedule', SHOP_SCHEDULE_DOC_ID)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ShopSchedule
    }

    // Return default schedule if none exists
    return null
}

export async function saveShopSchedule(schedule: DaySchedule[]): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, 'shop_schedule', SHOP_SCHEDULE_DOC_ID)
    await setDoc(docRef, {
        schedule,
        updated_at: Timestamp.now()
    })
}

// ==================== DATE AVAILABILITY ====================
export async function getDateAvailability(date: string): Promise<'available' | 'limited' | 'full' | 'closed'> {
    const database = ensureDb()

    // Check if it's a closure day
    const closures = await getShopClosures()
    if (closures.some(c => c.date === date)) {
        return 'closed'
    }

    // Check weekly schedule
    const scheduleData = await getShopSchedule()
    if (scheduleData) {
        const dateObj = new Date(date)
        const dayOfWeek = dateObj.getDay()
        const daySchedule = scheduleData.schedule.find(s => s.day === dayOfWeek)

        if (daySchedule && !daySchedule.is_open) {
            return 'closed'
        }
    }

    // Check booked appointments count
    const appointmentsQuery = query(
        collection(database, COLLECTIONS.APPOINTMENTS),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
    )
    const appointmentsSnap = await getDocs(appointmentsQuery)
    const bookingsCount = appointmentsSnap.size

    // Get total available slots (assuming 8 hours * 2 slots per hour = 16 max)
    const maxSlots = 16

    if (bookingsCount >= maxSlots) {
        return 'full'
    } else if (bookingsCount >= maxSlots * 0.7) {
        return 'limited'
    }

    return 'available'
}

// ==================== SHOP SETTINGS ====================
export interface ShopSettings {
    default_service_id: string | null
    auto_assign_barber: boolean
}

export async function getShopSettings(): Promise<ShopSettings | null> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SHOP_SETTINGS, 'default')
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data() as ShopSettings : null
}

export async function saveShopSettings(settings: Partial<ShopSettings>): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.SHOP_SETTINGS, 'default')
    await setDoc(docRef, settings, { merge: true })
}

// ==================== COMBINED SLOT AVAILABILITY ====================
export interface AvailableSlot {
    time: string
    barberId: string
    barberName: string
}

export async function getAvailableSlotsForDate(date: string): Promise<AvailableSlot[]> {
    const database = ensureDb()

    // Get all active barbers
    const activeBarbers = await getBarbers(true)
    if (activeBarbers.length === 0) return []

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay()

    // Collect all available slots from all barbers
    const allSlots: AvailableSlot[] = []

    for (const barber of activeBarbers) {
        // Get this barber's availability for this day
        const availability = await getBarberAvailability(barber.id)
        const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)

        if (!dayAvailability || !dayAvailability.is_available) {
            continue // Barber not available this day
        }

        // Get this barber's existing appointments for this date
        const appointments = await getAppointments({ date, barberId: barber.id })
        const bookedTimes = appointments
            .filter(apt => apt.status !== 'cancelled')
            .map(apt => apt.start_time)

        // Generate time slots for this barber
        const startHour = parseInt(dayAvailability.start_time.split(':')[0])
        const endHour = parseInt(dayAvailability.end_time.split(':')[0])

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

                // Skip if already booked
                if (bookedTimes.includes(timeSlot)) continue

                // Add this slot (first available barber wins for each time)
                const existingSlot = allSlots.find(s => s.time === timeSlot)
                if (!existingSlot) {
                    allSlots.push({
                        time: timeSlot,
                        barberId: barber.id,
                        barberName: barber.name
                    })
                }
            }
        }
    }

    // Sort by time
    return allSlots.sort((a, b) => a.time.localeCompare(b.time))
}

// Get just the time strings for backward compatibility
export async function getAvailableTimesForDate(date: string): Promise<string[]> {
    const slots = await getAvailableSlotsForDate(date)
    return slots.map(s => s.time)
}

// ==================== FCM TOKENS ====================
export interface FCMToken {
    id?: string
    user_id: string
    token: string
    role: 'admin' | 'client'
    created_at?: Date
    updated_at?: Date
}

export async function saveFCMToken(userId: string, token: string, role: 'admin' | 'client'): Promise<void> {
    const database = ensureDb()

    // Check if token already exists for this user
    const tokenQuery = query(
        collection(database, COLLECTIONS.FCM_TOKENS),
        where('user_id', '==', userId),
        where('token', '==', token)
    )
    const existing = await getDocs(tokenQuery)

    if (!existing.empty) {
        // Update existing token
        const docRef = existing.docs[0].ref
        await updateDoc(docRef, {
            updated_at: Timestamp.now()
        })
    } else {
        // Create new token entry
        await addDoc(collection(database, COLLECTIONS.FCM_TOKENS), {
            user_id: userId,
            token,
            role,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        })
    }
}

export async function removeFCMToken(userId: string, token: string): Promise<void> {
    const database = ensureDb()

    const tokenQuery = query(
        collection(database, COLLECTIONS.FCM_TOKENS),
        where('user_id', '==', userId),
        where('token', '==', token)
    )
    const snapshot = await getDocs(tokenQuery)

    for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref)
    }
}

export async function getAdminFCMTokens(): Promise<string[]> {
    const database = ensureDb()

    const tokenQuery = query(
        collection(database, COLLECTIONS.FCM_TOKENS),
        where('role', '==', 'admin')
    )
    const snapshot = await getDocs(tokenQuery)

    return snapshot.docs.map(doc => doc.data().token)
}

export async function getUserFCMTokens(userId: string): Promise<string[]> {
    const database = ensureDb()

    const tokenQuery = query(
        collection(database, COLLECTIONS.FCM_TOKENS),
        where('user_id', '==', userId)
    )
    const snapshot = await getDocs(tokenQuery)

    return snapshot.docs.map(doc => doc.data().token)
}

export async function getAllFCMTokens(): Promise<string[]> {
    const database = ensureDb()

    const snapshot = await getDocs(collection(database, COLLECTIONS.FCM_TOKENS))
    return snapshot.docs.map(doc => doc.data().token)
}

// Get all admin emails for notifications
export async function getAdminEmails(): Promise<string[]> {
    const database = ensureDb()

    const profilesQuery = query(
        collection(database, COLLECTIONS.PROFILES),
        where('role', '==', 'admin')
    )
    const snapshot = await getDocs(profilesQuery)

    return snapshot.docs
        .map(doc => doc.data().email)
        .filter((email): email is string => typeof email === 'string' && email.length > 0)
}

// ==================== DISPLAY STATE (Remote Control) ====================

export interface DisplayState {
    spotifyUri: string
    isMuted: boolean
    isPlaying: boolean
    volume: number
    /** Instant command sent from remote ('next' | 'prev' | 'forward'). Display clears after executing. */
    command: string | null
    /** Timestamp of the last command – display reacts when this changes. */
    commandTs: number
    updatedAt: Date
}

const DEFAULT_DISPLAY_STATE: DisplayState = {
    spotifyUri: 'spotify:playlist:37i9dQZF1DWWQRwui0ExPn', // Default lofi beats
    isMuted: false,
    isPlaying: true,
    volume: 100,
    command: null,
    commandTs: 0,
    updatedAt: new Date()
}

/**
 * Get current display state
 */
export async function getDisplayState(displayId: string): Promise<DisplayState> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.DISPLAY_STATE, displayId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
        const data = docSnap.data()
        return {
            spotifyUri: data.spotifyUri || DEFAULT_DISPLAY_STATE.spotifyUri,
            isMuted: data.isMuted ?? DEFAULT_DISPLAY_STATE.isMuted,
            isPlaying: data.isPlaying ?? DEFAULT_DISPLAY_STATE.isPlaying,
            volume: data.volume ?? DEFAULT_DISPLAY_STATE.volume,
            command: data.command ?? null,
            commandTs: data.commandTs ?? 0,
            updatedAt: data.updatedAt?.toDate() || new Date()
        }
    }
    
    return DEFAULT_DISPLAY_STATE
}

/**
 * Update display state (from remote control)
 */
export async function updateDisplayState(
    displayId: string, 
    updates: Partial<Omit<DisplayState, 'updatedAt'>>
): Promise<void> {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.DISPLAY_STATE, displayId)
    
    await setDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
    }, { merge: true })
}

/**
 * Subscribe to display state changes in real-time
 */
export function subscribeToDisplayState(
    displayId: string,
    callback: (state: DisplayState) => void
): () => void {
    const database = ensureDb()
    const docRef = doc(database, COLLECTIONS.DISPLAY_STATE, displayId)
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data()
            callback({
                spotifyUri: data.spotifyUri || DEFAULT_DISPLAY_STATE.spotifyUri,
                isMuted: data.isMuted ?? DEFAULT_DISPLAY_STATE.isMuted,
                isPlaying: data.isPlaying ?? DEFAULT_DISPLAY_STATE.isPlaying,
                volume: data.volume ?? DEFAULT_DISPLAY_STATE.volume,
                command: data.command ?? null,
                commandTs: data.commandTs ?? 0,
                updatedAt: data.updatedAt?.toDate() || new Date()
            })
        } else {
            callback(DEFAULT_DISPLAY_STATE)
        }
    })
    
    return unsubscribe
}
