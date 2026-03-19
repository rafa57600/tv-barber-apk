'use client'

import { useEffect, useState } from 'react'
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, CloudDrizzle, Loader2 } from 'lucide-react'

// WMO Weather interpretation codes (Open-Meteo)
const getWeatherDetails = (weatherCode: number) => {
    switch (true) {
        case weatherCode === 0:
            return { icon: Sun, label: 'Ciel dégagé' }
        case [1, 2, 3].includes(weatherCode):
            return { icon: Cloud, label: 'Nuageux' }
        case [45, 48].includes(weatherCode):
            return { icon: CloudFog, label: 'Brouillard' }
        case [51, 53, 55, 56, 57].includes(weatherCode):
            return { icon: CloudDrizzle, label: 'Bruine' }
        case [61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode):
            return { icon: CloudRain, label: 'Pluie' }
        case [71, 73, 75, 77, 85, 86].includes(weatherCode):
            return { icon: Snowflake, label: 'Neige' }
        case [95, 96, 99].includes(weatherCode):
            return { icon: CloudLightning, label: 'Orage' }
        default:
            return { icon: Cloud, label: 'Inconnu' }
    }
}

interface WeatherData {
    temp: number
    weatherCode: number
    city: string
}

export function WeatherWidget() {
    const [data, setData] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let mounted = true

        const fetchWeather = async () => {
            try {
                // 1. Get Automatic Location silently via IP (No TV permissions required)
                const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json')
                if (!geoRes.ok) throw new Error('Geo failed')
                const geoData = await geoRes.json()
                const { latitude, longitude, city } = geoData

                // 2. Fetch precise Weather from Open-Meteo
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
                )
                if (!weatherRes.ok) throw new Error('Weather failed')
                const weatherData = await weatherRes.json()

                if (mounted) {
                    setData({
                        temp: Math.round(weatherData.current.temperature_2m),
                        weatherCode: weatherData.current.weather_code,
                        city: city || 'Salon'
                    })
                    setError(false)
                }
            } catch (err) {
                console.error('Weather widget error:', err)
                if (mounted) setError(true)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        void fetchWeather()

        // Refresh every 30 minutes
        const intervalId = setInterval(fetchWeather, 30 * 60 * 1000)
        return () => {
            mounted = false
            clearInterval(intervalId)
        }
    }, [])

    if (error) {
        return (
            <div className="flex h-10 items-center justify-center rounded-2xl bg-black/50 px-4 backdrop-blur-md">
                <span className="text-xs text-white/50">Météo indisp.</span>
            </div>
        )
    }

    if (loading || !data) {
        return (
            <div className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/5 bg-black/40 px-5 backdrop-blur-md">
                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
            </div>
        )
    }

    const { icon: WeatherIcon, label } = getWeatherDetails(data.weatherCode)

    return (
        <div className="flex h-10 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-5 backdrop-blur-md transition-all">
            <div className="flex items-center gap-2">
                <WeatherIcon className="h-[18px] w-[18px] text-green-400" strokeWidth={2.5} />
                <span className="text-sm font-bold tracking-tight text-white">{data.temp}°</span>
            </div>
            
            {/* Extremely subtle vertical divider */}
            <div className="h-4 w-px bg-white/15" />
            
            <span className="max-w-[100px] truncate text-xs font-medium text-white/70" title={label}>
                {data.city}
            </span>
        </div>
    )
}
