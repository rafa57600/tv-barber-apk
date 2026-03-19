'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, FastForward, Link2, MicOff, Music, RefreshCw, SkipBack, SkipForward, Smartphone, Tv, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'

import { extractSpotifyUri } from '@/components/display/SpotifyPlayer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { subscribeToDisplayState, updateDisplayState, type DisplayState } from '@/lib/firebase/firestore'

type DisplayId = 'display1' | 'display2' | 'display3'
type RemoteCommand = 'next' | 'prev' | 'forward'

const DISPLAYS: Array<{ id: DisplayId; name: string }> = [
  { id: 'display1', name: 'Ecran 1' },
  { id: 'display2', name: 'Ecran 2' },
  { id: 'display3', name: 'Ecran 3' },
]

function getSpotifyId(uri: string): string {
  const parts = uri.split(':')
  return parts[parts.length - 1] || uri
}

export default function RemotePage() {
  const [selectedDisplay, setSelectedDisplay] = useState<DisplayId>('display2')
  const [state, setState] = useState<DisplayState | null>(null)
  const [spotifyInput, setSpotifyInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToDisplayState(selectedDisplay, (newState) => {
      setState(newState)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [selectedDisplay])

  const updateDisplay = useCallback(async (updates: Partial<Omit<DisplayState, 'updatedAt'>>) => {
    setUpdating(true)
    try {
      await updateDisplayState(selectedDisplay, updates)
    } catch (error) {
      console.error('Remote update error:', error)
      toast.error('Erreur de mise a jour')
    } finally {
      setUpdating(false)
    }
  }, [selectedDisplay])

  const handleChangeTrack = useCallback(async () => {
    const uri = extractSpotifyUri(spotifyInput)
    if (!uri) {
      toast.error('Lien Spotify invalide')
      return
    }

    await updateDisplay({ spotifyUri: uri })
    setSpotifyInput('')
    toast.success('Track / playlist mise a jour')
  }, [spotifyInput, updateDisplay])

  const handleCommand = useCallback(async (command: RemoteCommand) => {
    await updateDisplay({ command, commandTs: Date.now() })
  }, [updateDisplay])

  const toggleMute = useCallback(async () => {
    if (!state) return
    await updateDisplay({ isMuted: !state.isMuted })
  }, [state, updateDisplay])

  return (
    <div className="space-y-4 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Smartphone className="h-5 w-5 text-primary" />
            Telecommande
          </h1>
          <p className="text-sm text-muted-foreground">Changer display, track, mute, next, previous, forward</p>
        </div>
        {loading && <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex gap-2">
        {DISPLAYS.map((display) => (
          <Button
            key={display.id}
            variant={selectedDisplay === display.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDisplay(display.id)}
            className="flex-1"
          >
            <Tv className="mr-1 h-4 w-4" />
            {display.name}
          </Button>
        ))}
      </div>

      {state && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-3.5 w-3.5 text-green-500" />
            <span>URI active:</span>
          </div>
          <p className="truncate font-mono text-sm text-white">{state.spotifyUri}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">ID: {getSpotifyId(state.spotifyUri)}</p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Button
              onClick={() => handleCommand('prev')}
              disabled={updating || !state}
              className="h-16 rounded-xl bg-zinc-700 hover:bg-zinc-600"
            >
              <div className="flex flex-col items-center gap-1">
                <SkipBack className="h-5 w-5" />
                <span className="text-xs">Prev</span>
              </div>
            </Button>

            <Button
              onClick={() => handleCommand('next')}
              disabled={updating || !state}
              className="h-16 rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              <div className="flex flex-col items-center gap-1">
                <SkipForward className="h-5 w-5" />
                <span className="text-xs">Next</span>
              </div>
            </Button>

            <Button
              onClick={() => handleCommand('forward')}
              disabled={updating || !state}
              className="h-16 rounded-xl bg-indigo-600 hover:bg-indigo-500"
            >
              <div className="flex flex-col items-center gap-1">
                <FastForward className="h-5 w-5" />
                <span className="text-xs">+15s</span>
              </div>
            </Button>

            <Button
              onClick={toggleMute}
              disabled={updating || !state}
              className={cn(
                'h-16 rounded-xl',
                state.isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
              )}
            >
              <div className="flex flex-col items-center gap-1">
                {state.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="text-xs">{state.isMuted ? 'Unmute' : 'Mute'}</span>
              </div>
            </Button>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl border bg-card p-4">
        <Label className="mb-3 block text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Changer track / playlist
          </span>
        </Label>

        <div className="flex gap-2">
          <Input
            placeholder="Coller un lien Spotify ou URI"
            value={spotifyInput}
            onChange={(e) => setSpotifyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChangeTrack()}
          />
          <Button onClick={handleChangeTrack} disabled={updating || !spotifyInput} className="shrink-0">
            {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Supporte: lien Spotify (track/playlist/album) ou URI `spotify:...`
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <MicOff className="h-3.5 w-3.5" />
          Note
        </div>
        <p>Si Spotify n&apos;est pas connecte, ouvre ` /api/spotify/auth ` une fois pour autoriser le compte.</p>
      </div>
    </div>
  )
}
