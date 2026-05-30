"use client"

import { useEffect, useState } from "react"
import { Music } from "lucide-react"

const SW_OUTLINE = 2.5
const SW_WHISKER = 1.5
const SW_EXTRAS  = 1.8
const SPARKLE_R  = 1.6
const EYE_R_OPEN = 4.6
const EYE_R_WIDE = 5.8
const CHAR_SCALE = 1.08

export interface StateConfig {
  label: string
  short: string
  desc: string
  trigger: string
  anim: string
  eyes: "open" | "wide" | "halfClosed" | "lookUpRight" | "happy" | "spiral" | "sleep" | "angry" | "scared" | "love" | "dizzy" | "hungry"
  mouth: "omega" | "smileBig" | "speak" | "oOpen" | "sleepSmile" | "frown" | "tongue" | "sad" | "nervous" | null
  paws: "cheekRight" | "chinRest" | "bothUp" | "cupEarRight" | "gestureLowerRight" | "scratchTopRight" | "curledChest" | "earGroomEaster" | "facePalm" | "bellyRub" | null
  nose: "tri" | "none"
  tilt: number
  extras: "listening" | "thinking" | "speaking" | "happy" | "confused" | "sleeping" | "grooming" | "dancing" | "angerMark" | "sweat" | "hearts" | null
  blush: number | null
  tail: "sway" | "alert" | "up" | "curled" | "dance" | null
  breathe: boolean
  breatheSlow?: boolean
  microTilt?: boolean
  bounce?: boolean
  wobble?: boolean
  dance?: boolean
}

export const STATES: Record<string, StateConfig> = {
  idleCalm: {
    label: "Idle (Calm)",
    short: "Idle",
    desc: "Default neutral expression with peaceful breathing.",
    trigger: "Default state when inactive.",
    anim: "Blink, breathe, tail sway, random ear groom",
    eyes: "open",
    mouth: "omega",
    paws: "earGroomEaster",
    nose: "tri",
    tilt: 0,
    extras: null,
    blush: 1.5,
    tail: "sway",
    breathe: true,
    microTilt: true,
  },
  grooming: {
    label: "Idle (Grooming)",
    short: "Grooming",
    desc: "Paw to cheek with content half-closed eyes.",
    trigger: "Random state change event.",
    anim: "Paw wipes, music note, content blush",
    eyes: "halfClosed",
    mouth: "sleepSmile",
    paws: "cheekRight",
    nose: "tri",
    tilt: -3,
    extras: "grooming",
    blush: 1.5,
    tail: null,
    breathe: false,
  },
  listening: {
    label: "Listening",
    short: "Listening",
    desc: "Ears perked, wide eyes, paw cupped near ear.",
    trigger: "When audio input is active.",
    anim: "Sound waves, cupping paw twitch, alert tail",
    eyes: "wide",
    mouth: "omega",
    paws: "cupEarRight",
    nose: "tri",
    tilt: 0,
    extras: "listening",
    blush: null,
    tail: "alert",
    breathe: false,
  },
  thinking: {
    label: "Thinking",
    short: "Thinking",
    desc: "Eyes looking up-right, paw tapping chin.",
    trigger: "Waiting for API response.",
    anim: "Thinking bubbles, paw taps chin",
    eyes: "lookUpRight",
    mouth: "frown",
    paws: "chinRest",
    nose: "tri",
    tilt: 4,
    extras: "thinking",
    blush: null,
    tail: null,
    breathe: false,
  },
  speaking: {
    label: "Speaking",
    short: "Speaking",
    desc: "Mouth opening and closing with paw gestures.",
    trigger: "When playing speech response.",
    anim: "Mouth cycles, synchronised paw gestures",
    eyes: "open",
    mouth: "speak",
    paws: "gestureLowerRight",
    nose: "tri",
    tilt: 0,
    extras: "speaking",
    blush: null,
    tail: null,
    breathe: false,
  },
  happy: {
    label: "Happy / Excited",
    short: "Happy",
    desc: "Happy eyes, big smile, sparkles, paws raised.",
    trigger: "Successful operation or positive command.",
    anim: "Sparkles, bounce, tail up-sway",
    eyes: "happy",
    mouth: "smileBig",
    paws: "bothUp",
    nose: "tri",
    tilt: 0,
    extras: "happy",
    blush: 2.0,
    tail: "up",
    breathe: false,
    bounce: true,
  },
  confused: {
    label: "Confused / Error",
    short: "Confused",
    desc: "Spiral eyes, question mark, head scratching.",
    trigger: "Error state or unrecognized instruction.",
    anim: "Head wobble, paw scratches head",
    eyes: "spiral",
    mouth: "oOpen",
    paws: "scratchTopRight",
    nose: "tri",
    tilt: 10,
    extras: "confused",
    blush: null,
    tail: null,
    breathe: false,
    wobble: true,
  },
  sleeping: {
    label: "Sleeping",
    short: "Sleeping",
    desc: "Closed eyes, rising sleep indicators, paws curled.",
    trigger: "Extended inactivity period.",
    anim: "Sleep indicators rising, slow breathing, curled tail",
    eyes: "sleep",
    mouth: "sleepSmile",
    paws: "curledChest",
    nose: "none",
    tilt: 6,
    extras: "sleeping",
    blush: 1.5,
    tail: "curled",
    breathe: true,
    breatheSlow: true,
  },
  dancing: {
    label: "Dancing",
    short: "Dancing",
    desc: "Grooving to the music with little hops and floating notes.",
    trigger: "When the radio is playing (client-driven).",
    anim: "Side-step walk, hops, body bounce, tail wag, rising notes",
    eyes: "happy",
    mouth: "smileBig",
    paws: "bothUp",
    nose: "tri",
    tilt: 0,
    extras: "dancing",
    blush: 2.0,
    tail: "dance",
    breathe: false,
    dance: true,
  },
  gaming: {
    label: "Gaming",
    short: "Gaming",
    desc: "Miaw is focused on playing a retro console game.",
    trigger: "When the blue hardware button is pressed.",
    anim: "Intense focus, rapid eye movement",
    eyes: "wide",
    mouth: "omega",
    paws: "bothUp",
    nose: "tri",
    tilt: 5,
    extras: null,
    blush: null,
    tail: "alert",
    breathe: false,
    bounce: true,
  },
  angry: {
    label: "Angry", short: "Angry", desc: "Mad or annoyed state.", trigger: "Manual.", anim: "Anger mark, shaking",
    eyes: "angry", mouth: "sad", paws: null, nose: "tri", tilt: -2, extras: "angerMark", blush: null, tail: "alert", breathe: false, wobble: true,
  },
  scared: {
    label: "Scared / Shocked", short: "Scared", desc: "Wide eyes, shivering.", trigger: "Manual.", anim: "Shivering, sweat",
    eyes: "scared", mouth: "nervous", paws: "curledChest", nose: "tri", tilt: 0, extras: "sweat", blush: null, tail: "curled", breathe: false, wobble: true,
  },
  love: {
    label: "In Love", short: "Love", desc: "Heart eyes, blushing heavily.", trigger: "Manual.", anim: "Floating hearts, swaying",
    eyes: "love", mouth: "smileBig", paws: "cheekRight", nose: "tri", tilt: 5, extras: "hearts", blush: 3.5, tail: "sway", breathe: true,
  },
  dizzy: {
    label: "Dizzy", short: "Dizzy", desc: "Spinning eyes, wobbly.", trigger: "Manual.", anim: "Wobble, spinning eyes",
    eyes: "dizzy", mouth: "nervous", paws: "facePalm", nose: "tri", tilt: 8, extras: "sweat", blush: null, tail: null, breathe: false, wobble: true,
  },
  hungry: {
    label: "Hungry", short: "Hungry", desc: "Tongue out, rubbing belly.", trigger: "Manual.", anim: "Tongue out, paw on belly",
    eyes: "hungry", mouth: "tongue", paws: "bellyRub", nose: "tri", tilt: -3, extras: null, blush: 1.5, tail: "sway", breathe: true,
  }
}

