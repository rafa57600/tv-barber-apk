'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-destructive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Erreur d'authentification</h1>
                <p className="text-muted-foreground mb-6">
                    Une erreur est survenue lors de la connexion. Veuillez réessayer.
                </p>
                <Button asChild>
                    <Link href="/">Retour à l'accueil</Link>
                </Button>
            </div>
        </div>
    )
}
