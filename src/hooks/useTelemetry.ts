import { useState, useEffect, useRef } from "react"

export interface TelemetryData {
  temperature: number
  humidity: number
  ldr: number
  lamps: {
    lamp1: boolean
    lamp2: boolean
    lamp3: boolean
  }
}

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData | null>(null)
  const [isError, setIsError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const consecutiveErrorsRef = useRef(0)

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // Use our server-side proxy API instead of direct ESP32 fetch.
        // This way it works both on localhost AND when deployed to hosting,
        // since the Next.js server (not the browser) reaches the ESP32.
        const res = await fetch("/api/telemetry", { cache: "no-store" })

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}))
          setIsOffline(!!errorBody?.offline)
          throw new Error(errorBody?.error || `HTTP ${res.status}`)
        }

        const json = (await res.json()) as TelemetryData

        // Validate that we got real sensor data (not NaN or undefined)
        if (
          typeof json.temperature !== "number" ||
          typeof json.humidity !== "number" ||
          typeof json.ldr !== "number" ||
          isNaN(json.temperature) ||
          isNaN(json.humidity) ||
          isNaN(json.ldr)
        ) {
          throw new Error("Invalid sensor data received from ESP32")
        }

        setData(json)
        setIsError(false)
        setIsOffline(false)
        consecutiveErrorsRef.current = 0
      } catch (err) {
        consecutiveErrorsRef.current += 1
        setIsError(true)

        // Only null out data after 3 consecutive failures
        // to prevent flickering on transient network issues
        if (consecutiveErrorsRef.current >= 3) {
          setData(null)
        }

        if (consecutiveErrorsRef.current <= 3) {
          console.warn(
            `[useTelemetry] Fetch failed (attempt ${consecutiveErrorsRef.current}):`,
            err instanceof Error ? err.message : err
          )
        }
      }
    }

    // Fetch immediately on mount
    fetchTelemetry()

    // Poll every 3000ms
    const interval = setInterval(fetchTelemetry, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  return { data, isError, isOffline }
}
