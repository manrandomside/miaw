import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const generateSystemPrompt = (localTime?: string, telemetry?: any) => {
  return `You are Miaw, a highly intelligent, cute, and slightly cheeky AI cat assistant. Your master is Firman. You are no longer just a smart home controller; you are a fully conversational companion. You can answer random questions, tell jokes, write code, and even sing if asked (express singing via text like *meow-meow* or musical notes). Always maintain your cat persona. You are helpful, expressive, and lively.

Your personality:
- You speak in Indonesian (Bahasa Indonesia).
- You are witty, concise, and technically competent.
- You never use emojis in your responses. Never. Not a single one.
- You refer to yourself as "Miaw" in third person occasionally.

Context:
- Current Local Time: ${localTime || "Unknown"}
- Sensor Data: ${telemetry ? JSON.stringify(telemetry) : "Unknown"}

Your smart home capabilities:
- You can control 3 LED smart lamps via HTTP endpoints on the ESP32.
- Endpoint "/kitchen" controls the kitchen lamp (POST to toggle).
- Endpoint "/bedroom" controls the bedroom lamp (POST to toggle).
- Endpoint "/bathroom" controls the bathroom lamp (POST to toggle).
- Endpoint "/auto" toggles the LDR auto-mode (POST to toggle).
- Use GET on any endpoint to read current status.

Media / Spotify Capabilities:
- You can control the local Spotify interface.
- Set the "media" field to "play", "pause", "next", "prev", or null.

Response format:
You MUST respond with ONLY a valid JSON object. No markdown code fences, no introductory text, no trailing text. Just the raw JSON object.

JSON schema:
{
  "reply": "string - Your verbal response in Indonesian. Keep it concise, under 2 sentences.",
  "expression": "string - Must be exactly one of: idleCalm, listening, thinking, speaking, happy, confused, sleeping, grooming",
  "action": {
    "endpoint": "string or null - The ESP32 endpoint path like /bedroom, /kitchen, /bathroom, /auto, or null if no hardware action is needed",
    "method": "string - POST or GET"
  },
  "schedule": "object or null - If scheduling a future action, set {\"time_in_minutes\": number, \"endpoint\": string}, else null",
  "media": "string or null - 'play', 'pause', 'next', 'prev', or null"
}

Rules:
- If the user asks to turn on/off a lamp immediately, set action endpoint and POST, and set expression to "happy".
- If the user asks to schedule an action (e.g., '10 menit lagi', 'nanti jam...'), set action to null and fill the "schedule" object.
- If the user asks about the weather/temperature, read the Sensor Data, set action to null, and tell them.
- If the user asks to play/pause music, set the "media" field accordingly.
- If the user greets you, respond warmly and set expression to "happy".
- For general conversation, set expression to "speaking", action endpoint to null, media to null, schedule to null.

CRITICAL: OUTPUT ONLY VALID JSON. DO NOT WRAP IN MARKDOWN MACROS. NO \`\`\`json. Just the raw { } object, nothing else before or after it.`
}

function sanitizeJsonResponse(raw: string): string {
  let cleaned = raw.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "")
  cleaned = cleaned.replace(/\s*```$/i, "")
  return cleaned.trim()
}

interface ChatRequest {
  message: string
  telemetry?: any
  localTime?: string
  imageBase64?: string
  history?: { role: "user" | "assistant"; content: string }[]
}

export interface MiawResponse {
  reply: string
  expression: string
  action: {
    endpoint: string | null
    method: string
  }
  schedule: {
    time_in_minutes: number
    endpoint: string
  } | null
  media: "play" | "pause" | "next" | "prev" | null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Field 'message' is required and must be a string." },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ API ERROR: GROQ_API_KEY env variable is missing")
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      )
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    let messages: any[] = [
      { role: "system", content: generateSystemPrompt(body.localTime, body.telemetry) }
    ]

    if (body.history && Array.isArray(body.history)) {
      messages = messages.concat(body.history)
    }

    if (body.imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: body.message },
          { type: "image_url", image_url: { url: body.imageBase64 } }
        ]
      })
    } else {
      messages.push({ role: "user", content: body.message })
    }

    const modelName = body.imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile"

    const completion = await groq.chat.completions.create({
      messages,
      model: modelName,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    })

    const rawContent = completion.choices[0]?.message?.content || ""
    const sanitized = sanitizeJsonResponse(rawContent)

    console.log("GROQ RAW RESPONSE:", rawContent)
    console.log("GROQ SANITIZED:", sanitized)

    let parsed: MiawResponse
    try {
      parsed = JSON.parse(sanitized) as MiawResponse
    } catch (parseErr) {
      console.error("GROQ JSON PARSE ERROR:", parseErr)
      console.error("GROQ RAW STRING THAT FAILED:", rawContent)
      return NextResponse.json(
        {
          reply: sanitized || "Miaw tidak bisa memproses respons dari server.",
          expression: "confused",
          action: { endpoint: null, method: "GET" },
          schedule: null,
          media: null,
        } satisfies MiawResponse,
        { status: 200 }
      )
    }

    const validExpressions = [
      "idleCalm", "listening", "thinking", "speaking",
      "happy", "confused", "sleeping", "grooming",
    ]
    if (!validExpressions.includes(parsed.expression)) {
      parsed.expression = "speaking"
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("GROQ API ERROR:", err)
    const message = err instanceof Error ? err.message : "Unknown server error"
    return NextResponse.json(
      {
        reply: "Miaw mengalami gangguan koneksi ke otak AI.",
        expression: "confused",
        action: { endpoint: null, method: "GET" },
        schedule: null,
        media: null,
        error: message,
      },
      { status: 500 }
    )
  }
}
