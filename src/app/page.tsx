"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Miaw, STATES } from "@/components/Miaw"
import { SpotifyPlayer, DEMO_SONGS } from "@/components/SpotifyPlayer"
import type { MiawResponse } from "@/app/api/chat/route"
import { useTelemetry } from "@/hooks/useTelemetry"
import { useScheduler } from "@/hooks/useScheduler"
import { useSFX } from "@/hooks/useSFX"
import { supabase } from "@/lib/supabaseClient"
import Webcam from "react-webcam"
import {
  Camera,
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react"

const ESP32_BASE_URL = "http://192.168.254.156"

interface ChatMessage {
  role: "user" | "miaw"
  text: string
  expression?: string
  actionFired?: string | null
}

export default function Home() {
  const { playClick, playPop } = useSFX()
  const { data: telemetry, isError: telemetryError } = useTelemetry()
  const [activeView, setActiveView] = useState<"dashboard" | "lyrics">("dashboard")
  
  const [activeMiawState, setActiveMiawState] = useState<keyof typeof STATES>("idleCalm")
  const [activeSpotifyMode, setActiveSpotifyMode] = useState<"intro" | "playing" | "paused" | "noSong" | "changing">("playing")
  const [songIndex, setSongIndex] = useState(0)
  const [animSpeed, setAnimSpeed] = useState(1.0)
  const [animate, setAnimate] = useState(true)

  const webcamRef = useRef<Webcam>(null)
  const [isVisionActive, setIsVisionActive] = useState(false)

  const [chatInput, setChatInput] = useState("")
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Advanced State Machine Refs
  const groomingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sleepingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const expressionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [ttsPitch, setTtsPitch] = useState(1.4)
  const [ttsRate, setTtsRate] = useState(1.05)
  const [showSettings, setShowSettings] = useState(false)

  // Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false)
  const [sttSupported, setSttSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const [isContinuousMic, setIsContinuousMic] = useState(false)
  const isContinuousMicRef = useRef(false)

  // Speech Synthesis (TTS) State
  const [isMuted, setIsMuted] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(true)
  const isSpeakingRef = useRef(false)

  // Sync state to ESP32 OLED
  useEffect(() => {
    fetch(`${ESP32_BASE_URL}/state`, {
      method: "POST",
      body: activeMiawState
    }).catch(() => {}) // Ignore errors if ESP32 is offline
  }, [activeMiawState])

  // Fetch Memories on Mount
  useEffect(() => {
    async function fetchMemories() {
      const { data, error } = await supabase
        .from("miaw_memories")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50)
      
      if (!error && data) {
        setChatLog(data.map((row: any) => ({
          role: row.role as "user" | "miaw",
          text: row.text,
          expression: row.expression,
          actionFired: row.actionFired
        })))
      }
    }
    fetchMemories()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setSttSupported(false)
      } else {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.lang = "id-ID"
        recognitionRef.current.interimResults = false
        // continuous = true: mic stays alive and fires onresult for each phrase
        recognitionRef.current.continuous = true

        recognitionRef.current.onstart = () => {
          setIsListening(true)
        }

        recognitionRef.current.onresult = (event: any) => {
          // Get the latest result
          const lastResult = event.results[event.results.length - 1]
          if (!lastResult.isFinal) return
          const rawTranscript = lastResult[0].transcript.trim()
          if (!rawTranscript) return
          
          // Immediately stop mic to prevent feedback loop (mic picking up TTS)
          isSpeakingRef.current = true
          try { recognitionRef.current.stop() } catch (e) {}
          
          setChatInput(rawTranscript)
          handleSendMessage(rawTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          // no-speech and aborted are expected during TTS or silence
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn("Speech API Error:", event.error)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          // Auto-restart if continuous mode is on AND Miaw is NOT speaking
          if (isContinuousMicRef.current && !isSpeakingRef.current) {
            setTimeout(() => {
              if (isContinuousMicRef.current && !isSpeakingRef.current && recognitionRef.current) {
                try { recognitionRef.current.start() } catch (e) {}
              }
            }, 500)
          }
        }
      }

      if (!("speechSynthesis" in window)) {
        setTtsSupported(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetInactivityTimers = useCallback(() => {
    if (groomingTimeoutRef.current) clearTimeout(groomingTimeoutRef.current)
    if (sleepingTimeoutRef.current) clearTimeout(sleepingTimeoutRef.current)

    const groomingTime = Math.floor(Math.random() * 2000) + 3000
    groomingTimeoutRef.current = setTimeout(() => {
      setActiveMiawState((current) => {
        if (current === "idleCalm") {
          setTimeout(() => setActiveMiawState((state) => state === "grooming" ? "idleCalm" : state), 5000)
          return "grooming"
        }
        return current
      })
    }, groomingTime)

    const sleepingTime = Math.floor(Math.random() * 1000) + 9000
    sleepingTimeoutRef.current = setTimeout(() => {
      setActiveMiawState((current) => {
        if (current === "idleCalm") {
          return "sleeping"
        }
        return current
      })
    }, sleepingTime)
  }, [])

  useEffect(() => {
    return () => {
      if (groomingTimeoutRef.current) clearTimeout(groomingTimeoutRef.current)
      if (sleepingTimeoutRef.current) clearTimeout(sleepingTimeoutRef.current)
      if (expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current)
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
    }
  }, [])

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

  useScheduler(dispatchESP32Action)

  const handleManualLampToggle = useCallback(async (lampId: "lamp1" | "lamp2" | "lamp3") => {
    const endpoints = {
      lamp1: "/tamu",
      lamp2: "/kamar",
      lamp3: "/dapur",
    }
    const endpoint = endpoints[lampId]
    try {
      await fetch(`${ESP32_BASE_URL}${endpoint}`, {
        method: "POST",
        mode: "no-cors",
      })
    } catch (err) {
      console.warn(`Manual toggle failed for ${lampId}:`, err)
    }
  }, [])

  const restartMicAfterSpeech = useCallback(() => {
    isSpeakingRef.current = false
    if (isContinuousMicRef.current && recognitionRef.current) {
      setTimeout(() => {
        if (isContinuousMicRef.current && !isSpeakingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch (e) {
            // Already running, ignore
          }
        }
      }, 400)
    }
  }, [])

  const speakReply = useCallback((text: string, targetExpression?: keyof typeof STATES) => {
    playPop()

    // Mark as speaking and stop mic to avoid collision
    isSpeakingRef.current = true
    if (recognitionRef.current && isContinuousMicRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }

    if (isMuted || !ttsSupported || typeof window === "undefined") {
      if (targetExpression && STATES[targetExpression]) {
        setActiveMiawState(targetExpression)
        expressionTimeoutRef.current = setTimeout(() => {
          setActiveMiawState("idleCalm")
          resetInactivityTimers()
          restartMicAfterSpeech()
        }, 2000)
      } else {
        setActiveMiawState("idleCalm")
        resetInactivityTimers()
        restartMicAfterSpeech()
      }
      return
    }
    
    try {
      const synth = window.speechSynthesis
      synth.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text)
      
      const voices = synth.getVoices()
      const idVoices = voices.filter(v => v.lang.includes("id"))
      const googleVoice = idVoices.find(v => v.name.toLowerCase().includes("google"))
      
      if (googleVoice) {
        utterance.voice = googleVoice
      } else if (idVoices.length > 0) {
        utterance.voice = idVoices[0]
      }
      
      const hour = new Date().getHours()
      let dynamicPitch = ttsPitch
      let dynamicRate = ttsRate
      if (hour < 10) {
        dynamicPitch += 0.2
        dynamicRate += 0.1
      } else if (hour > 20) {
        dynamicPitch -= 0.3
        dynamicRate -= 0.1
      }

      utterance.lang = "id-ID"
      utterance.pitch = dynamicPitch
      utterance.rate = dynamicRate

      setActiveMiawState("speaking")

      utterance.onend = () => {
        if (targetExpression && STATES[targetExpression]) {
          setActiveMiawState(targetExpression)
        } else {
          setActiveMiawState("idleCalm")
        }
        
        expressionTimeoutRef.current = setTimeout(() => {
          setActiveMiawState("idleCalm")
          resetInactivityTimers()
          restartMicAfterSpeech()
        }, 2000)
      }

      utterance.onerror = () => {
        setActiveMiawState("idleCalm")
        resetInactivityTimers()
        restartMicAfterSpeech()
      }

      synth.speak(utterance)
    } catch (err) {
      console.warn("Speech Synthesis failed:", err)
      setActiveMiawState("idleCalm")
      resetInactivityTimers()
      restartMicAfterSpeech()
    }
  }, [isMuted, ttsSupported, resetInactivityTimers, playPop, ttsPitch, ttsRate, restartMicAfterSpeech])

  const handleSendMessage = useCallback(async (overrideMessage?: string) => {
    const message = (overrideMessage || chatInput).trim()
    if (!message || isLoading) return

    setChatInput("")
    setChatLog((prev) => [...prev, { role: "user", text: message }])
    supabase.from("miaw_memories").insert({ role: "user", text: message }).then()
    
    let imageBase64: string | undefined = undefined
    if (isVisionActive && webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot()
      if (screenshot) imageBase64 = screenshot
    }

    setActiveMiawState("thinking")
    setIsLoading(true)
    setLastReply(null)

    try {
      // Ambil 10 pesan terakhir dari chatLog untuk konteks AI
      const recentHistory = chatLog.slice(-10).map(msg => ({
        role: msg.role === "miaw" ? "assistant" : "user",
        content: msg.text
      }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message,
          telemetry,
          localTime: new Date().toLocaleTimeString("id-ID"),
          imageBase64,
          history: recentHistory
        }),
      })

      const data = (await res.json()) as MiawResponse & { error?: string }

      if (!res.ok || data.error) {
        setActiveMiawState("confused")
        const errorReply = data.reply || "Miaw tidak bisa memproses permintaan."
        setLastReply(errorReply)
        speakReply(errorReply, "confused")
        setChatLog((prev) => [
          ...prev,
          { role: "miaw", text: errorReply, expression: "confused" },
        ])
        supabase.from("miaw_memories").insert({ role: "miaw", text: errorReply, expression: "confused" }).then()
        
        resetInactivityTimers()
        return
      }

      setLastReply(data.reply)
      speakReply(data.reply, (data.expression as keyof typeof STATES) || "speaking")

      let actionFired: string | null = null
      
      if (data.schedule) {
        const executeAt = new Date(Date.now() + data.schedule.time_in_minutes * 60000).toISOString()
        actionFired = `Scheduled ${data.schedule.endpoint} in ${data.schedule.time_in_minutes}m`
        supabase.from("miaw_schedules").insert({
          execute_at: executeAt,
          endpoint: data.schedule.endpoint,
          method: "POST"
        }).then()
      } else if (data.media) {
        actionFired = `Spotify: ${data.media.toUpperCase()}`
        if (data.media === "play") setActiveSpotifyMode("playing")
        if (data.media === "pause") setActiveSpotifyMode("paused")
        if (data.media === "next") setSongIndex((prev) => (prev + 1) % DEMO_SONGS.length)
        if (data.media === "prev") setSongIndex((prev) => (prev - 1 < 0 ? DEMO_SONGS.length - 1 : prev - 1))
      } else if (data.action?.endpoint) {
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
      
      supabase.from("miaw_memories").insert({
        role: "miaw",
        text: data.reply,
        expression: data.expression,
        actionFired
      }).then()
    } catch {
      setActiveMiawState("confused")
      const errorReply = "Koneksi ke server AI terputus."
      setLastReply(errorReply)
      speakReply(errorReply, "confused")
      setChatLog((prev) => [
        ...prev,
        { role: "miaw", text: errorReply, expression: "confused" },
      ])
      supabase.from("miaw_memories").insert({ role: "miaw", text: errorReply, expression: "confused" }).then()
      
      resetInactivityTimers()
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [chatInput, isLoading, dispatchESP32Action, speakReply, telemetry])

  const toggleListening = useCallback(() => {
    playClick()
    if (!recognitionRef.current) return
    try {
      if (isContinuousMic) {
        // Turn OFF
        setIsContinuousMic(false)
        isContinuousMicRef.current = false
        isSpeakingRef.current = false
        try { recognitionRef.current.stop() } catch (e) {}
        setActiveMiawState("idleCalm")
        setIsListening(false)
      } else {
        // Turn ON
        setIsContinuousMic(true)
        isContinuousMicRef.current = true
        isSpeakingRef.current = false
        try { recognitionRef.current.start() } catch (e) {}
      }
      resetInactivityTimers()
    } catch (err) {
      console.warn("Failed to toggle speech recognition", err)
    }
  }, [isContinuousMic, isListening, resetInactivityTimers])

  const bgColors: Record<keyof typeof STATES, string> = {
    idleCalm: "bg-[#f4f4f0]",
    listening: "bg-blue-100",
    thinking: "bg-yellow-100",
    speaking: "bg-[#f4f4f0]",
    happy: "bg-green-100",
    confused: "bg-red-200",
    sleeping: "bg-[#bfdbfe]",
    grooming: "bg-purple-100"
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-black selection:text-white transition-colors duration-500 ${bgColors[activeMiawState]} dark:bg-zinc-950`}>
      {/* Navigation */}
      <header className="border-b-[4px] border-black bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-black border-[3px] border-black p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-10 h-10 flex items-center justify-center overflow-hidden">
              <div className="w-[120%] h-[120%] text-[#9ee2ff] flex items-center justify-center">
                <Miaw state={activeMiawState} animSpeed={animSpeed} animate={animate} />
              </div>
            </div>
            <span className="font-black text-lg sm:text-xl tracking-wider uppercase text-black dark:text-white hidden min-[380px]:inline-block">Miaw // Hub</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {activeView === "dashboard" ? (
              <Button
                onClick={() => setActiveView("lyrics")}
                className="flex items-center gap-2 border-[3px] border-black bg-[#60a5fa] px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#3b82f6] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Headphones className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Open Miaw Lyrics</span>
              </Button>
            ) : (
              <Button
                onClick={() => setActiveView("dashboard")}
                className="flex items-center gap-2 border-[3px] border-black bg-[#ffde43] px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#fcd34d] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <ArrowLeft className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-black dark:text-white">
              <span className="inline-block size-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-black dark:text-white">Console Online</span>
            </div>
            <Button variant={isVisionActive ? "default" : "outline"} size="icon" onClick={() => { playClick(); setIsVisionActive(!isVisionActive) }} className={`border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isVisionActive ? "bg-red-400 text-white hover:bg-red-500" : ""}`}>
              <Camera className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => { playClick(); setShowSettings(true) }} className="border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 dark:hover:bg-zinc-800">
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
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-0">
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
                    {isVisionActive && (
                      <div className="absolute top-2 left-2 w-32 h-24 sm:w-40 sm:h-32 border-[3px] border-[#5ec8ff] bg-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(94,200,255,0.5)] z-20 flex flex-col">
                        <div className="bg-[#5ec8ff] text-black text-[8px] sm:text-[10px] font-black uppercase px-1 flex justify-between items-center">
                          <span>Vision Active</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover grayscale brightness-110 contrast-125 opacity-80 mix-blend-screen"
                        />
                      </div>
                    )}
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

                  {/* Quick Actions */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["Nyalakan semua lampu", "Berapa suhu ruangan?", "Putar musik", "Ceritakan lelucon"].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          playClick()
                          handleSendMessage(cmd)
                        }}
                        className="whitespace-nowrap px-3 py-1.5 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800 dark:text-white"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-1.5 sm:gap-2">
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
                      className="flex-1 w-full min-w-0 border-[3px] border-black bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-bold text-black placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:bg-[#fffef5] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                    />
                    
                    {sttSupported && (
                      <Button
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={`px-2 sm:px-4 h-11 sm:h-[52px] shrink-0 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                          isContinuousMic 
                            ? "bg-red-500 text-white hover:bg-red-600 animate-[pulse_1.5s_ease-in-out_infinite]" 
                            : isListening
                            ? "bg-red-400 text-white"
                            : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        }`}
                        title={isContinuousMic ? "Wake Word Mode Active (Say 'Miaw')" : "Click to enable Wake Word Mode"}
                      >
                        {isContinuousMic || isListening ? <MicOff className="size-5 sm:size-6" /> : <Mic className="size-5 sm:size-6" />}
                      </Button>
                    )}

                      <Button
                        onClick={() => {
                          playClick()
                          handleSendMessage()
                        }}
                        disabled={isLoading || (!chatInput.trim() && !isListening)}
                      className="px-3 sm:px-6 h-11 sm:h-[52px] shrink-0 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isLoading ? (
                        <Loader2 className="size-5 sm:size-6 animate-spin" />
                      ) : (
                        <Send className="size-5 sm:size-6" />
                      )}
                    </Button>
                  </div>

                  {/* Chat Log */}
                  {(chatLog.length > 0 || isLoading) && (
                    <div className="border-[3px] border-black bg-[#f4f4f0] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-64 overflow-y-auto dark:bg-zinc-800 dark:border-white flex flex-col">
                      <div className="flex items-center gap-2 px-3 py-2 border-b-[2px] border-black/10 sticky top-0 bg-[#f4f4f0] dark:bg-zinc-800 z-10">
                        <MessageSquare className="size-3 text-zinc-500" />
                        <span className="text-[10px] font-black uppercase text-zinc-500">Chat History</span>
                      </div>
                      <div className="p-3 space-y-2 flex-1">
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
                        {isLoading && (
                          <div className="mt-2 bg-black text-green-400 font-mono text-xs p-3 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                            <div className="animate-pulse">{">"} FETCHING NEURAL WEIGHTS...</div>
                            <div className="animate-[pulse_1s_ease-in-out_infinite]">{">"} ANALYZING CONTEXT...</div>
                            <div className="animate-[pulse_1.5s_ease-in-out_infinite]">{">"} AWAITING RESPONSE_ [█]</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual State Triggers & Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                        Manual State Triggers
                      </h3>
                      {ttsSupported && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`font-black text-xs px-3 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            isMuted 
                              ? "bg-zinc-200 text-black hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600" 
                              : "bg-[#4ade80] text-black hover:bg-[#22c55e]"
                          }`}
                          title={isMuted ? "Unmute Voice" : "Mute Voice"}
                        >
                          {isMuted ? <VolumeX className="size-4 mr-2" /> : <Volume2 className="size-4 mr-2" />}
                          {isMuted ? "Voice Muted" : "Voice On"}
                        </Button>
                      )}
                    </div>
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
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                          {telemetryError || !telemetry ? "ERR" : `${telemetry.temperature.toFixed(1)} \u00b0C`}
                        </div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Humidity</div>
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                          {telemetryError || !telemetry ? "---" : `${telemetry.humidity.toFixed(1)} %`}
                        </div>
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
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                          {telemetryError || !telemetry ? "ERR" : `${telemetry.ldr} lx`}
                        </div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Auto Mode</div>
                        <div className="text-lg sm:text-xl font-black uppercase pt-1 text-green-600 dark:text-green-400">
                          {telemetryError || !telemetry ? "ERR" : "Active"}
                        </div>
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
                    <button onClick={() => handleManualLampToggle('lamp1')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 1 (Living Room)</span>
                      {!telemetryError && telemetry?.lamps.lamp1 ? (
                        <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                      ) : (
                        <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                      )}
                    </button>
                    <button onClick={() => handleManualLampToggle('lamp2')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 2 (Bedroom)</span>
                      {!telemetryError && telemetry?.lamps.lamp2 ? (
                        <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                      ) : (
                        <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                      )}
                    </button>
                    <button onClick={() => handleManualLampToggle('lamp3')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 3 (Kitchen)</span>
                      {!telemetryError && telemetry?.lamps.lamp3 ? (
                        <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                      ) : (
                        <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                      )}
                    </button>
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
          <div className="flex gap-4 opacity-75">
            <span className="text-black dark:text-white">ESP32 Telemetry Linked</span>
            <span className="text-black dark:text-white">Groq AI Powered</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-[4px] border-black p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-900">
            <h2 className="text-2xl font-black uppercase mb-6 border-b-[3px] border-black pb-2 text-black dark:text-white">Settings</h2>
            <div className="space-y-6 font-bold text-black dark:text-white">
              <div>
                <label className="block text-sm uppercase mb-2 flex justify-between">
                  <span>TTS Pitch (Base)</span>
                  <span>{ttsPitch.toFixed(1)}</span>
                </label>
                <input type="range" min="0.5" max="2.0" step="0.1" value={ttsPitch} onChange={(e) => setTtsPitch(parseFloat(e.target.value))} className="w-full accent-black dark:accent-white" />
              </div>
              <div>
                <label className="block text-sm uppercase mb-2 flex justify-between">
                  <span>TTS Rate (Base)</span>
                  <span>{ttsRate.toFixed(1)}</span>
                </label>
                <input type="range" min="0.5" max="2.0" step="0.1" value={ttsRate} onChange={(e) => setTtsRate(parseFloat(e.target.value))} className="w-full accent-black dark:accent-white" />
              </div>
            </div>
            <button onClick={() => { playClick(); setShowSettings(false) }} className="mt-8 w-full bg-[#ffde43] border-[3px] border-black px-4 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black hover:bg-[#fcd000]">
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
