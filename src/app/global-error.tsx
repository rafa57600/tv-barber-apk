'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error caught:', error)
  }, [error])

  return (
    <html>
      <body className="bg-zinc-950 text-white flex items-center justify-center min-h-screen p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">
              We encountered a critical error. Our team has been notified and we are working to fix it.
            </p>
          </div>

          {error.digest && (
            <code className="block p-3 bg-black/50 rounded-xl text-[10px] text-zinc-500 font-mono break-all">
              Error ID: {error.digest}
            </code>
          )}

          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 px-6 rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
