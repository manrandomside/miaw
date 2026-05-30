"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Miaw, STATES } from "@/components/Miaw"
import { RadioPlayer, type RadioPlayerHandle } from "@/components/RadioPlayer"
import type { MiawResponse } from "@/app/api/chat/route"
import { useTelemetry } from "@/hooks/useTelemetry"
import { useScheduler } from "@/hooks/useScheduler"
import { useSFX } from "@/hooks/useSFX"
import { supabase } from "@/lib/supabaseClient"
import { isLocalMode } from "@/lib/connectionMode"
import { LoginScreen } from "@/components/LoginScreen"
import { LobbyScreen } from "@/components/LobbyScreen"
import { GamingOverlay } from "@/components/GamingOverlay"
import { AUTH_STORAGE_KEY } from "@/lib/auth"
import Webcam from "react-webcam"
import { AnimatePresence } from "framer-motion"
import {
  Camera,
  Settings,
  Thermometer,
  Sun,
  Lightbulb,
  ShieldAlert,
  Sliders,
  Send,
  Loader2,
  MessageSquare,
  Zap,
  Radio,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut,
} from "lucide-react"

// All ESP32 communication now goes through server-side proxies:
// /api/telemetry for sensor data, /api/esp32 for actions

interface ChatMessage {
  role: "user" | "miaw"
  text: string
  expression?: string
  actionFired?: string | null
}

