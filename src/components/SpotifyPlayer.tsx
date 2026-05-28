"use client"

import { useId, useState, useEffect } from "react"
import { Music, Play, Pause, Volume2 } from "lucide-react"

export interface LyricLine {
  t: number
  text: string
}

export interface Song {
  title: string
  artist: string
  duration: number
  startOffset: number
  lyrics: LyricLine[]
}

export const DEMO_SONGS: Song[] = [
  {
    title: "paper stars",
    artist: "demo - long lyric set",
    duration: 215,
    startOffset: 12,
    lyrics: [
      { t: 0,   text: "instrumental intro" },
      { t: 12,  text: "we used to talk about the moon" },
      { t: 19,  text: "and pretend we would reach it someday" },
      { t: 26,  text: "you painted skies on paper stars" },
      { t: 33,  text: "and hung them where the daylight stays" },
      { t: 40,  text: "silent moments passing by" },
      { t: 46,  text: "the wind remembers every word" },
      { t: 53,  text: "the way you laughed beneath the trees" },
      { t: 60,  text: "and i still hear your favorite song" },
      { t: 67,  text: "in every quiet evening breeze" },
      { t: 75,  text: "somewhere out beyond the night" },
      { t: 82,  text: "we left a trail of paper stars" },
      { t: 90,  text: "a story drawn in pencil light" },
      { t: 97,  text: "in every place that you have been" },
      { t: 105, text: "- bridge section -" },
      { t: 112, text: "maybe time will write us back" },
      { t: 119, text: "into a softer afternoon" },
    ],
  },
  {
    title: "bintang malam",
    artist: "demo - short lyric set",
    duration: 228,
    startOffset: 8,
    lyrics: [
      { t: 0,  text: "intro music" },
      { t: 8,  text: "di langit luas" },
      { t: 14, text: "cahaya menari" },
      { t: 20, text: "kunyanyikan ini" },
      { t: 26, text: "di tengah hening" },
      { t: 33, text: "bisikkan, dengar" },
      { t: 40, text: "angin bernyanyi" },
      { t: 46, text: "pelan, tanpa kata" },
      { t: 53, text: "tetap nyata kau" },
      { t: 60, text: "- interlude -" },
      { t: 68, text: "di malam yang sama" },
      { t: 75, text: "kuingat senyummu" },
    ],
  },
  {
    title: "kawaii boogie",
    artist: "demo - mixed length",
    duration: 150,
    startOffset: 4,
    lyrics: [
      { t: 0,  text: "get ready to dance" },
      { t: 4,  text: "tiptoe tiptoe miaw" },
      { t: 9,  text: "dance the kawaii way tonight" },
      { t: 14, text: "jingle, jingle bell" },
      { t: 19, text: "all night, all day, all right" },
      { t: 25, text: "paws up paws down" },
      { t: 30, text: "do not have a frown around" },
      { t: 36, text: "spin around, miaw" },
    ],
  },
]

export const fmtTime = (s: number): string => {
  if (s < 0) s = 0
  const m = Math.floor(s / 60).toString().padStart(2, "0")
  const sec = Math.floor(s % 60).toString().padStart(2, "0")
  return `${m}:${sec}`
}

interface MarqueeTextProps {
  text: string
  cx: number
  y: number
  width: number
  fontSize: number
  weight?: number
  opacity?: number
  t: number
  clipId: string
}

function MarqueeText({
  text,
  cx,
  y,
  width,
  fontSize,
  weight = 600,
  opacity = 1,
  t,
  clipId,
}: MarqueeTextProps) {
  const charW = fontSize * 0.56
  const textW = text.length * charW
  const overflow = textW - width

  if (overflow <= 0) {
    return (
      <text
        x={cx}
        y={y}
        fontSize={fontSize}
        className="font-mono"
        fontWeight={weight}
        fill="currentColor"
        textAnchor="middle"
        opacity={opacity}
        style={{ letterSpacing: "-0.005em" }}
      >
        {text}
      </text>
    )
  }

  const speed = 14
  const travel = overflow + 8
  const scrollDur = travel / speed
  const pauseDur = 1.0
  const cycle = scrollDur * 2 + pauseDur * 2
  const p = (t % cycle) / cycle
  let off = 0
  const s1 = scrollDur / cycle
  const p1 = s1 + pauseDur / cycle
  const s2 = p1 + scrollDur / cycle

  if (p < s1) off = (p / s1) * travel
  else if (p < p1) off = travel
  else if (p < s2) off = travel - ((p - p1) / s1) * travel
  else off = 0

  const leftEdge = cx - width / 2
  const xPos = leftEdge - off

  return (
    <g clipPath={`url(#${clipId})`}>
      <text
        x={xPos}
        y={y}
        fontSize={fontSize}
        className="font-mono"
        fontWeight={weight}
        fill="currentColor"
        textAnchor="start"
        opacity={opacity}
        style={{ letterSpacing: "-0.005em" }}
      >
        {text}
      </text>
    </g>
  )
}

