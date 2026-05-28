import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 })
  }

  try {
    // 1. Get Client Credentials Token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      throw new Error("Failed to get Spotify access token")
    }

    // 2. Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    const searchData = await searchResponse.json()
    const track = searchData.tracks?.items?.[0]

    if (!track) {
      return NextResponse.json({ error: "No track found" }, { status: 404 })
    }

    return NextResponse.json({
      name: track.name,
      artist: track.artists[0]?.name,
      albumArt: track.album?.images[0]?.url,
      uri: track.uri,
      externalUrl: track.external_urls?.spotify
    })
  } catch (error) {
    console.error("Spotify Search Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
