/**
 * Hybrid Connection Mode Detector
 * 
 * Mendeteksi otomatis apakah website sedang berjalan di:
 * - LOCAL (localhost:3000) → Komunikasi langsung ke ESP32 (INSTAN)
 * - CLOUD (Vercel/hosting) → Komunikasi via Supabase Database (REMOTE)
 */

export function isLocalMode(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}