function HeadAndEars() {
  const sw = SW_OUTLINE
  return (
    <g>
      <path
        d="M 44 19 Q 47 6 50.5 5 Q 54.5 7 57 19 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M 71 19 Q 73.5 7 77.5 5 Q 81 6 84 19 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M 49 15 Q 50.5 9 52.5 8.5 Q 54 10.5 54.5 15 Z" fill="currentColor" />
      <path d="M 73.5 15 Q 75 9.5 77 8.5 Q 78.5 10.5 79 15 Z" fill="currentColor" />
      <path
        d="M 41 26 Q 41 17 50 16 L 78 16 Q 87 17 87 26 L 87 36 Q 87 47 78 48 Q 64 51 50 48 Q 41 47 41 36 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </g>
  )
}

function ChestBody() {
  const sw = SW_OUTLINE
  return (
    <path
      d="M 39 50 Q 39 47 44 47 L 84 47 Q 89 47 89 50 Q 91 56 87 60 Q 64 64 41 60 Q 37 56 39 50 Z"
      fill="white"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  )
}

function Whiskers() {
  const sw = SW_WHISKER
  return (
    <g stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none">
      <line x1="42" y1="36" x2="33" y2="34" />
      <line x1="42" y1="38.5" x2="32" y2="38.5" />
      <line x1="42" y1="41" x2="33" y2="43" />
      <line x1="86" y1="36" x2="95" y2="34" />
      <line x1="86" y1="38.5" x2="96" y2="38.5" />
      <line x1="86" y1="41" x2="95" y2="43" />
    </g>
  )
}

