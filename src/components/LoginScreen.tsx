"use client"

import { useState } from "react"
import { Cat, Lock, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MIAW_CREDENTIALS } from "@/lib/auth"

interface LoginScreenProps {
  onSuccess: () => void
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      username.trim() === MIAW_CREDENTIALS.username &&
      password === MIAW_CREDENTIALS.password
    ) {
      setError(null)
      onSuccess()
    } else {
      setError("Username atau password salah.")
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#ffde43] p-4 font-sans">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 border-b-[4px] border-black pb-4 mb-6">
          <div className="bg-black border-[3px] border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-12 h-12 flex items-center justify-center">
            <Cat className="size-7 text-[#ffde43]" />
          </div>
          <div>
            <h1 className="font-black text-2xl uppercase tracking-wider text-black leading-none">
              Miaw // Hub
            </h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Restricted Access
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Username
            </label>
            <div className="flex items-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus-within:bg-[#fffef5]">
              <User className="size-5 mx-3 text-black shrink-0" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                placeholder="miaw123"
                className="flex-1 w-full min-w-0 bg-transparent py-2.5 pr-3 text-base font-bold text-black placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Password
            </label>
            <div className="flex items-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus-within:bg-[#fffef5]">
              <Lock className="size-5 mx-3 text-black shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="flex-1 w-full min-w-0 bg-transparent py-2.5 pr-3 text-base font-bold text-black placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="border-[3px] border-black bg-red-300 px-3 py-2 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base gap-2">
            Masuk
            <ArrowRight className="size-5" />
          </Button>
        </form>

        <p className="mt-5 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Login wajib untuk mengontrol Miaw
        </p>
      </div>
    </div>
  )
}
