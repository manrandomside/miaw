"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Miaw, STATES } from "@/components/Miaw"
import { SpotifyPlayer, DEMO_SONGS } from "@/components/SpotifyPlayer"
import type { MiawResponse } from "@/app/api/chat/route"
import {
  Cpu,
  Settings,
  Thermometer,
  Sun,
  Lightbulb,
  ShieldAlert,
  Music,
  Sliders,
  Send,
  Loader2,
  MessageSquare,
  Zap,
  Headphones,
  ArrowLeft,
} from "lucide-react"

const ESP32_BASE_URL = "http://192.168.254.156"

interface ChatMessage {
  role: "user" | "miaw"
  text: string
  expression?: string
  actionFired?: string | null
}

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "lyrics">("dashboard")
  
  const [activeMiawState, setActiveMiawState] = useState<keyof typeof STATES>("idleCalm")
  const [activeSpotifyMode, setActiveSpotifyMode] = useState<"intro" | "playing" | "paused" | "noSong" | "changing">("playing")
  const [songIndex, setSongIndex] = useState(0)
  const [animSpeed, setAnimSpeed] = useState(1.0)
  const [animate, setAnimate] = useState(true)

  const [chatInput, setChatInput] = useState("")
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const dispatchESP32Action = useCallback(async (endpoint: string, method: string) => {
    try {
      await fetch(`${ESP32_BASE_URL}${endpoint}`, {
        method,
        mode: "no-cors",
      })
    } catch {
      // ESP32 may be unreachable in dev; silently fail
    }
  }, [])

  const handleSendMessage = useCallback(async () => {
    const message = chatInput.trim()
    if (!message || isLoading) return

    setChatInput("")
    setChatLog((prev) => [...prev, { role: "user", text: message }])
    setActiveMiawState("thinking")
    setIsLoading(true)
    setLastReply(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const data = (await res.json()) as MiawResponse & { error?: string }

      if (!res.ok || data.error) {
        setActiveMiawState("confused")
        const errorReply = data.reply || "Miaw tidak bisa memproses permintaan."
        setLastReply(errorReply)
        setChatLog((prev) => [
          ...prev,
          { role: "miaw", text: errorReply, expression: "confused" },
        ])
        return
      }

      setActiveMiawState("speaking")

      setTimeout(() => {
        const expr = (data.expression || "speaking") as keyof typeof STATES
        if (STATES[expr]) {
          setActiveMiawState(expr)
        } else {
          setActiveMiawState("speaking")
        }
      }, 1500)

      setLastReply(data.reply)

      let actionFired: string | null = null
      if (data.action?.endpoint) {
        actionFired = `${data.action.method} ${data.action.endpoint}`
        dispatchESP32Action(data.action.endpoint, data.action.method)
      }

      setChatLog((prev) => [
        ...prev,
        {
          role: "miaw",
          text: data.reply,
          expression: data.expression,
          actionFired,
        },
      ])
    } catch {
      setActiveMiawState("confused")
      const errorReply = "Koneksi ke server AI terputus."
      setLastReply(errorReply)
      setChatLog((prev) => [
        ...prev,
        { role: "miaw", text: errorReply, expression: "confused" },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [chatInput, isLoading, dispatchESP32Action])

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white bg-[#f4f4f0] dark:bg-zinc-950">
      {/* Navigation */}
      <header className="border-b-[4px] border-black bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#ffde43] border-[3px] border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Cpu className="size-6 text-black" />
            </div>
            <span className="font-black text-xl tracking-wider uppercase text-black dark:text-white">Miaw // Hub</span>
          </div>

          <div className="flex items-center gap-4">
            {activeView === "dashboard" ? (
              <Button
                onClick={() => setActiveView("lyrics")}
                className="flex items-center gap-2 border-[3px] border-black bg-[#60a5fa] px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#3b82f6] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Headphones className="size-4" />
                Open Miaw Lyrics
              </Button>
            ) : (
              <Button
                onClick={() => setActiveView("dashboard")}
                className="flex items-center gap-2 border-[3px] border-black bg-[#ffde43] px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#fcd34d] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-black dark:text-white">
              <span className="inline-block size-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-black dark:text-white">Console Online</span>
            </div>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {activeView === "dashboard" && (
          <div className="space-y-10">
            {/* Centered AI Chat View */}
            <section className="flex flex-col items-center">
              <div className="w-full border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col dark:bg-zinc-900">
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="border-[3px] border-black bg-[#ffde43] text-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      AI Assistant Mascot
                    </span>
                    <span className="text-xs font-mono font-black uppercase text-zinc-500">
                      Groq LLM Brain
                    </span>
                  </div>

                  <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
                    Miaw Character
                  </h2>

                  {/* OLED Screen Viewport */}
                  <div className="border-[4px] border-black bg-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative h-64 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1a2e_0%,_#050912_100%)] pointer-events-none" />
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(#5ec8ff 1px, transparent 1px), linear-gradient(90deg, #5ec8ff 1px, transparent 1px)`,
                        backgroundSize: "4px 4px",
                      }}
                    />
                    <div className="w-full h-full relative z-10 text-[#9ee2ff] drop-shadow-[0_0_4px_#5ec8ff]">
                      <Miaw state={activeMiawState} animSpeed={animSpeed} animate={animate} />
                    </div>
                  </div>

                  {/* Reply Bubble */}
                  {lastReply && (
                    <div className="border-[3px] border-black bg-[#ffde43] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative mx-auto w-full">
                      <div className="absolute -top-2 left-8 w-4 h-4 bg-[#ffde43] border-t-[3px] border-l-[3px] border-black rotate-45" />
                      <p className="font-bold text-lg text-black leading-relaxed">{lastReply}</p>
                      <span className="block text-[10px] font-black uppercase text-black/50 mt-1">
                        Miaw -- {activeMiawState}
                      </span>
                    </div>
                  )}

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage()
                      }}
                      placeholder="Ketik pesan ke Miaw..."
                      disabled={isLoading}
                      className="flex-1 border-[3px] border-black bg-white px-4 py-3 text-base font-bold text-black placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:bg-[#fffef5] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !chatInput.trim()}
                      size="lg"
                      className="px-6 shrink-0 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isLoading ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <Send className="size-6" />
                      )}
                    </Button>
                  </div>

                  {/* Chat Log */}
                  {chatLog.length > 0 && (
                    <div className="border-[3px] border-black bg-[#f4f4f0] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto dark:bg-zinc-800 dark:border-white">
                      <div className="flex items-center gap-2 px-3 py-2 border-b-[2px] border-black/10">
                        <MessageSquare className="size-3 text-zinc-500" />
                        <span className="text-[10px] font-black uppercase text-zinc-500">Chat History</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {chatLog.map((msg, i) => (
                          <div key={i} className={`text-sm font-mono ${msg.role === "user" ? "text-blue-700 dark:text-blue-400" : "text-black dark:text-white"}`}>
                            <span className="font-black uppercase text-[10px] opacity-60">
                              {msg.role === "user" ? "YOU" : "MIAW"}
                            </span>
                            <span className="ml-2 font-bold">{msg.text}</span>
                            {msg.actionFired && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-green-700 dark:text-green-400 font-bold bg-green-100 border-[2px] border-green-800 px-1 py-0.5">
                                <Zap className="size-3" />
                                {msg.actionFired}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual State Triggers */}
                  <div className="space-y-3">
                    <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                      Manual State Triggers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATES) as Array<keyof typeof STATES>).map((stateKey) => {
                        const isSelected = activeMiawState === stateKey
                        return (
                          <Button
                            key={stateKey}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveMiawState(stateKey)}
                            className={`font-black text-xs tracking-wide border-[2px] border-black ${
                              isSelected ? "bg-[#ffde43] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {STATES[stateKey].short}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Speed sliders & Toggles */}
                <div className="border-t-[3px] border-black/10 pt-4 mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sliders className="size-4 text-black dark:text-white" />
                    <span className="font-bold text-xs uppercase text-black dark:text-white">Speed multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={animSpeed === 0.5 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnimSpeed(0.5)}
                      className={`font-black text-xs px-3 border-[2px] border-black ${animSpeed === 0.5 ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white dark:bg-white dark:text-black" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"}`}
                    >
                      0.5x
                    </Button>
                    <Button
                      variant={animSpeed === 1.0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnimSpeed(1.0)}
                      className={`font-black text-xs px-3 border-[2px] border-black ${animSpeed === 1.0 ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white dark:bg-white dark:text-black" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"}`}
                    >
                      1.0x
                    </Button>
                    <Button
                      variant={animSpeed === 1.8 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnimSpeed(1.8)}
                      className={`font-black text-xs px-3 border-[2px] border-black ${animSpeed === 1.8 ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white dark:bg-white dark:text-black" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"}`}
                    >
                      1.8x
                    </Button>
                    <Button
                      variant={animate ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnimate(!animate)}
                      className={`font-black text-xs px-4 ml-2 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${animate ? "bg-[#ffde43] text-black" : "bg-red-500 text-white"}`}
                    >
                      {animate ? "Pause" : "Play"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Dashboard Grid (ESP32 Live Telemetry) */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wider border-b-[4px] border-black pb-2 text-black dark:text-white text-center sm:text-left">
                ESP32 Dashboard Telemetry
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Climate Card */}
                <div className="border-[4px] border-black bg-[#a78bfa] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-purple-900 dark:text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                      <h3 className="font-black uppercase text-lg tracking-tight">DHT11 Climate</h3>
                      <Thermometer className="size-6 text-black dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Temp</div>
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">24.5 &deg;C</div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Humidity</div>
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">62.0 %</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Light Sensor Card */}
                <div className="border-[4px] border-black bg-[#4ade80] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-green-900 dark:text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                      <h3 className="font-black uppercase text-lg tracking-tight">LDR Ambient</h3>
                      <Sun className="size-6 text-black dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Intensity</div>
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">350 lx</div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Auto Mode</div>
                        <div className="text-lg sm:text-xl font-black uppercase pt-1 text-green-600 dark:text-green-400">Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actuators Card */}
                <div className="border-[4px] border-black bg-[#f472b6] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-pink-900 dark:text-white">
                  <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                    <h3 className="font-black uppercase text-lg tracking-tight">Smart Lamps</h3>
                    <Lightbulb className="size-6 text-black dark:text-white" />
                  </div>
                  <div className="space-y-3 font-bold text-sm">
                    <div className="flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 1 (Living Room)</span>
                      <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                    </div>
                    <div className="flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 2 (Bedroom)</span>
                      <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                    </div>
                    <div className="flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 3 (Kitchen)</span>
                      <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeView === "lyrics" && (
          <div className="space-y-10">
            {/* Centered Spotify Lyrics Player */}
            <section className="flex flex-col items-center">
              <div className="w-full max-w-4xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between dark:bg-zinc-900">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="border-[3px] border-black bg-[#60a5fa] text-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Media & Lyrics Player
                    </span>
                    <span className="text-xs font-mono font-black uppercase text-zinc-500">
                      Spotify Linker
                    </span>
                  </div>

                  <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
                    Spotify Lyrics Screen
                  </h2>

                  {/* Styled Spotify Viewport */}
                  <div className="border-[4px] border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-64 sm:h-80 flex items-center justify-center">
                    <SpotifyPlayer
                      mode={activeSpotifyMode}
                      songIndex={songIndex}
                      speed={animSpeed}
                    />
                  </div>

                  {/* Spotify Track Picker */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-black text-base uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                      <Music className="size-5" />
                      Select Demo Track
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {DEMO_SONGS.map((song, idx) => {
                        const isSelected = songIndex === idx
                        return (
                          <button
                            key={idx}
                            onClick={() => setSongIndex(idx)}
                            className={`w-full flex items-center justify-between p-4 border-[3px] border-black text-left font-mono font-bold transition-all ${
                              isSelected
                                ? "bg-[#60a5fa] text-black translate-x-[2px] translate-y-[2px] shadow-none"
                                : "bg-white text-black hover:bg-[#f4f4f0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800 dark:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm opacity-50">0{idx + 1}</span>
                              <div>
                                <span className="block text-base uppercase font-black">{song.title}</span>
                                <span className="block text-xs opacity-60">{song.artist}</span>
                              </div>
                            </div>
                            <span className="text-sm opacity-75">
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Spotify Screen Mode Controllers */}
                  <div className="space-y-4 pt-6 border-t-[3px] border-black/10">
                    <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                      Spotify Screen Mode Triggers
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(["playing", "paused", "noSong", "changing", "intro"] as const).map((mode) => {
                        const isSelected = activeSpotifyMode === mode
                        return (
                          <Button
                            key={mode}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveSpotifyMode(mode)}
                            className={`font-black text-sm px-4 h-10 border-[3px] border-black uppercase ${
                              isSelected ? "bg-[#60a5fa] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"
                            }`}
                          >
                            {mode === "noSong" ? "No Song" : mode}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="border-t-[3px] border-black/10 pt-4 mt-8">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="size-4 text-black dark:text-white" />
                    <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400">
                      Simulated local client mode only. Requires ESP32 for hardware projection.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t-[4px] border-black bg-white dark:bg-zinc-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-sm">
          <span className="text-black dark:text-white">&copy; 2026 Miaw Smart Home Hub.</span>
          <span className="uppercase text-xs tracking-widest font-black border-[2px] border-black px-2.5 py-1 bg-[#ffde43] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            Endless Evolution Mode
          </span>
        </div>
      </footer>
    </div>
  )
}
