'use client'

import { Suspense, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

function LoadingFallback() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-zinc-300" />
                <p className="text-sm text-zinc-300">Loading TV admin login...</p>
            </div>
        </main>
    )
}

function TvAdminLoginContent() {
    const searchParams = useSearchParams()
    const sessionId = useMemo(() => searchParams.get('session')?.trim() || '', [searchParams])

    const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
    const [approving, setApproving] = useState(false)
    const [approved, setApproved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleApprove = async () => {
        if (!user || !sessionId) return

        setApproving(true)
        setError(null)
        try {
            const idToken = await user.getIdToken()
            const response = await fetch('/api/tv/setup-session/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ session_id: sessionId }),
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            setApproved(true)
        } catch (approveError) {
            console.error('Failed to approve TV setup session:', approveError)
            setError('Unable to approve this TV session. Please try again.')
        } finally {
            setApproving(false)
        }
    }

    if (!sessionId) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-300" />
                    <h1 className="text-2xl font-semibold">Invalid TV Link</h1>
                    <p className="mt-3 text-sm text-zinc-300">
                        This QR code does not contain a valid TV session.
                    </p>
                </div>
            </main>
        )
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
                    <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-zinc-300" />
                    <p className="text-sm text-zinc-300">Loading account...</p>
                </div>
            </main>
        )
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
                    <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
                    <h1 className="text-2xl font-semibold">Admin Login Required</h1>
                    <p className="mt-3 text-sm text-zinc-300">
                        Sign in with your admin Google account to approve this TV.
                    </p>
                    <Button className="mt-5" onClick={() => void signInWithGoogle()}>
                        Continue with Google
                    </Button>
                </div>
            </main>
        )
    }

    if (!profile) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
                    <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-zinc-300" />
                    <p className="text-sm text-zinc-300">Checking admin permissions...</p>
                </div>
            </main>
        )
    }

    if (profile && profile.role !== 'admin') {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-300" />
                    <h1 className="text-2xl font-semibold">Access Denied</h1>
                    <p className="mt-3 text-sm text-zinc-300">
                        This account is not an admin account.
                    </p>
                    <Button variant="outline" className="mt-5" onClick={() => void signOut()}>
                        Sign Out
                    </Button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center">
                {approved ? (
                    <>
                        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
                        <h1 className="text-2xl font-semibold">TV Approved</h1>
                        <p className="mt-3 text-sm text-zinc-300">
                            The TV can now continue to Spotify login and then open display2.
                        </p>
                    </>
                ) : (
                    <>
                        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
                        <h1 className="text-2xl font-semibold">Approve TV Session</h1>
                        <p className="mt-3 text-sm text-zinc-300">
                            Account: <span className="font-medium text-white">{user.email}</span>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">Session: {sessionId}</p>

                        {error && (
                            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                {error}
                            </p>
                        )}

                        <Button className="mt-5" onClick={() => void handleApprove()} disabled={approving}>
                            {approving ? 'Approving...' : 'Approve This TV'}
                        </Button>
                    </>
                )}
            </div>
        </main>
    )
}

export default function TvAdminLoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TvAdminLoginContent />
        </Suspense>
    )
}
