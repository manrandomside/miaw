import { useState, useEffect } from "react"

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

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("http://192.168.254.156/telemetry")
        if (!res.ok) throw new Error("Failed to fetch telemetry")
        
        const json = (await res.json()) as TelemetryData
        setData(json)
        setIsError(false)
      } catch (err) {
        setIsError(true)
      }
    }

    // Fetch immediately on mount
    fetchTelemetry()

    // Poll every 3000ms
    const interval = setInterval(fetchTelemetry, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  return { data, isError }
}