function Nose({ shape = "tri" }: { shape?: "tri" | "none" }) {
  if (shape === "none") return null
  return <polygon points="62.3,33 65.7,33 64,35.2" fill="currentColor" />
}

function Blush({ size = 1.5 }: { size?: number }) {
  return (
    <g fill="currentColor">
      <circle cx="46" cy="36" r={size} />
      <circle cx="82" cy="36" r={size} />
    </g>
  )
}

interface EyesProps {
  kind: string
  animSpeed?: number
  blinkOn?: boolean
}

function Eyes({ kind, animSpeed = 1, blinkOn = true }: EyesProps) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (!blinkOn || kind !== "open") return
    const id = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
    }, 3200 / animSpeed)
    return () => clearInterval(id)
  }, [kind, animSpeed, blinkOn])

  const sw = SW_OUTLINE
  if (blink && kind === "open") {
    return (
      <g stroke="currentColor" strokeWidth={sw} fill="none" strokeLinecap="round">
        <path d="M 48 30 Q 52 32 56 30" />
        <path d="M 72 30 Q 76 32 80 30" />
      </g>
    )
  }

  switch (kind) {
    case "open":
      return (
        <g>
          <circle cx="52" cy="30" r={EYE_R_OPEN} fill="currentColor" />
          <circle cx="76" cy="30" r={EYE_R_OPEN} fill="currentColor" />
          <circle cx="53.8" cy="28.2" r={SPARKLE_R} fill="white" />
          <circle cx="77.8" cy="28.2" r={SPARKLE_R} fill="white" />
        </g>
      )
    case "wide":
      return (
        <g>
          <circle cx="52" cy="30" r={EYE_R_WIDE} fill="currentColor" />
          <circle cx="76" cy="30" r={EYE_R_WIDE} fill="currentColor" />
          <circle cx="53.8" cy="28" r={SPARKLE_R + 0.2} fill="white" />
          <circle cx="77.8" cy="28" r={SPARKLE_R + 0.2} fill="white" />
          <circle cx="50.8" cy="31.5" r="0.7" fill="white" />
          <circle cx="74.8" cy="31.5" r="0.7" fill="white" />
        </g>
      )
    case "halfClosed":
      return (
        <g>
          <path d="M 48 30 Q 52 33 56 30 Q 52 31 48 30 Z" fill="currentColor" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 72 30 Q 76 33 80 30 Q 76 31 72 30 Z" fill="currentColor" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 48 29 Q 52 26 56 29" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 72 29 Q 76 26 80 29" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </g>
      )
    case "lookUpRight":
      return (
        <g>
          <circle cx="52" cy="30" r={EYE_R_OPEN + 0.3} fill="white" stroke="currentColor" strokeWidth={sw} />
          <circle cx="76" cy="30" r={EYE_R_OPEN + 0.3} fill="white" stroke="currentColor" strokeWidth={sw} />
          <circle cx="53.8" cy="28" r="2.4" fill="currentColor" />
          <circle cx="77.8" cy="28" r="2.4" fill="currentColor" />
        </g>
      )
    case "happy":
      return (
        <g stroke="currentColor" strokeWidth={sw + 0.4} fill="none" strokeLinecap="round">
          <path d="M 46.5 32 Q 52 24 57.5 32" />
          <path d="M 70.5 32 Q 76 24 81.5 32" />
        </g>
      )
    case "spiral":
      return (
        <g stroke="currentColor" strokeWidth={sw} fill="none" strokeLinecap="round">
          <circle cx="52" cy="30" r={EYE_R_OPEN + 0.3} fill="white" stroke="currentColor" strokeWidth={sw} />
          <circle cx="76" cy="30" r={EYE_R_OPEN + 0.3} fill="white" stroke="currentColor" strokeWidth={sw} />
          <path d="M 52 30 m -3 0 a 3 3 0 1 1 6 0 a 2 2 0 1 1 -4 0 a 1 1 0 1 1 2 0" />
          <path d="M 76 30 m -3 0 a 3 3 0 1 1 6 0 a 2 2 0 1 1 -4 0 a 1 1 0 1 1 2 0" />
        </g>
      )
    case "sleep":
      return (
        <g stroke="currentColor" strokeWidth={sw + 0.2} fill="none" strokeLinecap="round">
          <path d="M 48 30 Q 52 34 56 30" />
          <path d="M 72 30 Q 76 34 80 30" />
          <line x1="47" y1="29.5" x2="45" y2="28" />
          <line x1="81" y1="29.5" x2="83" y2="28" />
        </g>
      )
    case "angry":
      return (
        <g stroke="currentColor" strokeWidth={sw + 0.5} fill="none" strokeLinecap="round">
          <path d="M 46 28 L 54 32" />
          <path d="M 82 28 L 74 32" />
          <circle cx="52" cy="33" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="76" cy="33" r="1.5" fill="currentColor" stroke="none" />
        </g>
      )
    case "scared":
      return (
        <g>
          <circle cx="52" cy="30" r={EYE_R_WIDE} fill="white" stroke="currentColor" strokeWidth={sw} />
          <circle cx="76" cy="30" r={EYE_R_WIDE} fill="white" stroke="currentColor" strokeWidth={sw} />
          <circle cx="52" cy="30" r="1.5" fill="currentColor" />
          <circle cx="76" cy="30" r="1.5" fill="currentColor" />
        </g>
      )
    case "love":
      return (
        <g fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
          <path d="M 52 26 C 48 26, 46 29, 46 31 C 46 34, 52 36, 52 36 C 52 36, 58 34, 58 31 C 58 29, 56 26, 52 26 Z" />
          <path d="M 76 26 C 72 26, 70 29, 70 31 C 70 34, 76 36, 76 36 C 76 36, 82 34, 82 31 C 82 29, 80 26, 76 26 Z" />
        </g>
      )
    case "dizzy":
      return (
        <g stroke="currentColor" strokeWidth={sw} fill="none" strokeLinecap="round">
          <path d="M 52 30 m -4 0 a 4 4 0 1 1 8 0 a 3 3 0 1 1 -6 0 a 2 2 0 1 1 4 0" />
          <path d="M 76 30 m -4 0 a 4 4 0 1 1 8 0 a 3 3 0 1 1 -6 0 a 2 2 0 1 1 4 0" />
        </g>
      )
    case "hungry":
      return (
        <g>
          <circle cx="52" cy="30" r={EYE_R_WIDE} fill="currentColor" />
          <circle cx="76" cy="30" r={EYE_R_WIDE} fill="currentColor" />
          <circle cx="53.8" cy="28" r={SPARKLE_R + 0.2} fill="white" />
          <circle cx="77.8" cy="28" r={SPARKLE_R + 0.2} fill="white" />
        </g>
      )
    default:
      return null
  }
}

