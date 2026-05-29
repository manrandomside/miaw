import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { isLocalMode } from "@/lib/connectionMode"

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

interface TelemetryRow {
  temperature: number
  humidity: number
  ldr: number
  lamp1: boolean
  lamp2: boolean
  lamp3: boolean
}

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData | null>(null)
  const [isError, setIsError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const consecutiveErrorsRef = useRef(0)

  useEffect(() => {
    const local = isLocalMode()

    // =============================================
    // MODE LOCAL: Polling langsung ke ESP32 (INSTAN)
    // =============================================
    if (local) {
      const fetchLocal = async () => {
        try {
          const res = await fetch("/api/telemetry", { cache: "no-store" })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            setIsOffline(!!body?.offline)
            throw new Error(body?.error || `HTTP ${res.status}`)
          }
          const json = await res.json() as TelemetryData
          if (typeof json.temperature !== "number" || isNaN(json.temperature)) {
            throw new Error("Invalid sensor data")
          }
          setData(json)
          setIsError(false)
          setIsOffline(false)
          consecutiveErrorsRef.current = 0
        } catch {
          consecutiveErrorsRef.current += 1
          setIsError(true)
          if (consecutiveErrorsRef.current >= 3) setData(null)
        }
      }

      fetchLocal()
      const interval = setInterval(fetchLocal, 2000) // Poll setiap 2 detik (cepat!)
      return () => clearInterval(interval)
    }

    // =============================================
    // MODE CLOUD: Supabase Realtime + Polling Fallback
    // =============================================
    const mapRow = (row: TelemetryRow): TelemetryData => ({
      temperature: row.temperature,
      humidity: row.humidity,
      ldr: row.ldr,
      lamps: {
        lamp1: row.lamp1,
        lamp2: row.lamp2,
        lamp3: row.lamp3,
      }
    })

    const fetchCloud = async () => {
      try {
        const { data: row, error } = await supabase
          .from("miaw_telemetry")
          .select("*")
          .eq("id", 1)
          .single()
        if (error) throw error
        if (row) {
          setData(mapRow(row))
          setIsError(false)
          setIsOffline(false)
        }
      } catch (err) {
        console.error("[useTelemetry] Cloud fetch failed:", err)
        setIsError(true)
        setIsOffline(true)
      }
    }

    fetchCloud()

    // Supabase Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'miaw_telemetry',
          filter: 'id=eq.1'
        },
        (payload) => {
          setData(mapRow(payload.new as TelemetryRow))
          setIsError(false)
          setIsOffline(false)
        }
      )
      .subscribe()

    // Fallback polling setiap 3 detik
    const interval = setInterval(fetchCloud, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  return { data, isError, isOffline }
}
