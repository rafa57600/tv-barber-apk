export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    role: 'client' | 'admin' | 'barber'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'client' | 'admin' | 'barber'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'client' | 'admin' | 'barber'
                    created_at?: string
                    updated_at?: string
                }
            }
            barbers: {
                Row: {
                    id: string
                    profile_id: string | null
                    name: string
                    specialties: string[] | null
                    avatar_url: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id?: string | null
                    name: string
                    specialties?: string[] | null
                    avatar_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string | null
                    name?: string
                    specialties?: string[] | null
                    avatar_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            services: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    duration_minutes: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    duration_minutes?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    duration_minutes?: number
                    is_active?: boolean
                    created_at?: string
                }
            }
            barber_availability: {
                Row: {
                    id: string
                    barber_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    is_available: boolean
                }
                Insert: {
                    id?: string
                    barber_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    is_available?: boolean
                }
                Update: {
                    id?: string
                    barber_id?: string
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                    is_available?: boolean
                }
            }
            appointments: {
                Row: {
                    id: string
                    client_id: string | null
                    barber_id: string | null
                    service_id: string | null
                    date: string
                    start_time: string
                    end_time: string
                    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    client_id?: string | null
                    barber_id?: string | null
                    service_id?: string | null
                    date: string
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string | null
                    barber_id?: string | null
                    service_id?: string | null
                    date?: string
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shop_closures: {
                Row: {
                    id: string
                    date: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    date: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    reason?: string | null
                    created_at?: string
                }
            }
        }
    }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Barber = Database['public']['Tables']['barbers']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type BarberAvailability = Database['public']['Tables']['barber_availability']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type ShopClosure = Database['public']['Tables']['shop_closures']['Row']

// Extended types with relations
export type AppointmentWithDetails = Appointment & {
    barber?: Barber
    service?: Service
    client?: Profile
}
