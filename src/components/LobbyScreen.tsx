"use client"

import { Cat, AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LobbyScreenProps {
  activeDeviceName: string
  onTakeOver: () => void
}

export function LobbyScreen({ activeDeviceName, onTakeOver }: LobbyScreenProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#ffde43] p-4 font-sans">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-400 border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full">
            <AlertTriangle className="size-10 text-black" />
          </div>
        </div>

        <h1 className="font-black text-2xl uppercase tracking-wider text-black leading-tight mb-2">
          Sesi Terkunci
        </h1>
        
        <p className="text-sm font-bold text-black/70 mb-4 border-[2px] border-black p-3 bg-red-100">
          Miaw saat ini sedang dikontrol oleh:
          <br/>
          <span className="block mt-2 text-lg text-black bg-white border-[2px] border-black py-1 px-2">
            {activeDeviceName}
          </span>
        </p>

        <Button 
          onClick={onTakeOver}
          className="w-full h-14 bg-red-500 hover:bg-red-600 text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none gap-2 text-base font-black uppercase transition-all mt-4"
        >
          <LogOut className="size-5" />
          Logout All & Ambil Alih
        </Button>
        
        <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Tindakan ini akan memutus paksa perangkat sebelumnya.
        </p>
      </div>
    </div>
  )
}
