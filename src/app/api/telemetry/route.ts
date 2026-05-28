import { NextResponse } from "next/server"

const ESP32_BASE_URL = process.env.ESP32_BASE_URL || "http://192.168.254.156"

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const res = await fetch(`${ESP32_BASE_URL}/telemetry`, {
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json(
        { error: "ESP32 returned non-OK status", status: res.status },
        { status: 502 }
      )
    }

    const data = await res.json()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (err: any) {
    // Differentiate between timeout and connection errors
    const isTimeout = err?.name === "AbortError"
    const message = isTimeout
      ? "ESP32 request timed out (5s)"
      : `ESP32 unreachable: ${err?.message || "unknown error"}`

    return NextResponse.json(
      { error: message, offline: true },
      { status: 503 }
    )
  }
}