interface MiniMiawProps {
  cx: number
  cy: number
  t: number
  mode?: "intro" | "playing" | "paused" | "noSong" | "changing"
}

function MiniMiaw({ cx, cy, t, mode = "playing" }: MiniMiawProps) {
  const isHappy = mode === "playing" || mode === "changing" || mode === "intro"
  const isPaused = mode === "paused"
  const isSleepy = mode === "noSong"

  let bob = 0
  let tilt = 0
  let sway = 0
  let eyes = "happy"
  let blinkExtra = false

  if (isHappy) {
    bob = Math.sin(t * 2 * Math.PI * 1.0) * 1.0
    tilt = Math.sin(t * 2 * Math.PI * 0.35) * 4
    sway = Math.cos(t * 2 * Math.PI * 0.5) * 0.6
    eyes = "happy"
    if (Math.floor(t * 0.25) % 3 === 0 && (t * 0.25) % 1 > 0.6 && (t * 0.25) % 1 < 0.75) {
      eyes = "open"
    }
  } else if (isPaused) {
    eyes = "open"
    blinkExtra = Math.floor(t * 1.5) % 8 === 0
  } else if (isSleepy) {
    eyes = "sleep"
    bob = Math.sin(t * 0.6 * Math.PI) * 0.4
  }

  return (
    <g transform={`translate(${cx + sway} ${cy + bob}) rotate(${tilt})`}>
      <path d="M -5.5 -3 L -3.5 -6.5 L -1.5 -3 Z" fill="currentColor" />
      <path d="M 1.5 -3 L 3.5 -6.5 L 5.5 -3 Z" fill="currentColor" />
      <path
        d="M -6.5 -2 Q -6.5 -4.2 -4.5 -4.2 L 4.5 -4.2 Q 6.5 -4.2 6.5 -2 L 6.5 2.2 Q 6.5 4.2 4.5 4.7 Q 0 5.7 -4.5 4.7 Q -6.5 4.2 -6.5 2 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinejoin="round"
      />
      {eyes === "happy" && !blinkExtra && (
        <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none">
          <path d="M -3.6 0.4 Q -2.6 -1 -1.5 0.4" />
          <path d="M 1.5 0.4 Q 2.6 -1 3.6 0.4" />
        </g>
      )}
      {eyes === "open" && !blinkExtra && (
        <g fill="currentColor">
          <circle cx="-2.6" cy="0" r="0.85" />
          <circle cx="2.6" cy="0" r="0.85" />
          <circle cx="-2.3" cy="-0.35" r="0.32" fill="white" />
          <circle cx="2.9" cy="-0.35" r="0.32" fill="white" />
        </g>
      )}
      {eyes === "sleep" && (
        <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none">
          <path d="M -3.4 0 Q -2.6 1.1 -1.6 0" />
          <path d="M 1.6 0 Q 2.6 1.1 3.4 0" />
        </g>
      )}
      {blinkExtra && (
        <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round">
          <line x1="-3.3" y1="0" x2="-1.7" y2="0" />
          <line x1="1.7" y1="0" x2="3.3" y2="0" />
        </g>
      )}
      {isHappy ? (
        <path d="M -1.3 1.8 Q 0 3.3 1.3 1.8" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      ) : (
        <path d="M -1 2 Q 0 2.9 1 2" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      )}
      <line x1="-6.5" y1="0.8" x2="-9" y2="0.2" stroke="currentColor" strokeWidth="0.4" />
      <line x1="-6.5" y1="2.0" x2="-9" y2="2.2" stroke="currentColor" strokeWidth="0.4" />
      <line x1="6.5" y1="0.8" x2="9" y2="0.2" stroke="currentColor" strokeWidth="0.4" />
      <line x1="6.5" y1="2.0" x2="9" y2="2.2" stroke="currentColor" strokeWidth="0.4" />
    </g>
  )
}

