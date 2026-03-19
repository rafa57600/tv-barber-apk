'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home,
    Calendar,
    Users,
    Scissors,
    Clock,
    LogOut,
    Menu,
    X,
    Loader2,
    ShieldAlert,
    Plus,
    Bell,
    User,
    Settings,
    Tv,
    Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/theme-toggle'

// Instagram-style bottom nav items (5 icons max)
const navItems = [
    { href: '/admin/dashboard', label: 'Accueil', icon: Home },
    { href: '/admin/appointments', label: 'RDV', icon: Calendar },
    { href: '/admin/users', label: 'Clients', icon: Users },
    { href: '/admin/barbers', label: 'Équipe', icon: Scissors },
    { href: '/admin/schedule', label: 'Horaires', icon: Clock },
]

// Full menu items for slide-out menu
const menuItems = [
    { href: '/admin/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/admin/appointments', label: 'Rendez-vous', icon: Calendar },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/barbers', label: 'Barbiers', icon: Scissors },
    { href: '/admin/services', label: 'Services', icon: Scissors },
    { href: '/admin/schedule', label: 'Horaires', icon: Clock },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
    { href: '/admin/remote', label: 'Télécommande', icon: Smartphone },
    { href: '/admin/display2', label: 'Écran TV', icon: Tv },
]

// Instagram-style Bottom Navigation
function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom">
            <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex-1 flex items-center justify-center py-2 active:opacity-60 transition-opacity"
                        >
                            <Icon
                                className={cn(
                                    "w-6 h-6 transition-all",
                                    isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

// Instagram-style Header
function Header({ onMenuOpen }: { onMenuOpen: () => void }) {
    return (
        <header className="sticky top-0 z-40 bg-background border-b safe-area-top">
            <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">Barber<span className="text-primary">SHOP</span></span>
                </Link>

                {/* Right Icons */}
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={onMenuOpen}
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </header>
    )
}

// Instagram-style Slide Menu
function SlideMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname()
    const { user, profile, signOut } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60"
                        onClick={onClose}
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[280px] z-50 bg-background safe-area-y"
                    >
                        {/* Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <span className="text-lg font-semibold">Menu</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* User Profile */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">
                                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">
                                        {profile?.full_name || 'Admin'}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 py-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 transition-colors",
                                            isActive
                                                ? "bg-accent text-foreground"
                                                : "text-muted-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t p-4 space-y-2">
                            <Link
                                href="/"
                                onClick={onClose}
                                className="flex items-center gap-4 px-4 py-3 text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                <span className="font-medium">Retour au site</span>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-4 px-4 py-3 w-full text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Déconnexion</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Loading Screen
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Chargement...</p>
            </div>
        </div>
    )
}

// Login Required
function LoginRequired() {
    const { signInWithGoogle, isConfigured } = useAuth()

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center shadow-gold mx-auto mb-4">
                        <Scissors className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Barber<span className="text-primary">SHOP</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Administration</p>
                </div>

                {/* Login Card */}
                <div className="space-y-4">
                    {isConfigured ? (
                        <Button
                            className="w-full h-12 text-base gradient-gold text-white shadow-gold"
                            onClick={() => signInWithGoogle()}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continuer avec Google
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Firebase non configuré
                        </p>
                    )}

                    <Link
                        href="/"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Not Admin
function NotAdmin() {
    const { signOut } = useAuth()
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    Vous n'avez pas les droits administrateur
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => router.push('/')}
                    >
                        Accueil
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1 h-12"
                        onClick={() => signOut()}
                    >
                        Déconnexion
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, profile, loading } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()

    // Check if this is a TV display page (should be full-screen without navigation)
    const isDisplayPage = pathname?.startsWith('/admin/display')

    if (loading) {
        return <LoadingScreen />
    }

    if (!user) {
        return <LoginRequired />
    }

    const isAdmin = profile?.role === 'admin'
    if (profile && !isAdmin) {
        return <NotAdmin />
    }

    // For display pages: render full-screen without any navigation
    if (isDisplayPage) {
        return (
            <div className="min-h-screen bg-black">
                {children}
            </div>
        )
    }

    // Normal admin pages with navigation
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header onMenuOpen={() => setMenuOpen(true)} />

            {/* Slide Menu */}
            <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            {/* Main Content */}
            <main className="pb-20 max-w-lg mx-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
