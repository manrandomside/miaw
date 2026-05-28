import { NextRequest, NextResponse } from "next/server"

const ESP32_BASE_URL = process.env.ESP32_BASE_URL || "http://192.168.254.156"

/**
 * Proxy for ESP32 action endpoints (lamp control, state sync, etc.)
 * This allows the hosting deployment to reach the ESP32 through the server.
 * 
 * Usage: POST /api/esp32?endpoint=/bedroom&method=POST
 *        POST /api/esp32?endpoint=/state  (with body)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")
    const method = searchParams.get("method") || "POST"

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing 'endpoint' query parameter" },
        { status: 400 }
      )
    }

    // Whitelist valid endpoints for security
    const validEndpoints = [
      "/bedroom", "/kitchen", "/bathroom", "/all", "/auto",
      "/state", "/dash", "/telemetry"
    ]
    if (!validEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { error: `Invalid endpoint: ${endpoint}` },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Forward the request body if present
    let body: string | undefined
    try {
      body = await request.text()
    } catch {
      body = undefined
    }

    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      cache: "no-store",
    }
    if (body && method.toUpperCase() === "POST") {
      fetchOptions.body = body
    }

    const res = await fetch(`${ESP32_BASE_URL}${endpoint}`, fetchOptions)
    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json(
        { error: `ESP32 returned ${res.status}` },
        { status: 502 }
      )
    }

    // Try to return JSON, fallback to text
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("json")) {
      const data = await res.json()
      return NextResponse.json(data)
    } else {
      const text = await res.text()
      return NextResponse.json({ ok: true, body: text })
    }
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError"
    return NextResponse.json(
      { error: isTimeout ? "ESP32 timeout" : `ESP32 unreachable: ${err?.message}` },
      { status: 503 }
    )
  }
}