interface FloatingNotesProps {
  cx: number
  cy: number
  t: number
  count?: number
  active?: boolean
}

function FloatingNotes({ cx, cy, t, count = 3, active = true }: FloatingNotesProps) {
  if (!active) return null
  const notes = []
  for (let i = 0; i < count; i++) {
    const cycleDur = 3.2
    const phase = ((t + i * (cycleDur / count)) % cycleDur) / cycleDur
    if (phase < 0.05 || phase > 0.98) continue
    const y = cy - phase * 14
    const x = cx + Math.sin(phase * 6 + i) * 3.5
    const opacity = phase < 0.15 ? phase / 0.15 : (1 - phase) * 0.95
    notes.push(
      <g key={i} transform={`translate(${x - 1} ${y - 2}) scale(0.6)`} opacity={opacity} fill="currentColor">
        <path d="M1 4 A1 1 0 1 1 0 3 L0 0 L2 -0.5 L2 2 L1 2 Z" />
      </g>
    )
  }
  return <g>{notes}</g>
}

interface WaveBarsProps {
  x: number
  y: number
  t: number
  speed?: number
  mode?: "intro" | "playing" | "paused" | "noSong" | "changing"
}

function WaveBars({ x, y, t, speed = 1, mode = "playing" }: WaveBarsProps) {
  const COUNT = 9
  const bars = []
  const live = mode === "playing" || mode === "changing"
  for (let i = 0; i < COUNT; i++) {
    const phase = i * 0.7
    let h = 1
    if (live) {
      h = 1 + (Math.sin(t * speed * 4 + phase) * 0.5 + 0.5) * 4.2 + Math.sin(t * speed * 7 + i) * 0.5
    } else if (mode === "paused") {
      h = 1
    } else {
      h = 1 + Math.sin(t * 0.8 + phase) * 0.4
    }
    h = Math.max(1, h)
    bars.push(
      <rect key={i} x={x + i * 2.3} y={y - h} width="1.4" height={h} fill="currentColor" />
    )
  }
  return <g opacity={mode === "paused" ? 0.5 : 1}>{bars}</g>
}

function LeafIcon({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="currentColor" />
      <path
        d={`M ${size * 0.18} ${size * 0.36} Q ${size * 0.5} ${size * 0.26} ${size * 0.84} ${size * 0.42}`}
        stroke="black"
        strokeWidth={size * 0.11}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${size * 0.22} ${size * 0.55} Q ${size * 0.5} ${size * 0.48} ${size * 0.78} ${size * 0.6}`}
        stroke="black"
        strokeWidth={size * 0.1}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${size * 0.27} ${size * 0.7} Q ${size * 0.5} ${size * 0.65} ${size * 0.71} ${size * 0.74}`}
        stroke="black"
        strokeWidth={size * 0.09}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}

function findLyricIndex(song: Song, time: number): number {
  let i = 0
  for (let k = 0; k < song.lyrics.length; k++) {
    if (time >= song.lyrics[k].t) i = k
    else break
  }
  return i
}

