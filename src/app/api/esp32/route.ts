import { NextRequest, NextResponse } from "next/server"

const ESP32_BASE_URL = process.env.ESP32_BASE_URL || "http://192.168.254.156"

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get("endpoint") || "/"
  const method = searchParams.get("method") || "POST"

  try {
    const body = await req.text()
    const res = await fetch(`${ESP32_BASE_URL}${endpoint}`, {
      method,
      body: method === "POST" ? body : undefined,
      signal: AbortSignal.timeout(3000),
    })

    const text = await res.text()
    return NextResponse.json({ ok: true, data: text })
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "ESP32 unreachable" },
      { status: 503 }
    )
  }
}