export default function Home() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isSessionLocked, setIsSessionLocked] = useState(false)
  const [activeDeviceName, setActiveDeviceName] = useState<string>("Unknown Device")

  // Generate Device Info
  const getDeviceInfo = useCallback(() => {
    let deviceId = localStorage.getItem("miaw_device_id")
    let deviceName = localStorage.getItem("miaw_device_name")
    
    if (!deviceId) {
      deviceId = `device_${Math.random().toString(36).substring(2, 9)}`
      const agent = window.navigator.userAgent
      deviceName = "Unknown Device"
      if (agent.includes("Windows")) deviceName = "Windows PC"
      else if (agent.includes("Mac OS")) deviceName = "Mac"
      else if (agent.includes("iPhone")) deviceName = "iPhone"
      else if (agent.includes("Android")) deviceName = "Android Phone"
      
      localStorage.setItem("miaw_device_id", deviceId)
      localStorage.setItem("miaw_device_name", deviceName)
    }
    return { deviceId, deviceName: deviceName || "Unknown Device" }
  }, [])

  const claimSession = useCallback(async (deviceId: string, deviceName: string) => {
    try {
      await supabase
        .from("miaw_sessions")
        .update({
          active_device_id: deviceId,
          active_device_name: deviceName,
          last_active: new Date().toISOString()
        })
        .eq("id", 1)
      setIsSessionLocked(false)
    } catch (err) {
      console.error("Failed to claim session:", err)
    }
  }, [])

  // 1. Initial Auth Check
  useEffect(() => {
    const checkAuthAndSession = async () => {
      const authed = localStorage.getItem(AUTH_STORAGE_KEY) === "true"
      setIsAuthed(authed)
      
      if (authed) {
        const { deviceId, deviceName } = getDeviceInfo()
        
        // Fetch session
        const { data, error } = await supabase.from("miaw_sessions").select("*").eq("id", 1).single()
        
        if (!error && data) {
          if (!data.active_device_id || data.active_device_id === "none" || data.active_device_id === deviceId) {
            // Kita bisa claim session
            await claimSession(deviceId, deviceName)
          } else {
            // Dimiliki orang lain
            setActiveDeviceName(data.active_device_name)
            setIsSessionLocked(true)
          }
        }
      }
      setAuthChecked(true)
    }
    checkAuthAndSession()
  }, [getDeviceInfo, claimSession])

  // 2. Realtime Session Listener & Heartbeat
  useEffect(() => {
    if (!isAuthed) return

    const { deviceId } = getDeviceInfo()
    
    const channel = supabase
      .channel('session-lock-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'miaw_sessions', filter: 'id=eq.1' },
        (payload) => {
          const newDeviceId = payload.new.active_device_id
          if (newDeviceId && newDeviceId !== "none" && newDeviceId !== deviceId) {
            // Seseorang mengambil alih!
            setActiveDeviceName(payload.new.active_device_name)
            setIsSessionLocked(true)
          } else if (newDeviceId === deviceId) {
            setIsSessionLocked(false)
          }
        }
      )
      .subscribe()

    let tickCount = 0
    // Fallback polling 3 detik & Heartbeat
    const sessionCheck = setInterval(async () => {
      try {
        const { data } = await supabase.from("miaw_sessions").select("active_device_id, active_device_name").eq("id", 1).single()
        if (data) {
          const currentOwner = data.active_device_id
          if (currentOwner && currentOwner !== "none" && currentOwner !== deviceId) {
            // Orang lain mengambil alih
            setActiveDeviceName(data.active_device_name)
            if (!isSessionLocked) setIsSessionLocked(true)
          } else if (currentOwner === deviceId) {
            // Kita yang pegang sesi
            if (isSessionLocked) setIsSessionLocked(false)
            tickCount++
            if (tickCount >= 10) { // Heartbeat 30 detik (10 x 3)
              tickCount = 0
              supabase.from("miaw_sessions").update({ last_active: new Date().toISOString() }).eq("id", 1).then()
            }
          } else if (currentOwner === "none") {
            // Sesi kosong
            if (isSessionLocked) setIsSessionLocked(false)
          }
        }
      } catch (err) {}
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(sessionCheck)
    }
  }, [isAuthed, isSessionLocked, getDeviceInfo])

  const handleLoginSuccess = useCallback(async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "true")
    setIsAuthed(true)
    
    const { deviceId, deviceName } = getDeviceInfo()
    const { data } = await supabase.from("miaw_sessions").select("*").eq("id", 1).single()
    if (data && data.active_device_id !== "none" && data.active_device_id !== deviceId) {
      setActiveDeviceName(data.active_device_name)
      setIsSessionLocked(true)
    } else {
      await claimSession(deviceId, deviceName)
    }
  }, [getDeviceInfo, claimSession])

  const handleTakeOver = useCallback(() => {
    const { deviceId, deviceName } = getDeviceInfo()
    claimSession(deviceId, deviceName)
  }, [getDeviceInfo, claimSession])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setIsAuthed(false)
    // Kosongkan sesi agar orang lain bisa masuk
    supabase.from("miaw_sessions").update({ active_device_id: "none", active_device_name: "none" }).eq("id", 1).then()
  }, [])

  const { playClick, playPop } = useSFX()
  const { data: telemetry, isError: telemetryError, isOnline: deviceOnline, lastSeen: deviceLastSeen } = useTelemetry()
  const [activeView, setActiveView] = useState<"dashboard" | "radio">("dashboard")

  const [activeMiawState, setActiveMiawState] = useState<keyof typeof STATES>("idleCalm")
  const radioRef = useRef<RadioPlayerHandle>(null)
  const isRadioPlayingRef = useRef(false)
  const isLoadingRef = useRef(false)
  const [animSpeed, setAnimSpeed] = useState(1.0)
  const [animate, setAnimate] = useState(true)

  const webcamRef = useRef<Webcam>(null)
  const [isVisionActive, setIsVisionActive] = useState(false)

  const [chatInput, setChatInput] = useState("")
  const [showDashboard, setShowDashboard] = useState(false)
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ref agar voice handler SELALU menggunakan versi terbaru handleSendMessage
  const isGamingMode = activeMiawState === "gaming" || telemetry?.state === "gaming";
  const handleSendMessageRef = useRef<(msg?: string) => void>(() => {})

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
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isContinuousMic, setIsContinuousMic] = useState(false)
  const isContinuousMicRef = useRef(false)

  // Speech Synthesis (TTS) State
  const [isMuted, setIsMuted] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(true)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const isSpeakingRef = useRef(false)

  // State dasar Miaw: menari saat radio nyala, kalau tidak idle.
  const restingState = useCallback(
    (): keyof typeof STATES => (isRadioPlayingRef.current ? "dancing" : "idleCalm"),
    []
  )
  const restingStateRef = useRef(restingState)
  useEffect(() => {
    restingStateRef.current = restingState
  }, [restingState])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  // Status playing radio menentukan state dasar (dancing/idle) tanpa mengganggu
  // ekspresi interaksi yang sedang tampil.
  const handleRadioPlayingChange = useCallback((playing: boolean) => {
    isRadioPlayingRef.current = playing
    setActiveMiawState((cur) => {
      const resting =
        cur === "idleCalm" || cur === "dancing" || cur === "sleeping" || cur === "grooming"
      if (!resting) return cur
      return playing ? "dancing" : "idleCalm"
    })
  }, [])

  // Sync state to ESP32 OLED (Hybrid)
  useEffect(() => {
    if (isLocalMode()) {
      fetch(`/api/esp32?endpoint=/state&method=POST`, {
        method: "POST",
        body: activeMiawState
      }).catch(() => {})
    } else {
      supabase.from("miaw_commands").insert({
        endpoint: `/state?val=${activeMiawState}`,
        status: "pending"
      }).then()
    }
  }, [activeMiawState])

  // Sync dashboard visibility to ESP32 (Hybrid)
  useEffect(() => {
    if (isLocalMode()) {
      fetch(`/api/esp32?endpoint=/dash&method=POST`, {
        method: "POST",
        body: showDashboard ? "1" : "0"
      }).catch(() => {})
    } else {
      supabase.from("miaw_commands").insert({
        endpoint: `/dash?val=${showDashboard ? "1" : "0"}`,
        status: "pending"
      }).then()
    }
  }, [showDashboard])

  // Fetch Memories on Mount
  useEffect(() => {
    async function fetchMemories() {
      const { data, error } = await supabase
        .from("miaw_memories")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50)
      
      if (!error && data) {
        setChatLog(data.map((row: { role: string; text: string; expression?: string; actionFired?: string | null }) => ({
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
      const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionImpl) {
        setSttSupported(false)
      } else {
        recognitionRef.current = new SpeechRecognitionImpl()
        recognitionRef.current.lang = "id-ID"
        recognitionRef.current.interimResults = false
        // continuous = true: mic stays alive and fires onresult for each phrase
        recognitionRef.current.continuous = true

        recognitionRef.current.onstart = () => {
          setIsListening(true)
          // Ekspresi listening hanya saat sedang istirahat (idle/dancing).
          setActiveMiawState((cur) => (cur === "idleCalm" || cur === "dancing") ? "listening" : cur)
        }

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          // Get the latest result
          const lastResult = event.results[event.results.length - 1]
          if (!lastResult.isFinal) return
          const rawTranscript = lastResult[0].transcript.trim()
          if (!rawTranscript) return

          // Immediately stop mic to prevent feedback loop (mic picking up TTS)
          isSpeakingRef.current = true
          try { recognitionRef.current?.stop() } catch {}
          
          setChatInput(rawTranscript)
          handleSendMessageRef.current(rawTranscript)
        }

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          // no-speech and aborted are expected during TTS or silence
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn("Speech API Error:", event.error)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          // Selesai menangkap tanpa lanjut ke interaksi: kembali ke resting.
          setActiveMiawState((cur) => cur === "listening" ? restingStateRef.current() : cur)
          // Auto-restart if continuous mode is on AND Miaw is NOT speaking
          if (isContinuousMicRef.current && !isSpeakingRef.current) {
            setTimeout(() => {
              if (isContinuousMicRef.current && !isSpeakingRef.current && recognitionRef.current) {
                try { recognitionRef.current.start() } catch {}
              }
            }, 500)
          }
        }
      }

      if (!("speechSynthesis" in window)) {
        setTtsSupported(false)
      } else {
        // Voices load asynchronously in most browsers.
        // Listen for the voiceschanged event to know when they're ready.
        const synth = window.speechSynthesis
        const loadVoices = () => {
          const voices = synth.getVoices()
          if (voices.length > 0) {
            setVoicesLoaded(true)
          }
        }
        loadVoices() // Try immediately (works in Firefox)
        synth.addEventListener("voiceschanged", loadVoices)
        return () => synth.removeEventListener("voiceschanged", loadVoices)
      }
    }
  }, [])

  const resetInactivityTimers = useCallback(() => {
    if (groomingTimeoutRef.current) clearTimeout(groomingTimeoutRef.current)
    if (sleepingTimeoutRef.current) clearTimeout(sleepingTimeoutRef.current)

    // Jangan biarkan Miaw melamun/tidur selama radio nyala atau chat berlangsung.
    if (isRadioPlayingRef.current || isLoadingRef.current) return

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
      if (isLocalMode()) {
        await fetch(`/api/esp32?endpoint=${encodeURIComponent(endpoint)}&method=${method}`, {
          method: "POST",
        })
      } else {
        await supabase.from("miaw_commands").insert({
          endpoint,
          status: "pending"
        })
      }
    } catch {
      // ESP32 may be unreachable; silently fail
    }
  }, [])

  useScheduler(dispatchESP32Action)

  const handleManualLampToggle = useCallback(async (lampId: "lamp1" | "lamp2" | "lamp3") => {
    const endpoints = {
      lamp1: "/bedroom",
      lamp2: "/kitchen",
      lamp3: "/bathroom",
    }
    const endpoint = endpoints[lampId]
    try {
      if (isLocalMode()) {
        await fetch(`/api/esp32?endpoint=${encodeURIComponent(endpoint)}&method=POST`, {
          method: "POST",
        })
      } else {
        await supabase.from("miaw_commands").insert({
          endpoint,
          status: "pending"
        })
      }
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
          } catch {
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
      try { recognitionRef.current.stop() } catch {}
    }

    if (isMuted || !ttsSupported || typeof window === "undefined") {
      if (targetExpression && STATES[targetExpression]) {
        setActiveMiawState(targetExpression)
        expressionTimeoutRef.current = setTimeout(() => {
          setActiveMiawState(restingState())
          resetInactivityTimers()
          restartMicAfterSpeech()
        }, 2000)
      } else {
        setActiveMiawState(restingState())
        resetInactivityTimers()
        restartMicAfterSpeech()
      }
      return
    }
    
    try {
      const synth = window.speechSynthesis
      synth.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get voices — they should be loaded by now thanks to voiceschanged listener
      const voices = synth.getVoices()
      const idVoices = voices.filter(v => v.lang.includes("id"))
      
      // Prefer Google Indonesian voice for consistent, high-quality output
      const googleVoice = idVoices.find(v => v.name.toLowerCase().includes("google"))
      // Fallback: any female Indonesian voice
      const femaleVoice = idVoices.find(v =>
        v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("wanita")
      )
      
      if (googleVoice) {
        utterance.voice = googleVoice
      } else if (femaleVoice) {
        utterance.voice = femaleVoice
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
          setActiveMiawState(restingState())
        }

        expressionTimeoutRef.current = setTimeout(() => {
          setActiveMiawState(restingState())
          resetInactivityTimers()
          restartMicAfterSpeech()
        }, 2000)
      }

      utterance.onerror = () => {
        setActiveMiawState(restingState())
        resetInactivityTimers()
        restartMicAfterSpeech()
      }

      synth.speak(utterance)
    } catch (err) {
      console.warn("Speech Synthesis failed:", err)
      setActiveMiawState(restingState())
      resetInactivityTimers()
      restartMicAfterSpeech()
    }
  }, [isMuted, ttsSupported, voicesLoaded, resetInactivityTimers, playPop, ttsPitch, ttsRate, restartMicAfterSpeech, restingState])

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
          isOnline: deviceOnline,
          lastSeen: deviceLastSeen,
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
        actionFired = `Radio: ${data.media.toUpperCase()}`
        if (data.media === "play") radioRef.current?.play()
        if (data.media === "pause") radioRef.current?.pause()
        if (data.media === "next") radioRef.current?.next()
        if (data.media === "prev") radioRef.current?.prev()
      } else if (data.action?.endpoint) {
        // Guard defensif: jangan kirim aksi hardware saat perangkat offline.
        // Biarkan balasan jujur Miaw soal offline yang tampil, tanpa fake action.
        if (deviceOnline) {
          actionFired = `${data.action.method} ${data.action.endpoint}`
          dispatchESP32Action(data.action.endpoint, data.action.method)
        }
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
  }, [chatInput, isLoading, dispatchESP32Action, speakReply, telemetry, deviceOnline, deviceLastSeen])

  // Selalu update ref ke versi terbaru handleSendMessage
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  const toggleListening = useCallback(() => {
    playClick()
    if (!recognitionRef.current) return
    try {
      if (isContinuousMic) {
        // Turn OFF
        setIsContinuousMic(false)
        isContinuousMicRef.current = false
        isSpeakingRef.current = false
        try { recognitionRef.current?.stop() } catch {}
        setActiveMiawState(restingState())
        setIsListening(false)
      } else {
        // Turn ON
        setIsContinuousMic(true)
        isContinuousMicRef.current = true
        isSpeakingRef.current = false
        try { recognitionRef.current?.start() } catch {}
      }
      resetInactivityTimers()
    } catch (err) {
      console.warn("Failed to toggle speech recognition", err)
    }
  }, [isContinuousMic, isListening, resetInactivityTimers, restingState])

  const bgColors: Record<keyof typeof STATES, string> = {
    idleCalm: "bg-[#f4f4f0]",
    listening: "bg-blue-100",
    thinking: "bg-yellow-100",
    speaking: "bg-[#f4f4f0]",
    happy: "bg-green-100",
    confused: "bg-red-200",
    sleeping: "bg-[#bfdbfe]",
    grooming: "bg-purple-100",
    dancing: "bg-[#f4f4f0]",
    gaming: "bg-black"
  }

  if (!authChecked) return null

  if (!isAuthed) {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  if (isSessionLocked) {
    return <LobbyScreen activeDeviceName={activeDeviceName} onTakeOver={handleTakeOver} />
  }

  return (
    <>
      {/* Premium Gaming Overlay */}
      <AnimatePresence>
        {isGamingMode && <GamingOverlay />}
      </AnimatePresence>

      <div className={`min-h-screen flex flex-col font-sans selection:bg-black selection:text-white transition-colors duration-500 ${bgColors[activeMiawState]} dark:bg-zinc-950 relative`}>

      {/* Navigation */}
      <header className={`border-b-[4px] border-black bg-white dark:bg-zinc-900 sticky top-0 z-50 ${activeMiawState === 'gaming' ? 'pointer-events-none opacity-50' : ''}`}>
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
                onClick={() => setActiveView("radio")}
                className="flex items-center gap-2 border-[3px] border-black bg-[#60a5fa] px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#3b82f6] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Radio className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Open Miaw Radio</span>
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
            <Button variant="outline" size="icon" onClick={() => { playClick(); handleLogout() }} title="Logout" className="border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 hover:text-white dark:hover:bg-red-500">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={`flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 ${activeMiawState === 'gaming' ? 'pointer-events-none opacity-20 blur-sm' : ''}`}>
        
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
                    <Button
                      variant={showDashboard ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDashboard(!showDashboard)}
                      className={`font-black text-xs px-4 ml-2 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${showDashboard ? "bg-[#ffde43] text-black" : "hover:bg-zinc-100"}`}
                    >
                      {showDashboard ? "Hide Sensors" : "Show Sensors"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Dashboard Grid (ESP32 Live Telemetry) */}
            {showDashboard && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-[4px] border-black pb-2">
                <h2 className="text-2xl font-black uppercase tracking-wider text-black dark:text-white text-center sm:text-left">
                  ESP32 Dashboard Telemetry
                </h2>
                <span className={`flex items-center gap-2 self-center sm:self-auto border-[3px] border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${deviceOnline ? "bg-[#4ade80] text-black" : "bg-red-500 text-white"}`}>
                  <span className={`inline-block size-2 rounded-full ${deviceOnline ? "bg-black animate-pulse" : "bg-white"}`} />
                  {deviceOnline ? "Device Online" : "Device Offline"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Device Offline Banner */}
                {!deviceOnline && (
                  <div className="md:col-span-3 border-[3px] border-black bg-[#fbbf24] p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                    <ShieldAlert className="size-5 text-black shrink-0" />
                    <span className="font-bold text-sm text-black">
                      Perangkat ESP32 sedang offline. Nilai sensor di bawah adalah pembacaan terakhir dan mungkin sudah basi.
                    </span>
                  </div>
                )}

                {/* Climate Card */}
                <div className={`border-[4px] border-black bg-[#a78bfa] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-purple-900 dark:text-white flex flex-col justify-between transition-opacity ${!deviceOnline ? "opacity-60" : ""}`}>
                  <div>
                    <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase text-lg tracking-tight">DHT11 Climate</h3>
                        {!deviceOnline && (
                          <span className="border-[2px] border-black bg-red-400 text-black text-[9px] font-black uppercase px-1.5 py-0.5">Basi</span>
                        )}
                      </div>
                      <Thermometer className="size-6 text-black dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Temp</div>
                        <div className={`text-2xl sm:text-3xl font-black ${telemetryError || !telemetry ? "text-red-500" : "text-black dark:text-white"}`}>
                          {telemetryError || !telemetry
                            ? (!deviceOnline ? "OFFLINE" : "ERR")
                            : `${telemetry.temperature.toFixed(1)} \u00b0C`}
                        </div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Humidity</div>
                        <div className={`text-2xl sm:text-3xl font-black ${telemetryError || !telemetry ? "text-red-500" : "text-black dark:text-white"}`}>
                          {telemetryError || !telemetry
                            ? (!deviceOnline ? "OFFLINE" : "---")
                            : `${telemetry.humidity.toFixed(1)} %`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Light Sensor Card */}
                <div className={`border-[4px] border-black bg-[#4ade80] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-green-900 dark:text-white flex flex-col justify-between transition-opacity ${!deviceOnline ? "opacity-60" : ""}`}>
                  <div>
                    <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase text-lg tracking-tight">LDR Ambient</h3>
                        {!deviceOnline && (
                          <span className="border-[2px] border-black bg-red-400 text-black text-[9px] font-black uppercase px-1.5 py-0.5">Basi</span>
                        )}
                      </div>
                      <Sun className="size-6 text-black dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Intensity</div>
                        <div className={`text-2xl sm:text-3xl font-black ${telemetryError || !telemetry ? "text-red-500" : "text-black dark:text-white"}`}>
                          {telemetryError || !telemetry
                            ? (!deviceOnline ? "OFFLINE" : "ERR")
                            : `${telemetry.ldr} lx`}
                        </div>
                      </div>
                      <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                        <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Auto Mode</div>
                        <div className={`text-lg sm:text-xl font-black uppercase pt-1 ${telemetryError || !telemetry ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                          {telemetryError || !telemetry
                            ? (!deviceOnline ? "OFFLINE" : "ERR")
                            : "Active"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actuators Card */}
                <div className={`border-[4px] border-black bg-[#f472b6] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-pink-900 dark:text-white transition-opacity ${!deviceOnline ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black uppercase text-lg tracking-tight">Smart Lamps</h3>
                      {!deviceOnline && (
                        <span className="border-[2px] border-black bg-red-400 text-black text-[9px] font-black uppercase px-1.5 py-0.5">Basi</span>
                      )}
                    </div>
                    <Lightbulb className="size-6 text-black dark:text-white" />
                  </div>
                  <div className="space-y-3 font-bold text-sm">
                    <button onClick={() => handleManualLampToggle('lamp1')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 1 (Bedroom)</span>
                      {!telemetryError && telemetry?.lamps.lamp1 ? (
                        <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                      ) : (
                        <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                      )}
                    </button>
                    <button onClick={() => handleManualLampToggle('lamp2')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 2 (Kitchen)</span>
                      {!telemetryError && telemetry?.lamps.lamp2 ? (
                        <span className="text-xs font-black uppercase bg-green-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-green-950 dark:text-green-300">On</span>
                      ) : (
                        <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 text-black dark:bg-red-950 dark:text-red-300">Off</span>
                      )}
                    </button>
                    <button onClick={() => handleManualLampToggle('lamp3')} className="w-full flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800">
                      <span className="text-black dark:text-white">Lamp 3 (Bathroom)</span>
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
            )}
          </div>
        )}

        {/* Radio tetap mounted lintas view supaya audio & dancing tidak terputus */}
        <div className={activeView === "radio" ? "space-y-10" : "hidden"}>
            {/* Internet Radio Player */}
            <section className="flex flex-col items-center">
              <div className="w-full max-w-4xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col dark:bg-zinc-900">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="border-[3px] border-black bg-[#60a5fa] text-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Internet Radio Player
                    </span>
                    <span className="text-xs font-mono font-black uppercase text-zinc-500">
                      SomaFM Stream
                    </span>
                  </div>

                  <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
                    Miaw Radio
                  </h2>

                  <RadioPlayer ref={radioRef} onPlayingChange={handleRadioPlayingChange} />
                </div>

                <div className="border-t-[3px] border-black/10 pt-4 mt-8">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="size-4 text-black dark:text-white" />
                    <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400">
                      Free internet radio via SomaFM. Miaw can play, pause, and switch stations.
                    </span>
                  </div>
                </div>
              </div>
            </section>
        </div>
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
    </>
  )
}
