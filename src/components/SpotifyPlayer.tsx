"use client"

import { Music, ExternalLink, Search } from "lucide-react"

export interface SpotifyTrack {
  name: string
  artist: string
  albumArt: string
  uri: string
  externalUrl: string
}

interface SpotifyPlayerProps {
  track: SpotifyTrack | null
  isSearching?: boolean
}

export function SpotifyPlayer({ track, isSearching = false }: SpotifyPlayerProps) {
  return (
    <div className="w-full h-full text-[#9ee2ff] bg-black relative flex flex-col p-4 select-none border-4 border-black box-shadow-[4px_4px_0px_#000000]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1a2e_0%,_#050912_100%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#5ec8ff 1px, transparent 1px), linear-gradient(90deg, #5ec8ff 1px, transparent 1px)`,
          backgroundSize: "4px 4px",
        }}
      />
      
      <div className="relative z-10 flex-1 flex flex-col drop-shadow-[0_0_4px_#5ec8ff]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#5ec8ff]/30">
          <Music className="w-5 h-5" />
          <span className="font-mono text-sm font-bold tracking-widest uppercase">Spotify Search</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          {isSearching ? (
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <Search className="w-10 h-10" />
              <span className="font-mono text-sm">Mencari di Spotify...</span>
            </div>
          ) : track ? (
            <>
              {track.albumArt && (
                <img 
                  src={track.albumArt} 
                  alt={track.name} 
                  className="w-24 h-24 object-cover border-2 border-[#5ec8ff]"
                />
              )}
              <div>
                <h3 className="font-mono font-bold text-lg leading-tight line-clamp-1">{track.name}</h3>
                <p className="font-mono text-sm opacity-80">{track.artist}</p>
              </div>
              
              <a 
                href={track.uri}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#5ec8ff] text-black font-mono font-bold text-sm hover:bg-white transition-colors active:scale-95"
              >
                <span>Buka di Spotify</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-60">
              <Music className="w-10 h-10" />
              <span className="font-mono text-xs tracking-widest uppercase">Idle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