function IntroOverlay({ t }: { t: number }) {
  const CYCLE = 5.5
  const p = t % CYCLE
  let logoScale = 0
  let logoOpacity = 0
  let textOpacity = 0
  let overlayOpacity = 1

  if (p < 1.5) {
    const k = p / 1.5
    logoScale = 0.4 + k * 0.6 + Math.sin(t * 6) * 0.05
    logoOpacity = Math.min(1, k * 2)
  } else if (p < 3) {
    logoScale = 1.0
    logoOpacity = 1
    textOpacity = Math.min(1, (p - 1.5) / 0.8)
  } else if (p < 4.5) {
    const k = (p - 3) / 1.5
    logoScale = 1.0 + k * 0.4
    logoOpacity = 1 - k
    textOpacity = 1 - k
    overlayOpacity = 1 - k
  } else {
    overlayOpacity = 0
  }

  if (overlayOpacity <= 0) return null

  const dots = []
  const dotCount = 3
  for (let i = 0; i < dotCount; i++) {
    const phase = (t * 0.8 + i / dotCount) % 1
    const r = 16 + phase * 12
    const op = (1 - phase) * 0.35
    dots.push(
      <circle
        key={i}
        cx="64"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        opacity={op}
      />
    )
  }

  return (
    <g opacity={overlayOpacity}>
      <rect x="0" y="0" width="128" height="64" fill="black" />
      {dots}
      <g transform={`translate(64 28) scale(${logoScale * 1.2}) translate(-3 -3)`} opacity={logoOpacity}>
        <LeafIcon x={0} y={0} size={6} />
      </g>
      <text
        x="64"
        y="50"
        fontSize="6"
        className="font-mono"
        fill="currentColor"
        textAnchor="middle"
        opacity={textOpacity}
        letterSpacing="0.06em"
      >
        syncing lyrics
        <tspan opacity={(Math.sin(t * 8) + 1) / 2}>...</tspan>
      </text>
    </g>
  )
}

function NoSongScreen({ t }: { t: number }) {
  const pulse = 0.55 + ((Math.sin(t * 1.2) + 1) / 2) * 0.45
  const f = (t * 0.8) % 1
  return (
    <g>
      <text
        x="64"
        y="26"
        fontSize="9"
        className="font-mono"
        fontWeight="600"
        fill="currentColor"
        textAnchor="middle"
        opacity={pulse}
      >
        no song playing
      </text>
      <text
        x="64"
        y="38"
        fontSize="5.5"
        className="font-mono"
        fill="currentColor"
        textAnchor="middle"
        opacity={0.5}
        letterSpacing="0.06em"
      >
        connect spotify on your phone
      </text>
      <line x1="40" y1="46" x2="88" y2="46" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <MiniMiaw cx={64} cy={57} t={t} mode="noSong" />
      <g fill="currentColor" className="font-mono font-bold">
        <text x={75} y={56 - f * 3} fontSize="4.5" opacity={1 - f}>z</text>
        <text x={79} y={52 - f * 4} fontSize="5" opacity={0.7 - f * 0.5}>Z</text>
      </g>
    </g>
  )
}

interface ChangingOverlayProps {
  t: number
  prevTitle: string
  nextTitle: string
}

function ChangingOverlay({ t, prevTitle, nextTitle }: ChangingOverlayProps) {
  const CYCLE = 3.5
  const p = t % CYCLE
  let badgeOpacity = 0
  let badgeX = 0
  let nextTitleOpacity = 0
  let prevDim = 0

  if (p < 0.4) {
    prevDim = p / 0.4
  } else if (p < 0.9) {
    prevDim = 1
    const k = (p - 0.4) / 0.5
    badgeOpacity = k < 0.5 ? k * 2 : (1 - k) * 2
    badgeX = -40 + k * 200
  } else if (p < 1.4) {
    prevDim = 1 - (p - 0.9) / 0.5
    nextTitleOpacity = (p - 0.9) / 0.5
  } else {
    prevDim = 0
    nextTitleOpacity = 0
  }

  if (prevDim <= 0 && nextTitleOpacity <= 0 && badgeOpacity <= 0) return null

  return (
    <g>
      {prevDim > 0 && <rect x="0" y="0" width="128" height="64" fill="black" opacity={prevDim * 0.55} />}
      {badgeOpacity > 0 && (
        <g opacity={badgeOpacity} transform={`translate(${badgeX} 32)`}>
          <rect x="-22" y="-7" width="44" height="14" rx="2" fill="currentColor" />
          <text x="0" y="3" fontSize="7" className="font-mono" fill="black" textAnchor="middle" letterSpacing="0.06em">
            skip next
          </text>
        </g>
      )}
      {nextTitleOpacity > 0 && (
        <text
          x="64"
          y="34"
          fontSize="10"
          className="font-mono"
          fontWeight="600"
          fill="currentColor"
          textAnchor="middle"
          opacity={nextTitleOpacity}
        >
          {nextTitle}
        </text>
      )}
    </g>
  )
}

