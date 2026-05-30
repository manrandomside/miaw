"use client"

import Image from "next/image"
import { ArrowRight, Bot, Cpu, Zap } from "lucide-react"
import { Miaw } from "@/components/Miaw"
import { useSFX } from "@/hooks/useSFX"

interface LandingPageProps {
  onLoginClick: () => void
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const { playClick } = useSFX()

  return (
    <div className="min-h-screen bg-[#ffde43] font-sans selection:bg-black selection:text-white">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navigation */}
      <nav className="relative border-b-[4px] border-black bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black border-[3px] border-black p-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-12 h-12 flex items-center justify-center overflow-hidden">
              <div className="w-[130%] h-[130%] text-[#ffde43] flex items-center justify-center pt-2">
                <Miaw state="idleCalm" animSpeed={1} animate={true} />
              </div>
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase tracking-wider text-black leading-none">
                Miaw // Hub
              </h1>
            </div>
          </div>
          <button
            onClick={() => { playClick(); onLoginClick(); }}
            className="hidden sm:flex items-center gap-2 bg-[#4ade80] border-[3px] border-black px-6 py-2.5 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#22c55e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Akses Panel <ArrowRight className="size-4" />
          </button>
        </div>
      </nav>

      {/* Marquee Section */}
      <div className="relative border-b-[4px] border-black bg-[#fca5a5] py-2 overflow-hidden z-10 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="whitespace-nowrap flex font-black uppercase text-sm tracking-widest text-black animate-marquee">
          {/* We duplicate the content to make the infinite scroll smooth */}
          <span className="inline-block px-4">
            ESP32 LINKED &bull; MQTT TELEMETRY &bull; SUPABASE REALTIME &bull; LLM POWERED &bull; DIGITAL PET &bull; ESP32 LINKED &bull; MQTT TELEMETRY &bull; SUPABASE REALTIME &bull; LLM POWERED &bull; DIGITAL PET &bull;
          </span>
          <span className="inline-block px-4">
            ESP32 LINKED &bull; MQTT TELEMETRY &bull; SUPABASE REALTIME &bull; LLM POWERED &bull; DIGITAL PET &bull; ESP32 LINKED &bull; MQTT TELEMETRY &bull; SUPABASE REALTIME &bull; LLM POWERED &bull; DIGITAL PET &bull;
          </span>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 bg-white border-[3px] border-black px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="font-black text-xs uppercase tracking-widest">Project In Active Development</span>
            </div>
            <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-[1.1] text-black">
              Meet Miaw, <br />
              <span className="bg-white px-2 mt-2 inline-block border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                The Digital Pet.
              </span>
            </h2>
            <p className="text-xl font-bold max-w-xl text-black/80">
              Lebih dari sekadar layar pintar. Miaw adalah asisten rumah berbasis Neo-Brutalism dengan integrasi ESP32 dan LLM yang interaktif, ekspresif, dan hidup.
            </p>
            <button
              onClick={() => { playClick(); onLoginClick(); }}
              className="flex items-center justify-center w-full sm:w-auto gap-3 bg-black text-white border-[4px] border-black px-8 py-4 font-black uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Mulai Interaksi <ArrowRight className="size-6" />
            </button>
          </div>
          
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square bg-[#a78bfa] border-[6px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col items-center justify-center transform lg:rotate-3 transition-transform hover:rotate-0">
               {/* Decorative elements */}
               <div className="absolute top-4 left-4 size-3 bg-black rounded-full" />
               <div className="absolute top-4 right-4 size-3 bg-black rounded-full" />
               <div className="absolute bottom-4 left-4 size-3 bg-black rounded-full" />
               <div className="absolute bottom-4 right-4 size-3 bg-black rounded-full" />
               
               <div className="w-[140%] h-[140%] text-black flex items-center justify-center mb-6 pt-4">
                 <Miaw state="idleCalm" animSpeed={1} animate={true} />
               </div>
               <div className="mt-8 bg-white border-[3px] border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-2xl uppercase">
                 ONLINE
               </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#fca5a5] border-[3px] border-black size-12 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
              <Cpu className="size-6 text-black" />
            </div>
            <h3 className="font-black text-xl uppercase mb-3">ESP32 Hardware</h3>
            <p className="font-bold text-sm text-zinc-700 leading-relaxed">
              Ditenagai oleh ESP32 dengan kontrol relai, sensor suhu/kelembaban DHT11, dan sensor cahaya LDR untuk kontrol rumah pintar sesungguhnya.
            </p>
          </div>
          <div className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#60a5fa] border-[3px] border-black size-12 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
              <Bot className="size-6 text-black" />
            </div>
            <h3 className="font-black text-xl uppercase mb-3">AI Powered</h3>
            <p className="font-bold text-sm text-zinc-700 leading-relaxed">
              Mampu diajak mengobrol dan merespons dengan emosi cerdas berkat integrasi Large Language Models super cepat.
            </p>
          </div>
          <div className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#4ade80] border-[3px] border-black size-12 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
              <Zap className="size-6 text-black" />
            </div>
            <h3 className="font-black text-xl uppercase mb-3">Live Ekspresi</h3>
            <p className="font-bold text-sm text-zinc-700 leading-relaxed">
              Animasi wajah interaktif tanpa jeda berkat protokol MQTT, disinkronkan secara *real-time* ke layar OLED fisik.
            </p>
          </div>
        </div>

        {/* Hardware Gallery */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black bg-white inline-block px-4 py-2 border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Hardware Preview
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-[4px] border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
              <div className="relative aspect-[4/3] w-full border-[3px] border-black overflow-hidden bg-zinc-200 flex items-center justify-center">
                <Image 
                  src="/images/miaw-hw-1.jpeg" 
                  alt="Miaw Hardware 1" 
                  fill 
                  className="object-cover" 
                  unoptimized // Kita mematikan optimasi next/image secara default jika image ini bukan format standar
                />
              </div>
            </div>
            <div className="bg-white border-[4px] border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
              <div className="relative aspect-[4/3] w-full border-[3px] border-black overflow-hidden bg-zinc-200 flex items-center justify-center">
                <Image 
                  src="/images/miaw-hw-2.jpeg" 
                  alt="Miaw Hardware 2" 
                  fill 
                  className="object-cover"
                  unoptimized 
                />
              </div>
            </div>
            <div className="bg-white border-[4px] border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
              <div className="relative aspect-[4/3] w-full border-[3px] border-black overflow-hidden bg-zinc-200 flex items-center justify-center">
                <Image 
                  src="/images/miaw-hw-3.jpeg" 
                  alt="Miaw Hardware 3" 
                  fill 
                  className="object-cover"
                  unoptimized 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Development Disclaimer */}
        <div className="bg-black text-white border-[4px] border-black p-8 sm:p-12 shadow-[8px_8px_0px_0px_#fca5a5]">
          <h2 className="text-2xl sm:text-4xl font-black uppercase mb-4">Misi Jangka Panjang</h2>
          <p className="text-lg font-bold opacity-90 max-w-3xl leading-relaxed">
            Project Miaw tidak akan berhenti sampai di sini. Kami akan terus melakukan penambahan fitur secara berkelanjutan—mulai dari integrasi sensor IoT baru, pembaruan kerangka kerja AI, hingga perombakan antarmuka yang lebih ekstrim. Bersiaplah untuk menyaksikan Miaw tumbuh menjadi asisten rumah masa depan.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative border-t-[4px] border-black bg-white z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-black text-sm uppercase">&copy; 2026 Miaw Smart Home Hub.</span>
          <div className="flex gap-4">
            <span className="font-bold text-xs uppercase bg-black text-white px-3 py-1">ESP32 Linked</span>
            <span className="font-bold text-xs uppercase bg-[#4ade80] text-black border-[2px] border-black px-3 py-1">Live WebSockets</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
