import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

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

  useEffect(() => {
    // 1. Fetch initial data
    const fetchInitialData = async () => {
      try {
        const { data: row, error } = await supabase
          .from("miaw_telemetry")
          .select("*")
          .eq("id", 1)
          .single()

        if (error) throw error

        if (row) {
          setData({
            temperature: row.temperature,
            humidity: row.humidity,
            ldr: row.ldr,
            lamps: {
              lamp1: row.lamp1,
              lamp2: row.lamp2,
              lamp3: row.lamp3,
            }
          })
          setIsError(false)
          setIsOffline(false)
        }
      } catch (err) {
        console.error("[useTelemetry] Failed to fetch initial data:", err)
        setIsError(true)
        setIsOffline(true)
      }
    }

    fetchInitialData()

    // 2. Subscribe to realtime changes
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
          const row = payload.new as any
          setData({
            temperature: row.temperature,
            humidity: row.humidity,
            ldr: row.ldr,
            lamps: {
              lamp1: row.lamp1,
              lamp2: row.lamp2,
              lamp3: row.lamp3,
            }
          })
          setIsError(false)
          setIsOffline(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, isError, isOffline }
}