interface MouthProps {
  kind: string | null
  animSpeed?: number
}

function Mouth({ kind, animSpeed = 1 }: MouthProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (kind !== "speak") return
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 240 / animSpeed)
    return () => clearInterval(id)
  }, [kind, animSpeed])

  const baseProps = {
    stroke: "currentColor",
    strokeWidth: 1.8,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  switch (kind) {
    case "omega":
      return <g {...baseProps}><path d="M 60 37.5 Q 62.5 40.5 64 38.5 Q 65.5 40.5 68 37.5" /></g>
    case "smileBig":
      return (
        <g {...baseProps} strokeWidth={2.1}>
          <path d="M 56 37 Q 64 45 72 37" />
          <path d="M 61 40 Q 64 43 67 40" fill="currentColor" stroke="none" />
        </g>
      )
    case "speak": {
      const rx = phase === 0 ? 1.5 : phase === 1 ? 2.1 : 2.7
      const ry = phase === 0 ? 1.1 : phase === 1 ? 1.9 : 2.3
      return <ellipse cx="64" cy="39" rx={rx} ry={ry} fill="currentColor" />
    }
    case "oOpen":
      return <circle cx="64" cy="39" r="2" fill="currentColor" />
    case "sleepSmile":
      return <g {...baseProps}><path d="M 61 38 Q 64 39.5 67 38" /></g>
    case "frown":
      return <g {...baseProps}><path d="M 61 39.5 Q 64 37 67 39.5" /></g>
    case "sad":
      return <g {...baseProps}><path d="M 60 40 Q 64 36 68 40" /></g>
    case "nervous":
      return <g {...baseProps}><path d="M 60 38 L 62 39 L 64 38 L 66 39 L 68 38" /></g>
    case "tongue":
      return (
        <g {...baseProps}>
          <path d="M 60 37.5 Q 64 39.5 68 37.5" />
          <path d="M 62 38 Q 64 44 66 38" fill="currentColor" />
        </g>
      )
    default:
      return null
  }
}

interface PawShapeProps {
  cx: number
  cy: number
  rx?: number
  ry?: number
  toes?: number
  rotate?: number
  sw?: number
}

function PawShape({ cx, cy, rx = 4, ry = 3, toes = 2, rotate = 0, sw = SW_OUTLINE }: PawShapeProps) {
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" stroke="currentColor" strokeWidth={sw} />
      {toes >= 2 && (
        <>
          <circle cx={cx - 1} cy={cy - 0.4} r="0.7" fill="currentColor" />
          <circle cx={cx + 1} cy={cy - 0.4} r="0.7" fill="currentColor" />
        </>
      )}
      {toes === 3 && <circle cx={cx} cy={cy - 1.4} r="0.6" fill="currentColor" />}
    </g>
  )
}

interface PawsProps {
  pose: string | null
  t: number
  animSpeed: number
  easterPawVisible?: { phase: number } | null
}

