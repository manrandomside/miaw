import { NextResponse } from "next/server"

const ESP32_BASE_URL = process.env.ESP32_BASE_URL || "http://192.168.254.156"

export async function GET() {
  try {
    const res = await fetch(`${ESP32_BASE_URL}/telemetry`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `ESP32 returned ${res.status}`, offline: true },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "ESP32 unreachable", offline: true },
      { status: 503 }
    )
  }
}
