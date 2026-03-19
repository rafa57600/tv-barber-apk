'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="rounded-full">
                <Sun className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-card/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-primary transition-all" />
            ) : (
                <Moon className="h-5 w-5 text-primary transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