function PausedBadge({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <g transform="translate(64 32)">
      <rect x="-18" y="-7" width="36" height="14" rx="7" fill="currentColor" />
      <text x="0" y="3" fontSize="7" className="font-mono" fill="black" textAnchor="middle" letterSpacing="0.16em">
        PAUSED
      </text>
    </g>
  )
}

interface LyricsBodyProps {
  song: Song
  time: number
  t: number
  mode: "intro" | "playing" | "paused" | "noSong" | "changing"
  clipId: string
}

function LyricsBody({ song, time, t, mode, clipId }: LyricsBodyProps) {
  const i = findLyricIndex(song, time)
  const current = song.lyrics[i] || { t: 0, text: "" }
  const next = song.lyrics[i + 1] || { text: "..." }

  const sinceChange = Math.max(0, time - current.t)
  const TRANS = 0.45
  const p = Math.min(1, sinceChange / TRANS)
  const ease = 1 - Math.pow(1 - p, 3)

  const Y_CURRENT = 25
  const Y_NEXT = 39
  const SLIDE = Y_NEXT - Y_CURRENT
  const curY = Y_NEXT - ease * SLIDE
  const nextY = Y_NEXT + (1 - ease) * 5
  const curOpacity = 0.55 + ease * 0.45
  const nextOpacity = 0.25 + ease * 0.4

  const dim = mode === "paused" ? 0.45 : 1

  return (
    <g opacity={dim}>
      <MarqueeText
        text={current.text}
        cx={64}
        y={curY}
        width={120}
        fontSize={9}
        weight={600}
        opacity={curOpacity}
        t={t}
        clipId={clipId}
      />
      <MarqueeText
        text={next.text}
        cx={64}
        y={nextY}
        width={120}
        fontSize={7}
        weight={500}
        opacity={nextOpacity * 0.65}
        t={t}
        clipId={clipId}
      />
    </g>
  )
}

