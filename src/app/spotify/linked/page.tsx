'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'access_denied':
      return 'Spotify login was cancelled on mobile. Please retry and approve.'
    case 'invalid_client':
      return 'Spotify server credentials are invalid. Check SPOTIFY_CLIENT_ID/SECRET on the server.'
    case 'invalid_grant':
      return 'Spotify authorization code expired or was already used. Retry QR login.'
    case 'redirect_uri_mismatch':
      return 'Spotify redirect URI mismatch. Verify SPOTIFY_REDIRECT_URI in Spotify Dashboard.'
    case 'missing_refresh_token':
      return 'Spotify did not return a refresh token. Retry login and fully approve consent.'
    case 'missing_code':
      return 'Spotify callback did not include an authorization code.'
    case 'token_exchange_failed':
      return 'Server could not exchange Spotify code for tokens.'
    default:
      return 'Spotify login failed. Retry from TV QR code.'
  }
}

function SpotifyLinkedContent() {
  const searchParams = useSearchParams()
  const spotifyStatus = searchParams.get('spotify')
  const reason = searchParams.get('reason') || ''

  const isError = spotifyStatus === 'error'

  const title = isError ? 'Spotify login failed' : 'Spotify connected'
  const message = useMemo(() => {
    if (!isError) {
      return 'Salon Spotify account is now linked. Return to the TV, it should continue automatically.'
    }
    return mapReasonToMessage(reason)
  }, [isError, reason])

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
      <div
        className={`w-full max-w-lg rounded-3xl border p-8 text-center ${
          isError
            ? 'border-rose-500/35 bg-rose-500/10'
            : 'border-emerald-500/35 bg-emerald-500/10'
        }`}
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
            isError ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'
          }`}
        >
          {isError ? '!' : 'OK'}
        </div>

        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-zinc-200">{message}</p>

        {isError && (
          <p className="mt-4 text-xs text-zinc-400">
            Reason code: <span className="font-mono">{reason || 'unknown'}</span>
          </p>
        )}
      </div>
    </main>
  )
}

export default function SpotifyLinkedPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">Loading...</main>}>
      <SpotifyLinkedContent />
    </Suspense>
  )
}
