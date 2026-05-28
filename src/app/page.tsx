"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Miaw, STATES } from "@/components/Miaw"
import { SpotifyPlayer, DEMO_SONGS } from "@/components/SpotifyPlayer"
import {
  Cpu,
  Wifi,
  Settings,
  Thermometer,
  Sun,
  Lightbulb,
  ShieldAlert,
  Play,
  Pause,
  Music,
  Sliders,
  Volume2
} from "lucide-react"

export default function Home() {
  const [activeMiawState, setActiveMiawState] = useState<keyof typeof STATES>("idleCalm")
  const [activeSpotifyMode, setActiveSpotifyMode] = useState<"intro" | "playing" | "paused" | "noSong" | "changing">("playing")
  const [songIndex, setSongIndex] = useState(0)
  const [animSpeed, setAnimSpeed] = useState(1.0)
  const [animate, setAnimate] = useState(true)

  const activeStateCfg = STATES[activeMiawState] || STATES.idleCalm

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
            <div className="flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-black dark:text-white">
              <span className="inline-block size-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-black dark:text-white">Console Online</span>
            </div>
            <Button variant="outline" size="xs">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Core Layout: 2-Column Grid for AI & Media */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: AI Assistant ("Miaw") */}
          <div className="border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between dark:bg-zinc-900">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="border-[3px] border-black bg-[#ffde43] text-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  AI Assistant Mascot
                </span>
                <span className="text-xs font-mono font-black uppercase text-zinc-500">
                  SSD1306 Preview
                </span>
              </div>

              <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
                Miaw Character
              </h2>

              {/* Styled OLED Screen Viewport */}
              <div className="border-[4px] border-black bg-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative h-48 flex items-center justify-center overflow-hidden">
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

              {/* State Details Readout */}
              <div className="border-[3px] border-black bg-[#f4f4f0] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800 dark:border-white">
                <h3 className="font-black text-sm uppercase border-b-2 border-black/10 pb-1 mb-2 text-black dark:text-white">
                  Inspecting state: <span className="text-blue-600 dark:text-blue-400">{activeStateCfg.label}</span>
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="block text-zinc-400 uppercase text-[10px]">Triggered By</span>
                    <span className="text-black dark:text-white">{activeStateCfg.trigger}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 uppercase text-[10px]">Animation Hint</span>
                    <span className="text-black dark:text-white">{activeStateCfg.anim}</span>
                  </div>
                </dl>
              </div>

              {/* State Manual Controllers */}
              <div className="space-y-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  Manual State Triggers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(STATES) as Array<keyof typeof STATES>).map((stateKey) => {
                    const isSelected = activeMiawState === stateKey
                    return (
                      <Button
                        key={stateKey}
                        variant={isSelected ? "default" : "outline"}
                        size="xs"
                        onClick={() => setActiveMiawState(stateKey)}
                        className={`font-black text-[10px] tracking-wide h-8 ${
                          isSelected ? "bg-[#ffde43] text-black" : ""
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
                  size="xs"
                  onClick={() => setAnimSpeed(0.5)}
                  className="font-black text-xs h-7 px-2"
                >
                  0.5x
                </Button>
                <Button
                  variant={animSpeed === 1.0 ? "default" : "outline"}
                  size="xs"
                  onClick={() => setAnimSpeed(1.0)}
                  className="font-black text-xs h-7 px-2"
                >
                  1.0x
                </Button>
                <Button
                  variant={animSpeed === 1.8 ? "default" : "outline"}
                  size="xs"
                  onClick={() => setAnimSpeed(1.8)}
                  className="font-black text-xs h-7 px-2"
                >
                  1.8x
                </Button>
                <Button
                  variant={animate ? "default" : "outline"}
                  size="xs"
                  onClick={() => setAnimate(!animate)}
                  className={`font-black text-xs h-7 px-3 ${animate ? "bg-[#ffde43] text-black" : ""}`}
                >
                  {animate ? "Pause" : "Play"}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Spotify Lyrics Player */}
          <div className="border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between dark:bg-zinc-900">
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
              <div className="border-[4px] border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-48 flex items-center justify-center">
                <SpotifyPlayer
                  mode={activeSpotifyMode}
                  songIndex={songIndex}
                  speed={animSpeed}
                />
              </div>

              {/* Spotify Track Picker */}
              <div className="space-y-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <Music className="size-4" />
                  Select Demo Track
                </h3>
                <div className="space-y-2">
                  {DEMO_SONGS.map((song, idx) => {
                    const isSelected = songIndex === idx
                    return (
                      <button
                        key={idx}
                        onClick={() => setSongIndex(idx)}
                        className={`w-full flex items-center justify-between p-3 border-[3px] border-black text-left font-mono font-bold transition-all ${
                          isSelected
                            ? "bg-[#60a5fa] text-black translate-x-[2px] translate-y-[2px] shadow-none"
                            : "bg-white text-black hover:bg-[#f4f4f0] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800 dark:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs opacity-50">0{idx + 1}</span>
                          <div>
                            <span className="block text-sm uppercase font-black">{song.title}</span>
                            <span className="block text-[10px] opacity-60">{song.artist}</span>
                          </div>
                        </div>
                        <span className="text-xs opacity-75">
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Spotify Screen Mode Controllers */}
              <div className="space-y-3 pt-2">
                <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  Spotify Screen Mode Triggers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(["playing", "paused", "noSong", "changing", "intro"] as const).map((mode) => {
                    const isSelected = activeSpotifyMode === mode
                    return (
                      <Button
                        key={mode}
                        variant={isSelected ? "default" : "outline"}
                        size="xs"
                        onClick={() => setActiveSpotifyMode(mode)}
                        className={`font-black text-xs px-3 h-8 uppercase ${
                          isSelected ? "bg-[#60a5fa] text-black" : ""
                        }`}
                      >
                        {mode === "noSong" ? "No Song" : mode}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="border-t-[3px] border-black/10 pt-4 mt-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-4 text-black dark:text-white" />
                <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  Simulated local client mode only. Requires ESP32 for hardware projection.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid (ESP32 Live Telemetry) */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-wider border-b-[4px] border-black pb-2 text-black dark:text-white">
            ESP32 Dashboard Telemetry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Climate Card */}
            <div className="border-[4px] border-black bg-[#a78bfa] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-purple-900 dark:text-white">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-black uppercase text-lg tracking-tight">DHT11 Climate</h3>
                <Thermometer className="size-6 text-black dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Temp</div>
                  <div className="text-3xl font-black text-black dark:text-white">24.5 &deg;C</div>
                </div>
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Humidity</div>
                  <div className="text-3xl font-black text-black dark:text-white">62.0 %</div>
                </div>
              </div>
            </div>

            {/* Light Sensor Card */}
            <div className="border-[4px] border-black bg-[#4ade80] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-green-900 dark:text-white">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-black uppercase text-lg tracking-tight">LDR Ambient</h3>
                <Sun className="size-6 text-black dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Intensity</div>
                  <div className="text-3xl font-black text-black dark:text-white">350 lx</div>
                </div>
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Auto Mode</div>
                  <div className="text-xl font-black uppercase pt-1 text-green-600 dark:text-green-400">Active</div>
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
              </div>
            </div>
          </div>
        </section>
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
