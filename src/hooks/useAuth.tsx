'use client'

import { useState, createContext, useContext, useEffect } from 'react'
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase/config'
import { getProfile, createProfile } from '@/lib/firebase/firestore'
import type { Profile } from '@/types/database.types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    isConfigured: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isConfigured, setIsConfigured] = useState(false)

    async function loadProfile(user: User) {
        try {
            let userProfile = await getProfile(user.uid)

            if (!userProfile) {
                // Create profile for new users
                await createProfile(user.uid, {
                    email: user.email || '',
                    full_name: user.displayName || '',
                    avatar_url: user.photoURL || '',
                    role: 'client' // Default role, manually set 'admin' in Firebase for admin users
                })
                userProfile = await getProfile(user.uid)
            }

            setProfile(userProfile)
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    useEffect(() => {
        const configured = !!isFirebaseConfigured()

        setIsConfigured(configured)

        if (!configured || !auth) {
            console.warn('Firebase not configured. Running in demo mode.')
            setLoading(false)
            return
        }

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                await loadProfile(firebaseUser)
            } else {
                setProfile(null)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    async function signInWithGoogle() {
        if (!isConfigured || !auth) {
            console.warn('Cannot sign in: Firebase not configured')
            return
        }

        try {
            const provider = new GoogleAuthProvider()
            provider.setCustomParameters({
                prompt: 'select_account'
            })
            await signInWithPopup(auth, provider)
        } catch (error) {
            console.error('Error signing in with Google:', error)
            throw error
        }
    }

    async function signOut() {
        if (!isConfigured || !auth) {
            return
        }

        try {
            await firebaseSignOut(auth)
            setUser(null)
            setProfile(null)
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isConfigured,
            signInWithGoogle,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
