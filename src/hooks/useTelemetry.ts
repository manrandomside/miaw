import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { isLocalMode } from "@/lib/connectionMode"

// Ambang batas kebaruan data: perangkat dianggap offline bila baris telemetri
// terakhir di-update lebih dari 30 detik lalu (ESP32 update tiap ~10 detik).
const AMBANG = 30000
const TICK = 5000

export interface TelemetryData {
  temperature: number
  humidity: number
  ldr: number
  lamps: {
    lamp1: boolean
    lamp2: boolean
    lamp3: boolean
  }
  state?: string
}

interface TelemetryRow {
  temperature: number
  humidity: number
  ldr: number
  lamp1: boolean
  lamp2: boolean
  lamp3: boolean
  updated_at?: string
  state?: string
}

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData | null>(null)
  const [isError, setIsError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<number | null>(null)
  const consecutiveErrorsRef = useRef(0)
  const lastSeenRef = useRef<number | null>(null)

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
          // Online diturunkan dari hasil fetch yang sukses (deteksi offline existing)
          setIsOnline(true)
          const now = Date.now()
          lastSeenRef.current = now
          setLastSeen(now)
          consecutiveErrorsRef.current = 0
        } catch {
          consecutiveErrorsRef.current += 1
          setIsError(true)
          setIsOnline(false)
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
      },
      state: row.state
    })

    // Hitung ulang status online berdasarkan kebaruan updated_at.
    // Dipanggil saat data baru masuk maupun lewat tick periodik supaya bisa
    // berubah jadi offline walau tidak ada data baru.
    const evaluateOnline = () => {
      const seen = lastSeenRef.current
      setIsOnline(seen !== null && Date.now() - seen < AMBANG)
    }

    const trackUpdatedAt = (row: TelemetryRow) => {
      if (row.updated_at) {
        const ts = new Date(row.updated_at).getTime()
        if (!isNaN(ts)) {
          lastSeenRef.current = ts
          setLastSeen(ts)
        }
      }
    }

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
          trackUpdatedAt(row)
          evaluateOnline()
        }
      } catch (err) {
        console.error("[useTelemetry] Cloud fetch failed:", err)
        setIsError(true)
        setIsOffline(true)
        setIsOnline(false)
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
          const row = payload.new as TelemetryRow
          setData(mapRow(row))
          setIsError(false)
          setIsOffline(false)
          trackUpdatedAt(row)
          evaluateOnline()
        }
      )
      .subscribe()

    // Fallback polling setiap 3 detik
    const interval = setInterval(fetchCloud, 3000)
    // Tick liveness: re-evaluasi online walau tak ada data baru masuk
    const livenessTick = setInterval(evaluateOnline, TICK)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      clearInterval(livenessTick)
    }
  }, [])

  return { data, isError, isOffline, isOnline, lastSeen }
}
