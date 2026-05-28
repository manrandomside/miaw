import { useCallback, useRef } from 'react'

export function useSFX() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playClick = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05)

    gainNode.gain.setValueAtTime(1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }, [])

  const playPop = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }, [])

  return { playClick, playPop }
}