function Paws({ pose, t, animSpeed, easterPawVisible }: PawsProps) {
  const phase = t * animSpeed

  if (pose === "cheekRight") {
    const dy = Math.sin(phase * 1.5 * 2 * Math.PI) * 1.2
    return (
      <g>
        <PawShape cx={80} cy={38 + dy} rx={4.6} ry={3.4} />
        <path d={`M 83 ${41 + dy} Q 86 ${46 + dy * 0.5} 84 52`} fill="none" stroke="currentColor" strokeWidth={SW_OUTLINE} strokeLinecap="round" />
      </g>
    )
  }
  if (pose === "chinRest") {
    const tap = Math.floor(phase * 1.25) % 2 === 0 ? 0 : -0.8
    return <PawShape cx={62} cy={50 + tap} rx={4.2} ry={3.1} />
  }
  if (pose === "bothUp") {
    const dy = Math.sin(phase * 3 * 2 * Math.PI) * 0.6
    return (
      <g>
        <PawShape cx={34} cy={52 - dy} rx={3.6} ry={3} />
        <PawShape cx={94} cy={52 + dy} rx={3.6} ry={3} />
      </g>
    )
  }
  if (pose === "cupEarRight") {
    const dy = Math.floor(phase * 2) % 2 === 0 ? 0 : -1
    return (
      <g>
        <PawShape cx={84} cy={16 + dy} rx={4.4} ry={3.2} rotate={20} />
        <path d={`M 84 ${20 + dy} Q 88 30 90 44`} fill="none" stroke="currentColor" strokeWidth={SW_OUTLINE} strokeLinecap="round" />
      </g>
    )
  }
  if (pose === "gestureLowerRight") {
    const dy = Math.sin(phase * (1000 / 240) * 2 * Math.PI) * 1.5
    return <PawShape cx={92} cy={56 + dy} rx={3.6} ry={2.8} rotate={-12} />
  }
  if (pose === "scratchTopRight") {
    const dx = Math.sin(phase * (1000 / 600) * 2 * Math.PI) * 1.6
    return (
      <g>
        <PawShape cx={84 + dx} cy={9} rx={4} ry={3} rotate={-25} />
        <path d={`M ${85 + dx} 12 Q 86 18 84 22`} fill="none" stroke="currentColor" strokeWidth={SW_OUTLINE} strokeLinecap="round" />
      </g>
    )
  }
  if (pose === "curledChest") {
    return (
      <g>
        <PawShape cx={56} cy={58} rx={3} ry={2.4} toes={2} />
        <PawShape cx={72} cy={58} rx={3} ry={2.4} toes={2} />
      </g>
    )
  }
  if (pose === "earGroomEaster") {
    if (!easterPawVisible) return null
    const local = easterPawVisible.phase
    const lift = local < 0.15 ? local / 0.15 : local > 0.85 ? (1 - local) / 0.15 : 1
    const rub = Math.sin(local * 2 * 2 * Math.PI) * 1.5
    const cy = 16 + (1 - lift) * 40
    return (
      <g opacity={Math.max(0, Math.min(1, lift * 1.2))}>
        <PawShape cx={84 + rub} cy={cy} rx={4.2} ry={3.1} rotate={15} />
        <path
          d={`M ${84 + rub} ${cy + 4} Q 88 ${cy + 14} 90 ${cy + 28}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={SW_OUTLINE}
          strokeLinecap="round"
          opacity={0.9}
        />
      </g>
    )
  }
  if (pose === "facePalm") {
    return (
      <g stroke="currentColor" strokeWidth={SW_OUTLINE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 68 56 Q 72 40 76 28" fill="none" />
        <circle cx="76" cy="28" r="3" fill="white" />
      </g>
    )
  }
  if (pose === "bellyRub") {
    return (
      <g stroke="currentColor" strokeWidth={SW_OUTLINE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 38 56 Q 44 50 50 52" fill="none" />
        <circle cx="50" cy="52" r="3" fill="white" />
        <path d="M 90 56 Q 84 50 78 52" fill="none" />
        <circle cx="78" cy="52" r="3" fill="white" />
      </g>
    )
  }
  return null
}

interface TailProps {
  pose: string | null
  t: number
  animSpeed: number
}

function Tail({ pose, t, animSpeed }: TailProps) {
  const phase = t * animSpeed
  const sw = 2.0

  if (pose === "sway") {
    const a = Math.sin(phase * 0.5 * 2 * Math.PI) * 7
    return (
      <g transform={`rotate(${a} 8 62)`}>
        <path d="M 8 62 Q 14 56 18 52 Q 22 48 28 46" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="46" r="1.4" fill="currentColor" />
      </g>
    )
  }
  if (pose === "alert") {
    const a = Math.sin(phase * 4) * 2.5
    return (
      <g transform={`rotate(${a} 10 62)`}>
        <path d="M 10 62 Q 12 54 14 48 Q 15 44 16 40" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="40" r="1.4" fill="currentColor" />
      </g>
    )
  }
  if (pose === "up") {
    const a = Math.sin(phase * 2 * 2 * Math.PI) * 9
    return (
      <g transform={`rotate(${a} 120 62)`}>
        <path d="M 120 62 Q 117 54 116 46 Q 116 40 118 34" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="118" cy="34" r="1.4" fill="currentColor" />
      </g>
    )
  }
  if (pose === "curled") {
    return (
      <g>
        <path d="M 12 62 Q 18 56 26 56 Q 34 56 38 60 Q 40 62 44 61" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44" cy="61" r="1.4" fill="currentColor" />
      </g>
    )
  }
  if (pose === "dance") {
    const a = Math.sin(phase * 3 * 2 * Math.PI) * 16 + Math.sin(phase * 11) * 3
    return (
      <g transform={`rotate(${a} 8 62)`}>
        <path d="M 8 62 Q 13 55 17 50 Q 21 45 27 43" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="43" r="1.4" fill="currentColor" />
      </g>
    )
  }
  return null
}

interface SparkProps {
  cx: number
  cy: number
  s?: number
  ph?: number
  t: number
  speed: number
}

function Spark({ cx, cy, s = 1, ph = 0, t, speed }: SparkProps) {
  const sc = 0.6 + ((Math.sin(t * 3 * speed + ph) + 1) / 2) * 0.6
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s * sc})`} fill="currentColor">
      <path d="M 0 -3 L 0.7 -0.7 L 3 0 L 0.7 0.7 L 0 3 L -0.7 0.7 L -3 0 L -0.7 -0.7 Z" />
    </g>
  )
}

interface StateExtrasProps {
  state: string | null
  t: number
  animSpeed: number
}

function StateExtras({ state, t, animSpeed }: StateExtrasProps) {
  const speed = animSpeed

  if (state === "listening") {
    const a1 = (Math.sin(t * 3 * speed) + 1) / 2
    return (
      <g stroke="currentColor" strokeWidth={SW_EXTRAS} fill="none" strokeLinecap="round" opacity={0.6 + a1 * 0.4}>
        <path d="M 26 22 Q 22 28 26 34" />
        <path d="M 21 20 Q 16 28 21 36" opacity={0.6} />
        <path d="M 102 22 Q 106 28 102 34" />
        <path d="M 107 20 Q 112 28 107 36" opacity={0.6} />
      </g>
    )
  }
  if (state === "thinking") {
    const idx = Math.floor(t * 2 * speed) % 3
    return (
      <g fill="currentColor">
        <circle cx="92" cy="10" r="1.5" opacity={idx >= 0 ? 1 : 0.25} />
        <circle cx="98" cy="10" r="1.5" opacity={idx >= 1 ? 1 : 0.25} />
        <circle cx="104" cy="10" r="1.5" opacity={idx >= 2 ? 1 : 0.25} />
      </g>
    )
  }
  if (state === "speaking") {
    const a = (Math.sin(t * 6 * speed) + 1) / 2
    return (
      <g stroke="currentColor" strokeWidth={SW_EXTRAS - 0.2} strokeLinecap="round" fill="none" opacity={0.5 + a * 0.5}>
        <line x1="30" y1="32" x2="26" y2="32" />
        <line x1="30" y1="36" x2="24" y2="36" />
        <line x1="98" y1="32" x2="102" y2="32" />
        <line x1="98" y1="36" x2="104" y2="36" />
      </g>
    )
  }
  if (state === "happy") {
    return (
      <g>
        <Spark cx={30} cy={14} ph={0} t={t} speed={speed} />
        <Spark cx={100} cy={14} ph={1.5} t={t} speed={speed} />
        <Spark cx={24} cy={34} s={0.7} ph={2.8} t={t} speed={speed} />
        <Spark cx={106} cy={34} s={0.7} ph={1.0} t={t} speed={speed} />
        <Spark cx={64} cy={6} s={0.8} ph={0.5} t={t} speed={speed} />
      </g>
    )
  }
  if (state === "confused") {
    return (
      <g>
        <g transform="translate(102 4)" stroke="currentColor" strokeWidth={SW_EXTRAS + 0.2} fill="none" strokeLinecap="round">
          <path d="M 0 3 Q 0 -2 4 -2 Q 8 -2 6 3 L 4 6" />
          <circle cx="4" cy="9" r="0.9" fill="currentColor" stroke="none" />
        </g>
        <path d="M 30 22 Q 31 26 29 28 Q 27 26 30 22 Z" fill="currentColor" opacity="0.85" />
      </g>
    )
  }
  if (state === "sleeping") {
    const f = (t * speed) % 1
    return (
      <g fill="currentColor" className="font-mono font-bold">
        <text x={92} y={14 - f * 2} fontSize="6" opacity={1 - f}>z</text>
        <text x={100} y={9 - f * 3} fontSize="8" opacity={0.85 - f * 0.6}>Z</text>
        <text x={110} y={4 - f * 2} fontSize="5" opacity={0.6 - f * 0.5}>z</text>
      </g>
    )
  }
  if (state === "grooming") {
    return (
      <g fill="currentColor" opacity="0.7">
        <foreignObject x={28} y={12} width={12} height={12}>
          <Music className="size-3 text-black dark:text-white" />
        </foreignObject>
      </g>
    )
  }
  if (state === "dancing") {
    const notes = [
      { x: 26, baseY: 32, ph: 0.0, s: 1.0, dur: 2.6 },
      { x: 102, baseY: 30, ph: 0.9, s: 0.85, dur: 2.2 },
      { x: 20, baseY: 42, ph: 1.7, s: 0.7, dur: 3.1 },
      { x: 108, baseY: 44, ph: 0.4, s: 0.75, dur: 2.4 },
    ]
    return (
      <g fill="currentColor">
        {notes.map((n, i) => {
          const p = ((t * speed) / n.dur + n.ph) % 1
          const x = n.x + Math.sin(p * 6 + i) * 3
          const y = n.baseY - p * 26
          const op = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1
          return (
            <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${n.s})`} opacity={op}>
              <ellipse cx="-1.6" cy="2.4" rx="1.7" ry="1.3" transform="rotate(-20 -1.6 2.4)" />
              <rect x="-0.1" y="-3.4" width="0.9" height="5.8" />
              <path d="M 0.8 -3.4 Q 3.6 -2.6 2.4 0.2 Q 2.7 -1.8 0.8 -1.8 Z" />
            </g>
          )
        })}
      </g>
    )
  }
  if (state === "angerMark") {
    return (
      <g stroke="red" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 80 12 L 86 12 L 86 18 M 86 12 L 80 18" />
      </g>
    )
  }
  if (state === "sweat") {
    return (
      <g fill="#9ee2ff" stroke="currentColor" strokeWidth="1" transform={`translate(0, ${Math.sin(t*5)*1})`}>
        <path d="M 34 16 Q 32 20 34 22 Q 36 20 34 16 Z" />
      </g>
    )
  }
  if (state === "hearts") {
    return (
      <g fill="pink" stroke="currentColor" strokeWidth="1" transform={`translate(0, ${-Math.abs(Math.sin(t*3)*3)})`}>
        <path d="M 34 16 C 30 16, 28 19, 28 21 C 28 24, 34 26, 34 26 C 34 26, 40 24, 40 21 C 40 19, 38 16, 34 16 Z" />
        <path d="M 94 20 C 90 20, 88 23, 88 25 C 88 28, 94 30, 94 30 C 94 30, 100 28, 100 25 C 100 23, 98 20, 94 20 Z" transform="scale(0.7) translate(30, 10)" />
      </g>
    )
  }
  return null
}

function useIdleMicroBehavior(active: boolean, animSpeed: number) {
  const [microTilt, setMicroTilt] = useState(0)
  const [easter, setEaster] = useState<{ phase: number } | null>(null)

  useEffect(() => {
    if (!active) return
    let timeout: NodeJS.Timeout
    const schedule = () => {
      const wait = ((15 + Math.random() * 5) * 1000) / animSpeed
      timeout = setTimeout(() => {
        const dir = Math.random() > 0.5 ? 4 : -4
        setMicroTilt(dir)
        setTimeout(() => setMicroTilt(0), 1500 / animSpeed)
        schedule()
      }, wait)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [active, animSpeed])

  useEffect(() => {
    if (!active) return
    let timeout: NodeJS.Timeout
    let raf: number
    const schedule = () => {
      const wait = ((8 + Math.random() * 4) * 1000) / animSpeed
      timeout = setTimeout(() => {
        const start = performance.now()
        const dur = 2000 / animSpeed
        const tick = () => {
          const p = (performance.now() - start) / dur
          if (p >= 1) {
            setEaster(null)
            schedule()
            return
          }
          setEaster({ phase: p })
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }, wait)
    }
    schedule()
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [active, animSpeed])

  return { microTilt, easter }
}

function useMicroExpressions(baseCfg: StateConfig, active: boolean) {
  const [override, setOverride] = useState<Partial<StateConfig> | null>(null)

  useEffect(() => {
    if (!active) {
      setOverride(null)
      return
    }
    
    let timeoutId: NodeJS.Timeout
    let clearOverrideId: NodeJS.Timeout

    const scheduleMicro = () => {
      // Lebih banyak gerakan saat idle
      const wait = baseCfg.short === "Idle" 
        ? 2000 + Math.random() * 3000 // tiap 2-5 detik
        : 4000 + Math.random() * 5000 // tiap 4-9 detik
        
      timeoutId = setTimeout(() => {
        // Pilih aksi acak tergantung state
        let newOverride: Partial<StateConfig> = {}
        const r = Math.random()
        
        if (baseCfg.short === "Idle") {
          if (r < 0.2) newOverride = { eyes: "wide", mouth: "oOpen", tail: "alert" }
          else if (r < 0.4) newOverride = { eyes: "halfClosed", tilt: 5, tail: "curled" }
          else if (r < 0.6) newOverride = { mouth: "smileBig", paws: "bothUp" }
          else if (r < 0.8) newOverride = { eyes: "lookUpRight", paws: "chinRest" }
          else newOverride = { paws: "earGroomEaster", tilt: -5 }
        } else if (baseCfg.short === "Happy") {
          if (r < 0.3) newOverride = { eyes: "wide", mouth: "oOpen" }
          else if (r < 0.6) newOverride = { tail: "dance", bounce: true }
        } else if (baseCfg.short === "Scared") {
          newOverride = { eyes: "dizzy", mouth: "sad" }
        } else if (baseCfg.short === "Angry") {
          newOverride = { mouth: "frown", tail: "curled" }
        }
        
        setOverride(newOverride)
        
        // Hapus override setelah 0.5 - 1.5 detik
        clearOverrideId = setTimeout(() => {
          setOverride(null)
          scheduleMicro()
        }, 500 + Math.random() * 1000)
        
      }, wait)
    }
    
    scheduleMicro()
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(clearOverrideId)
    }
  }, [baseCfg.short, active])
  
  return override ? { ...baseCfg, ...override } as StateConfig : baseCfg
}

interface MiawProps {
  state?: keyof typeof STATES
  animSpeed?: number
  animate?: boolean
}

export function Miaw({ state = "idleCalm", animSpeed = 1, animate = true }: MiawProps) {
  const baseCfg = STATES[state] || STATES.idleCalm
  const cfg = useMicroExpressions(baseCfg, animate)
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!animate) return
    let raf: number
    const start = performance.now()
    const tick = () => {
      setT((performance.now() - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animate])

  const { microTilt, easter } = useIdleMicroBehavior(
    animate && !!cfg.microTilt,
    animSpeed
  )

  let bodyTransform = ""
  if (animate) {
    if (cfg.dance) {
      // Gerak menari: kombinasi sin beda fase + tempo yang sedikit berubah
      // supaya terasa lincah, bukan loop datar.
      const beat = t * animSpeed
      const tempo = 2.4 + Math.sin(beat * 0.27) * 0.3
      const ph = beat * tempo
      const walk = Math.sin(ph * 0.5) * 6
      const hop = -Math.abs(Math.sin(ph)) * 4
      const sway = Math.sin(ph * 0.5 + 0.5) * 6
      const sx = 1 - Math.sin(ph * 2) * 0.03
      const sy = 1 + Math.sin(ph * 2) * 0.04
      bodyTransform = `translate(${(64 + walk).toFixed(2)} ${(32 + hop).toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) rotate(${sway.toFixed(2)}) translate(-64 -32)`
    } else {
      const breatheRate = cfg.breatheSlow ? 0.4 : 0.7
      const breathe = cfg.breathe ? 1 + Math.sin(t * breatheRate * animSpeed * Math.PI) * 0.012 : 1
      const bounce = cfg.bounce ? Math.sin(t * 3 * animSpeed) * 0.6 : 0
      const wobble = cfg.wobble ? Math.sin(t * 2 * animSpeed) * 3 : 0
      bodyTransform = `translate(64 ${32 + bounce}) scale(${breathe}) rotate(${wobble}) translate(-64 -32)`
    }
  }

  let tilt = cfg.tilt + (cfg.microTilt ? microTilt : 0)
  if (animate && cfg.dance) {
    tilt += Math.sin(t * animSpeed * 2.4 + 0.8) * 5
  }

  return (
    <svg
      viewBox="0 0 128 64"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
    >
      <g transform={`translate(64 33) scale(${CHAR_SCALE}) translate(-64 -33)`}>
        <g transform={bodyTransform}>
          {cfg.tail && <Tail pose={cfg.tail} t={t} animSpeed={animSpeed} />}
          <ChestBody />
          <g transform={`rotate(${tilt} 64 30)`}>
            <HeadAndEars />
            <Whiskers />
            <Nose shape={cfg.nose} />
            <Eyes kind={cfg.eyes} animSpeed={animSpeed} blinkOn={animate} />
            <Mouth kind={cfg.mouth} animSpeed={animSpeed} />
            {cfg.blush != null && <Blush size={cfg.blush} />}
          </g>
          <Paws pose={cfg.paws} t={t} animSpeed={animSpeed} easterPawVisible={easter} />
          <StateExtras state={cfg.extras} t={t} animSpeed={animSpeed} />
        </g>
      </g>
    </svg>
  )
}