export function useSpotifyClock(song: Song, mode: string, speed = 1, songIndexKey = 0) {
  const [time, setTime] = useState(song.startOffset)
  const [t, setT] = useState(0)
  const [modeT, setModeT] = useState(0)

  useEffect(() => {
    setModeT(0)
  }, [mode, songIndexKey])

  useEffect(() => {
    let raf: number
    const start = performance.now()
    const modeStart = performance.now()
    const baseTime = mode === "noSong" ? 0 : song.startOffset
    setTime(baseTime)
    const advanceTime = mode === "playing" || mode === "changing"

    const tick = () => {
      const now = performance.now()
      const elapsed = (now - start) / 1000
      setT(elapsed)
      setModeT((now - modeStart) / 1000)

      if (advanceTime) {
        const lastLyricT = song.lyrics[song.lyrics.length - 1]?.t || song.duration
        const loopEnd = Math.min(song.duration, lastLyricT + 8)
        let next = baseTime + elapsed * speed
        if (next > loopEnd) {
          next = baseTime + ((next - baseTime) % (loopEnd - baseTime))
        }
        setTime(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode, song, speed, songIndexKey])

  return { time, t, modeT }
}

interface SpotifyScreenProps {
  mode?: "intro" | "playing" | "paused" | "noSong" | "changing"
  song: Song
  time: number
  t: number
  modeT: number
  prevSongTitle?: string
  clipId: string
}

function SpotifyScreen({
  mode = "playing",
  song,
  time,
  t,
  modeT,
  prevSongTitle = "",
  clipId,
}: SpotifyScreenProps) {
  const live = mode === "playing"
  const dimAll = mode === "paused" ? 0.7 : 1

  if (mode === "noSong") {
    return (
      <svg
        viewBox="0 0 128 64"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
      >
        <g transform="translate(3 3.5)" opacity="0.7">
          <LeafIcon x={0} y={0} size={5} />
        </g>
        <text
          x="11"
          y="6.5"
          fontSize="5.5"
          className="font-mono"
          fill="currentColor"
          opacity={0.75}
          letterSpacing="0.06em"
        >
          spotify
        </text>
        <text
          x="125"
          y="6.5"
          fontSize="5.5"
          className="font-mono"
          fill="currentColor"
          textAnchor="end"
          opacity={0.55}
        >
          idle
        </text>
        <line x1="3" y1="9" x2="125" y2="9" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
        <NoSongScreen t={t} />
      </svg>
    )
  }

  const headerTitle = mode === "changing" && modeT < 1.4 && modeT > 0.9 ? "" : song.title
  const headerTime = song ? `${fmtTime(time)} / ${fmtTime(song.duration)}` : ""
  const progress = song ? Math.min(1, time / song.duration) : 0
  const px = 4 + progress * 120

  return (
    <svg
      viewBox="0 0 128 64"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="3" y="14" width="122" height="32" />
        </clipPath>
      </defs>

      <g opacity={dimAll}>
        <g className="font-mono" fill="currentColor">
          <g transform="translate(3 3.5)">
            <LeafIcon x={0} y={0} size={5} />
          </g>
          <text x="11" y="6.5" fontSize="5.5" letterSpacing="0">
            {headerTitle}
          </text>
          <text x="125" y="6.5" fontSize="5.5" textAnchor="end" opacity={0.85}>
            {headerTime}
          </text>
        </g>

        <line x1="3" y1="9" x2="125" y2="9" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />

        <line x1="4" y1="12" x2="124" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        <line x1="4" y1="12" x2={px} y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx={px} cy="12" r="1.5" fill="currentColor" />
        <circle cx={px} cy="12" r="0.7" fill="black" />

        <LyricsBody song={song} time={time} t={t} mode={mode} clipId={clipId} />

        <line x1="3" y1="47" x2="125" y2="47" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />

        <MiniMiaw cx={12} cy={56} t={t} mode={mode} />
        <FloatingNotes cx={12} cy={49} t={t} count={3} active={live} />

        <g transform="translate(34 58)" fill="currentColor" opacity={mode === "paused" ? 1 : 0.85}>
          {mode === "paused" ? (
            <g>
              <rect x="-2" y="-3" width="1.5" height="6" />
              <rect x="0.7" y="-3" width="1.5" height="6" />
            </g>
          ) : (
            <polygon points="-2,-3 -2,3 2.5,0" />
          )}
        </g>

        <WaveBars x={48} y={62} t={t} speed={1} mode={mode} />

        <g transform="translate(118 56)" fill="currentColor" opacity={0.7}>
          <rect x="0" y="2" width="1.6" height="3" />
          <rect x="2.4" y="0" width="1.6" height="5" />
          <rect x="4.8" y="-2" width="1.6" height="7" />
        </g>
      </g>

      {mode === "paused" && <PausedBadge visible={true} />}
      {mode === "intro" && <IntroOverlay t={modeT} />}
      {mode === "changing" && (
        <ChangingOverlay t={modeT} prevTitle={prevSongTitle} nextTitle={song.title} />
      )}
    </svg>
  )
}

interface SpotifyPlayerProps {
  mode?: "intro" | "playing" | "paused" | "noSong" | "changing"
  songIndex?: number
  speed?: number
}

export function SpotifyPlayer({
  mode = "playing",
  songIndex = 0,
  speed = 1,
}: SpotifyPlayerProps) {
  const clipId = useId()
  const song = DEMO_SONGS[songIndex] || DEMO_SONGS[0]
  const effectiveMode = mode

  const { time, t, modeT } = useSpotifyClock(song, effectiveMode, speed, songIndex)

  const nextSongIdx = (songIndex + 1) % DEMO_SONGS.length
  const prevSongTitle = DEMO_SONGS[nextSongIdx].title

  return (
    <div className="w-full h-full text-[#9ee2ff] bg-black relative flex items-center justify-center p-3 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1a2e_0%,_#050912_100%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#5ec8ff 1px, transparent 1px), linear-gradient(90deg, #5ec8ff 1px, transparent 1px)`,
          backgroundSize: "4px 4px",
        }}
      />
      <div className="w-full h-full relative z-10 drop-shadow-[0_0_4px_#5ec8ff]">
        <SpotifyScreen
          mode={effectiveMode}
          song={song}
          time={time}
          t={t}
          modeT={modeT}
          prevSongTitle={prevSongTitle}
          clipId={clipId}
        />
      </div>
    </div>
  )
}
