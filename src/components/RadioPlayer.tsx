"use client"

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react"
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react"
import { Miaw } from "@/components/Miaw"

interface Station {
  name: string
  desc: string
  url: string
  altUrl: string
}

// Edit daftar stasiun di sini. SomaFM streaming gratis via https.
const STATIONS: Station[] = [
  {
    name: "Lush",
    desc: "Mellow vocals & electronic",
    url: "https://ice5.somafm.com/lush-128-mp3",
    altUrl: "https://ice3.somafm.com/lush-128-mp3",
  },
  {
    name: "Fluid",
    desc: "Instrumental hiphop / lofi",
    url: "https://ice5.somafm.com/fluid-128-mp3",
    altUrl: "https://ice3.somafm.com/fluid-128-mp3",
  },
  {
    name: "Deep Space One",
    desc: "Ambient & space (fokus)",
    url: "https://ice5.somafm.com/deepspaceone-128-mp3",
    altUrl: "https://ice3.somafm.com/deepspaceone-128-mp3",
  },
]

export interface RadioPlayerHandle {
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
}

interface RadioPlayerProps {
  className?: string
  onPlayingChange?: (playing: boolean) => void
}

export const RadioPlayer = forwardRef<RadioPlayerHandle, RadioPlayerProps>(
  function RadioPlayer({ className, onPlayingChange }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [stationIndex, setStationIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [usingAlt, setUsingAlt] = useState(false)
    const triedAltRef = useRef(false)
    const isPlayingRef = useRef(false)

    const station = STATIONS[stationIndex]
    const currentUrl = usingAlt ? station.altUrl : station.url

    useEffect(() => {
      isPlayingRef.current = isPlaying
    }, [isPlaying])

    // Autoplay browser bisa menolak play(); tangkap supaya tidak crash dan
    // jatuh ke keadaan paused yang wajar.
    const attemptPlay = useCallback(() => {
      const audio = audioRef.current
      if (!audio) return
      const result = audio.play()
      if (result !== undefined) {
        result.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      }
    }, [])

    // Saat URL stasiun berganti, muat ulang dan lanjut play bila sebelumnya play.
    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return
      audio.src = currentUrl
      audio.load()
      if (isPlayingRef.current) attemptPlay()
    }, [currentUrl, attemptPlay])

    useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume
    }, [volume])

    useEffect(() => {
      onPlayingChange?.(isPlaying)
    }, [isPlaying, onPlayingChange])

    const play = useCallback(() => {
      isPlayingRef.current = true
      attemptPlay()
    }, [attemptPlay])

    const pause = useCallback(() => {
      isPlayingRef.current = false
      audioRef.current?.pause()
      setIsPlaying(false)
    }, [])

    const changeStation = useCallback((dir: 1 | -1) => {
      triedAltRef.current = false
      setUsingAlt(false)
      setStationIndex((prev) => (prev + dir + STATIONS.length) % STATIONS.length)
    }, [])

    const next = useCallback(() => changeStation(1), [changeStation])
    const prev = useCallback(() => changeStation(-1), [changeStation])

    // Jika stream utama gagal, coba altUrl sekali sebelum menyerah.
    const handleError = useCallback(() => {
      if (!triedAltRef.current && !usingAlt) {
        triedAltRef.current = true
        setUsingAlt(true)
      } else {
        setIsPlaying(false)
      }
    }, [usingAlt])

    useImperativeHandle(ref, () => ({ play, pause, next, prev }), [play, pause, next, prev])

    const togglePlay = () => {
      if (isPlaying) pause()
      else play()
    }

    return (
      <div className={`w-full ${className ?? ""}`}>
        <audio ref={audioRef} preload="none" onError={handleError} />

        {/* Screen */}
        <div className="border-[4px] border-black bg-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1a2e_0%,_#050912_100%)] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4 text-[#9ee2ff] drop-shadow-[0_0_4px_#5ec8ff]">
            <div className="w-24 h-16 shrink-0">
              <Miaw state={isPlaying ? "dancing" : "idleCalm"} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  {isPlaying ? "On Air" : "Paused"}
                </span>
                {isPlaying && (
                  <span className="inline-block size-2 rounded-full bg-[#5ec8ff] animate-pulse" />
                )}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight truncate">
                {station.name}
              </h3>
              <p className="text-sm font-bold opacity-80 truncate">{station.desc}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={prev}
            title="Stasiun sebelumnya"
            className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800 dark:text-white"
          >
            <SkipBack className="size-5" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? "Jeda" : "Putar"}
            className="border-[3px] border-black bg-[#ffde43] p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-[#fcd34d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>

          <button
            onClick={next}
            title="Stasiun berikutnya"
            className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-zinc-800 dark:text-white"
          >
            <SkipForward className="size-5" />
          </button>

          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:ml-auto mt-2 sm:mt-0 dark:bg-zinc-800">
            <Volume2 className="size-5 text-black dark:text-white shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full sm:w-32 accent-black dark:accent-white"
              title="Volume"
            />
          </div>
        </div>

        {/* Station list */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATIONS.map((s, idx) => {
            const isActive = idx === stationIndex
            return (
              <button
                key={s.name}
                onClick={() => {
                  triedAltRef.current = false
                  setUsingAlt(false)
                  setStationIndex(idx)
                }}
                className={`border-[3px] border-black p-3 text-left transition-all ${
                  isActive
                    ? "bg-[#60a5fa] text-black translate-x-[2px] translate-y-[2px] shadow-none"
                    : "bg-white text-black hover:bg-[#f4f4f0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800 dark:text-white"
                }`}
              >
                <span className="block text-sm font-black uppercase truncate">{s.name}</span>
                <span className="block text-xs font-bold opacity-70 truncate">{s.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)
