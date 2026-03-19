'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Detects if the user is in an embedded browser (WebView)
 * like Instagram, Facebook, TikTok, etc.
 */
function isWebView(): boolean {
    if (typeof window === 'undefined') return false
    
    const userAgent = navigator.userAgent || navigator.vendor || ''
    
    // Common WebView indicators
    const webViewPatterns = [
        /Instagram/i,
        /FBAN|FBAV/i, // Facebook
        /Twitter/i,
        /TikTok/i,
        /LinkedIn/i,
        /Snapchat/i,
        /Pinterest/i,
        /wv\)/i, // Android WebView
        /\bwv\b/i,
        /WebView/i,
    ]
    
    return webViewPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Gets the current URL for opening in external browser
 */
function getCurrentUrl(): string {
    if (typeof window === 'undefined') return ''
    return window.location.href
}

/**
 * Attempts to open the current page in an external browser
 */
function openInExternalBrowser() {
    const url = getCurrentUrl()
    
    // Try different methods to open in external browser
    // Method 1: intent:// for Android
    const androidIntent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    
    // Detect platform
    const isAndroid = /android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    if (isAndroid) {
        window.location.href = androidIntent
    } else if (isIOS) {
        // For iOS, we'll just copy URL and show instructions
        navigator.clipboard?.writeText(url)
        alert('URL copiée! Ouvrez Safari et collez l\'URL.')
    } else {
        // Fallback: just open in new window
        window.open(url, '_blank')
    }
}

interface WebViewGuardProps {
    children: React.ReactNode
}

export function WebViewGuard({ children }: WebViewGuardProps) {
    const [inWebView, setInWebView] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [attempted, setAttempted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
        const isInWebView = isWebView()
        setInWebView(isInWebView)
        
        // Auto-attempt redirect on Android
        if (isInWebView && !attempted) {
            setAttempted(true)
            const isAndroid = /android/i.test(navigator.userAgent)
            
            if (isAndroid) {
                // Try to open in Chrome automatically
                const url = window.location.href
                const androidIntent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
                
                // Small delay to let page render first
                setTimeout(() => {
                    window.location.href = androidIntent
                }, 500)
            }
        }
    }, [attempted])
    
    // Don't render anything during SSR
    if (!mounted) return <>{children}</>
    
    // If not in WebView, show children
    if (!inWebView) return <>{children}</>
    
    // Show WebView warning
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                
                <h1 className="text-xl font-bold">
                    Ouvrez dans votre navigateur
                </h1>
                
                <p className="text-muted-foreground text-sm">
                    Pour vous connecter avec Google, veuillez ouvrir cette page dans Safari ou Chrome.
                    Les navigateurs intégrés (Instagram, Facebook, etc.) ne permettent pas la connexion Google.
                </p>
                
                <div className="pt-2">
                    <Button 
                        onClick={openInExternalBrowser}
                        className="w-full gap-2"
                        size="lg"
                    >
                        <ExternalLink className="w-5 h-5" />
                        Ouvrir dans le navigateur
                    </Button>
                </div>
                
                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        <strong>Astuce iOS:</strong> Appuyez sur ⋯ puis &quot;Ouvrir dans Safari&quot;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        <strong>Astuce Android:</strong> Appuyez sur ⋮ puis &quot;Ouvrir dans Chrome&quot;
                    </p>
                </div>
            </div>
        </div>
    )
}

