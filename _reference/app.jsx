// Miaw Character Design Sheet — page layout

const { useState } = React;

// ─── OLED Frame ──────────────────────────────────────────────────────
// Renders Miaw inside a stylized SSD1306-style monochrome OLED bezel.

function OLEDShell({ scale = 4, padding = 6, glow = '#5ec8ff', pixelColor = '#9ee2ff', children }) {
  // OLED inner canvas is 128x64; scaled by `scale`.
  const innerW = 128 * scale;
  const innerH = 64 * scale;
  return (
    <div
      className="oled-frame"
      style={{
        padding: padding,
        background: 'linear-gradient(180deg, #0e1525 0%, #060912 100%)',
        borderRadius: padding + 6,
        boxShadow: `0 0 0 1px #1d2540, 0 8px 28px rgba(8,12,32,0.35), inset 0 0 0 1px rgba(255,255,255,0.04)`,
        display: 'inline-block',
      }}
    >
      <div
        style={{
          width: innerW,
          height: innerH,
          background: 'radial-gradient(ellipse at center, #0b1a2e 0%, #050912 100%)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 0 ${20 + scale * 4}px ${glow}26, inset 0 0 0 1px rgba(94,200,255,0.10)`,
        }}
      >
        {/* Pixel-grid suggestion */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${glow}06 1px, transparent 1px), linear-gradient(90deg, ${glow}06 1px, transparent 1px)`,
          backgroundSize: `${scale}px ${scale}px`,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
        {/* Screen content in OLED color */}
        <div style={{ width: '100%', height: '100%', color: pixelColor, filter: `drop-shadow(0 0 ${scale}px ${glow}cc)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function OLEDFrame({ state, animSpeed, animate, scale = 4, padding = 6, glow = '#5ec8ff', pixelColor = '#9ee2ff' }) {
  return (
    <OLEDShell scale={scale} padding={padding} glow={glow} pixelColor={pixelColor}>
      <Miaw state={state} animSpeed={animSpeed} animate={animate} sw={1.8} />
    </OLEDShell>
  );
}

// Spotify-screen wrapper (live, mode-aware) ──────────────────────────
function SpotifyOLED({ songIndex, mode = 'playing', scale, padding = 6, glow, pixelColor, animate = true, speed = 1, prevSongTitle }) {
  const song = window.DEMO_SONGS[songIndex] || window.DEMO_SONGS[0];
  const effectiveMode = animate ? mode : (mode === 'playing' ? 'paused' : mode);
  const { time, t, modeT } = window.useSpotifyClock(song, effectiveMode, speed, songIndex);
  return (
    <OLEDShell scale={scale} padding={padding} glow={glow} pixelColor={pixelColor}>
      <window.SpotifyScreen
        mode={effectiveMode}
        song={song}
        time={time}
        t={t}
        modeT={modeT}
        prevSongTitle={prevSongTitle}
      />
    </OLEDShell>
  );
}

// ─── Annotated white-canvas (design reference) ──────────────────────

function DesignCanvas({ state, animSpeed, animate, scale = 4 }) {
  const innerW = 128 * scale;
  const innerH = 64 * scale;
  return (
    <div
      style={{
        width: innerW,
        height: innerH,
        background: '#ffffff',
        border: '1px solid #d8d2c4',
        borderRadius: 4,
        position: 'relative',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {/* px-grid for spec feel */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
        backgroundSize: `${scale * 8}px ${scale * 8}px`,
        pointerEvents: 'none',
      }} />
      <div style={{ width: '100%', height: '100%', color: '#000', position: 'relative', zIndex: 1 }}>
        <Miaw state={state} animSpeed={animSpeed} animate={animate} sw={1.8} />
      </div>
      {/* Corner crop marks */}
      <CropMark pos="tl" />
      <CropMark pos="tr" />
      <CropMark pos="bl" />
      <CropMark pos="br" />
    </div>
  );
}

function CropMark({ pos }) {
  const s = 10;
  const styles = {
    tl: { top: -s - 2, left: -s - 2, borderTop: '1px solid #9a9385', borderLeft: '1px solid #9a9385' },
    tr: { top: -s - 2, right: -s - 2, borderTop: '1px solid #9a9385', borderRight: '1px solid #9a9385' },
    bl: { bottom: -s - 2, left: -s - 2, borderBottom: '1px solid #9a9385', borderLeft: '1px solid #9a9385' },
    br: { bottom: -s - 2, right: -s - 2, borderBottom: '1px solid #9a9385', borderRight: '1px solid #9a9385' },
  };
  return <div style={{ position: 'absolute', width: s, height: s, ...styles[pos] }} />;
}

// ─── Annotation callout ──────────────────────────────────────────────

function Callout({ label, x, y, anchorX, anchorY, side = 'right' }) {
  // x, y in % of parent container; anchorX, anchorY where the line ends (in %)
  const isRight = side === 'right';
  return (
    <div
      className="callout"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translateY(-50%)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#3a3429',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        zIndex: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isRight ? 'row-reverse' : 'row' }}>
        <span style={{ background: '#fcfaf4', border: '1px solid #d8d2c4', padding: '3px 8px', borderRadius: 999, boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Hero section with annotations ───────────────────────────────────

const FEATURE_PINS = [
  { n: 1, top: 12, left: 39, label: 'Softened triangle ears w/ inner solid fill' },
  { n: 2, top: 46, left: 33, label: 'Big kawaii eyes — 4.6 px r · sparkle highlight' },
  { n: 3, top: 56, left: 64, label: 'Contextual blush · selective states only' },
  { n: 4, top: 60, left: 21, label: '1.5 px whiskers — 3 per side' },
  { n: 5, top: 58, left: 50, label: 'ω-shaped mouth · varies per state' },
  { n: 6, top: 84, left: 52, label: 'Rounded squircle body, 2.5 px outline' },
  { n: 7, top: 92, left: 14, label: 'Tail emerges off-canvas · state-specific pose' },
];

function HeroSection({ state, animSpeed, animate, oledGlow, oledPixel }) {
  const cfg = STATES[state];
  return (
    <section className="hero">
      <div className="hero-grid">
        {/* Left: design canvas (4x) with numbered pins */}
        <div className="hero-canvas-wrap">
          <div className="hero-label-row">
            <span className="kicker">Reference · 4× scale</span>
            <span className="kicker dim">512 × 256 px (target 128 × 64)</span>
          </div>
          <div className="canvas-stage">
            <div className="canvas-stage-inner">
              <DesignCanvas state={state} animSpeed={animSpeed} animate={animate} scale={4} />
              {FEATURE_PINS.map((p) => (
                <div key={p.n} className="pin" style={{ top: `${p.top}%`, left: `${p.left}%` }}>{p.n}</div>
              ))}
            </div>
          </div>
          <ol className="feature-legend">
            {FEATURE_PINS.map((p) => (
              <li key={p.n}>
                <span className="legend-num">{p.n}</span>
                <span className="legend-label">{p.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Right: OLED preview at 1x + 4x */}
        <div className="hero-oled-wrap">
          <div className="hero-label-row">
            <span className="kicker">On hardware</span>
            <span className="kicker dim">SSD1306 · 0.96″ mono</span>
          </div>

          <div className="oled-stack">
            <div className="oled-cell">
              <OLEDFrame state={state} animSpeed={animSpeed} animate={animate} scale={4} glow={oledGlow} pixelColor={oledPixel} />
              <div className="oled-cap">4× — production preview</div>
            </div>
            <div className="oled-cell">
              <div className="oled-1x-row">
                <OLEDFrame state={state} animSpeed={animSpeed} animate={animate} scale={1} padding={3} glow={oledGlow} pixelColor={oledPixel} />
                <div className="oled-1x-meta">
                  <div className="oled-cap" style={{ marginBottom: 4 }}>1× — actual pixel size</div>
                  <div className="oled-cap dim">128 × 64 · what the device shows</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-meta">
            <div className="hero-meta-row">
              <span className="hero-meta-k">State</span>
              <span className="hero-meta-v">{cfg.label}</span>
            </div>
            <div className="hero-meta-row">
              <span className="hero-meta-k">Trigger</span>
              <span className="hero-meta-v">{cfg.trigger}</span>
            </div>
            <div className="hero-meta-row">
              <span className="hero-meta-k">Animation</span>
              <span className="hero-meta-v mono">{cfg.anim}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Annotation({ children, top, left, align = 'right', line }) {
  const isLeft = align === 'left';
  const isCenter = align === 'center';
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        transform: isCenter ? 'translate(-50%, 0)' : (isLeft ? 'translate(0, -50%)' : 'translate(-100%, -50%)'),
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        lineHeight: 1.45,
        color: '#2a2620',
        textAlign: isCenter ? 'center' : (isLeft ? 'left' : 'right'),
        zIndex: 5,
      }}
    >
      <div style={{
        background: '#fcfaf4',
        border: '1px solid #d8d2c4',
        padding: '6px 10px',
        borderRadius: 6,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
        position: 'relative',
      }}>
        {children}
      </div>
      {line && (
        <svg width="320" height="80" style={{
          position: 'absolute',
          top: isCenter ? -90 : '50%',
          left: isLeft ? '100%' : (isCenter ? '50%' : 'auto'),
          right: isLeft || isCenter ? 'auto' : '100%',
          transform: isCenter ? 'translateX(-50%)' : 'translateY(-50%)',
          pointerEvents: 'none',
          overflow: 'visible',
        }}>
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#9a9385" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx={line.x2} cy={line.y2} r="2" fill="#9a9385" />
        </svg>
      )}
    </div>
  );
}

// ─── State card (grid) ───────────────────────────────────────────────

function StateCard({ stateKey, isActive, onClick, animSpeed, animate, oledGlow, oledPixel, idx }) {
  const cfg = STATES[stateKey];
  return (
    <div
      className={`state-card ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="state-card-head">
        <span className="state-card-num">{String(idx + 1).padStart(2, '0')}</span>
        <span className="state-card-title">{cfg.label}</span>
      </div>
      <div className="state-card-screen">
        <OLEDFrame state={stateKey} animSpeed={animSpeed} animate={animate} scale={2} padding={4} glow={oledGlow} pixelColor={oledPixel} />
      </div>
      <div className="state-card-body">
        <p className="state-desc">{cfg.desc}</p>
        <div className="state-meta">
          <div className="state-meta-row">
            <span className="state-meta-k">Triggered when</span>
            <span className="state-meta-v">{cfg.trigger}</span>
          </div>
          <div className="state-meta-row">
            <span className="state-meta-k">Animation</span>
            <span className="state-meta-v mono">{cfg.anim}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Spotify Lyrics Section ─────────────────────────────────────────

const SPOTIFY_ZONES = [
  { n: 1, label: 'Header · ♪ song title · MM:SS / MM:SS' },
  { n: 2, label: 'Progress bar (1 px) + playhead dot' },
  { n: 3, label: 'CURRENT lyric · 9 px · marquees if too long' },
  { n: 4, label: 'Next lyric · 7 px · fades in from below' },
  { n: 5, label: 'Miaw cameo · bobs to beat · happy ^_^' },
  { n: 6, label: 'Floating ♪ notes · drift up when playing' },
  { n: 7, label: 'Play/pause · 9-bar equalizer · volume' },
];

const SPOTIFY_MODES = [
  {
    id: 'intro',
    label: 'Intro',
    desc: 'Boot sequence. Logo pulses in, then "syncing lyrics…" fades to layout.',
    trigger: 'When the lyrics view first opens.',
    anim: 'Logo grows 1.5 s · text dot-blink · cross-fade 1.5 s',
  },
  {
    id: 'playing',
    label: 'Playing',
    desc: 'Lyrics scroll with cue. Miaw bobs happily. Notes float up.',
    trigger: 'Default when a track is playing.',
    anim: 'Cue slide+fade 450 ms · Miaw bob 1 Hz · waves live',
  },
  {
    id: 'paused',
    label: 'Paused',
    desc: 'Everything dims to 70%. PAUSED badge sits center. Waves flat.',
    trigger: 'User pauses playback.',
    anim: 'Static · badge solid · Miaw open-eye still',
  },
  {
    id: 'noSong',
    label: 'No song',
    desc: 'Pulsing "no song playing" message. Miaw sleeps in corner.',
    trigger: 'No active session detected.',
    anim: 'Title breathes 1.2 Hz · zZz rise · sleep eyes',
  },
  {
    id: 'changing',
    label: 'Changing',
    desc: 'Skip badge wipes across, old title dims, new title fades in.',
    trigger: 'Track changes / user skips.',
    anim: 'Skip wipe 500 ms · title swap 500 ms · loop 3.5 s',
  },
];

function SpotifyModeCard({ mode, isActive, onClick, song, oledGlow, oledPixel, animate, animSpeed }) {
  return (
    <div
      className={`mode-card ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="state-card-head">
        <span className="state-card-num">{mode.label.toLowerCase()}</span>
      </div>
      <div className="state-card-screen">
        <SpotifyOLED
          songIndex={song}
          mode={mode.id}
          scale={1.5}
          padding={4}
          glow={oledGlow}
          pixelColor={oledPixel}
          animate={animate}
          speed={animSpeed}
        />
      </div>
      <div className="state-card-body">
        <p className="state-desc">{mode.desc}</p>
        <div className="state-meta">
          <div className="state-meta-row">
            <span className="state-meta-k">Triggered when</span>
            <span className="state-meta-v">{mode.trigger}</span>
          </div>
          <div className="state-meta-row">
            <span className="state-meta-k">Animation</span>
            <span className="state-meta-v mono">{mode.anim}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpotifySection({ songIndex, setSongIndex, activeMode, setActiveMode, animSpeed, animate, oledGlow, oledPixel }) {
  const song = window.DEMO_SONGS[songIndex];
  const modeCfg = SPOTIFY_MODES.find((m) => m.id === activeMode) || SPOTIFY_MODES[1];
  // For 'changing' demo, use the next song's title as the wipe-in target
  const nextSongIdx = (songIndex + 1) % window.DEMO_SONGS.length;
  const prevSongTitle = window.DEMO_SONGS[nextSongIdx].title;

  return (
    <section className="spotify">
      <div className="spotify-hero">
        <div className="spotify-stage">
          <SpotifyOLED
            songIndex={songIndex}
            mode={activeMode}
            scale={4}
            glow={oledGlow}
            pixelColor={oledPixel}
            animate={animate}
            speed={animSpeed}
            prevSongTitle={prevSongTitle}
          />
        </div>

        <div className="spotify-aside">
          <div className="spotify-aside-head">
            <span className="kicker">Now showing</span>
            <span className="kicker dim mono">4× preview · live</span>
          </div>

          <div className="spotify-active-card">
            <div className="spotify-active-mode">
              <span className="spotify-active-label">{modeCfg.label}</span>
              <span className="spotify-active-tag mono">mode</span>
            </div>
            <p className="spotify-active-desc">{modeCfg.desc}</p>
            <div className="spotify-active-anim mono">{modeCfg.anim}</div>
          </div>

          <ol className="feature-legend spotify-legend">
            {SPOTIFY_ZONES.map((z) => (
              <li key={z.n}>
                <span className="legend-num">{z.n}</span>
                <span className="legend-label">{z.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <header className="section-head section-head-tight">
        <span className="section-eyebrow">04.1 · Screen modes</span>
        <h3>Five animated states</h3>
        <p className="section-sub">Each card animates its own loop. Click to pin it to the hero above.</p>
      </header>

      <div className="mode-grid">
        {SPOTIFY_MODES.map((m) => (
          <SpotifyModeCard
            key={m.id}
            mode={m}
            isActive={m.id === activeMode}
            onClick={() => setActiveMode(m.id)}
            song={songIndex}
            oledGlow={oledGlow}
            oledPixel={oledPixel}
            animate={animate}
            animSpeed={animSpeed}
          />
        ))}
      </div>

      <div className="song-picker">
        <div className="song-picker-head">
          <span>Demo track</span>
          <span className="kicker dim">tap to swap · {window.DEMO_SONGS.length} loaded · mixed lyric lengths</span>
        </div>
        <div className="song-picker-list">
          {window.DEMO_SONGS.map((s, i) => (
            <button
              key={i}
              className={`song-row ${i === songIndex ? 'is-active' : ''}`}
              onClick={() => setSongIndex(i)}
            >
              <span className="song-row-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="song-row-title">
                <strong>{s.title}</strong>
                <em>{s.artist}</em>
              </span>
              <span className="song-row-dur mono">{window.fmtSpotifyTime(s.duration)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="spotify-spec">
        <div className="spotify-spec-card">
          <div className="spec-card-title">Layout zones</div>
          <dl className="spec-list">
            <div><dt>Header strip</dt><dd>y 2–7 · mono 5.5 px · leaf icon + title + time</dd></div>
            <div><dt>Progress</dt><dd>y 12 · 1 px filled · 1.5 px playhead dot</dd></div>
            <div><dt>Current lyric</dt><dd>y 25 · 9 px · weight 600 · marquee if &gt; 13 ch</dd></div>
            <div><dt>Next lyric</dt><dd>y 39 · 7 px · ~45% opacity · marquee if &gt; 17 ch</dd></div>
            <div><dt>Bottom strip</dt><dd>y 49–63 · cameo · ♪ notes · play · waves · vol</dd></div>
          </dl>
        </div>
        <div className="spotify-spec-card">
          <div className="spec-card-title">Behaviour</div>
          <dl className="spec-list">
            <div><dt>Lyric transition</dt><dd>Slide up + fade · 450 ms cubic ease-out</dd></div>
            <div><dt>Long lyric</dt><dd>Ping-pong marquee · 14 px/s · 1 s pause each end</dd></div>
            <div><dt>Miaw cameo</dt><dd>Bobs 1 Hz · happy ^_^ · sway 0.5 Hz · pause = still</dd></div>
            <div><dt>Floating notes</dt><dd>3 notes, 3.2 s lifecycle each · play only</dd></div>
            <div><dt>Refresh budget</dt><dd>~10 fps on SSD1306 · diff-render only changed rows</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

// ─── Specs Section ───────────────────────────────────────────────────

function SpecsSection() {
  return (
    <section className="specs">
      <header className="section-head">
        <span className="section-eyebrow">05 · Specs</span>
        <h2>Design Specifications</h2>
        <p className="section-sub">Constraints carried into bitmap conversion.</p>
      </header>

      <div className="specs-grid">
        <div className="spec-card">
          <div className="spec-card-title">Canvas</div>
          <dl className="spec-list">
            <div><dt>Resolution</dt><dd>128 × 64 px</dd></div>
            <div><dt>Target</dt><dd>SSD1306 0.96″ mono OLED</dd></div>
            <div><dt>Color depth</dt><dd>1-bit · no AA</dd></div>
            <div><dt>Foreground</dt><dd><code>#000000</code> on <code>#FFFFFF</code></dd></div>
          </dl>
        </div>

        <div className="spec-card">
          <div className="spec-card-title">Line art</div>
          <dl className="spec-list">
            <div><dt>Outline weight</dt><dd>2.5 px (head + body) · 1.5 px (whiskers)</dd></div>
            <div><dt>Fill strategy</dt><dd>Selective — ears, pupils, nose, blush, paws</dd></div>
            <div><dt>Avoid</dt><dd>Gradients · shading · grayscale</dd></div>
            <div><dt>Embrace</dt><dd>High-contrast silhouette readability</dd></div>
          </dl>
        </div>

        <div className="spec-card">
          <div className="spec-card-title">Anatomy</div>
          <dl className="spec-list">
            <div><dt>Head height</dt><dd>~60% of canvas vertical</dd></div>
            <div><dt>Eye size</dt><dd>~20% of head width each</dd></div>
            <div><dt>Ear height</dt><dd>~30% of head height</dd></div>
            <div><dt>Mouth</dt><dd>Small, expressive, state-specific</dd></div>
            <div><dt>Body</dt><dd>Rounded squircle · 1.08× scale within canvas</dd></div>
          </dl>
        </div>

        <div className="spec-card">
          <div className="spec-card-title">Consistency</div>
          <dl className="spec-list">
            <div><dt>Shared</dt><dd>Proportions · outline weight · stroke join</dd></div>
            <div><dt>Variable</dt><dd>Eyes · mouth · paws · tail · blush · tilt · extras</dd></div>
            <div><dt>Thumbnail rule</dt><dd>Distinct at 32 × 16 px</dd></div>
            <div><dt>Frame budget</dt><dd>2–6 frames per loop</dd></div>
          </dl>
        </div>
      </div>

      <div className="specs-anim">
        <div className="specs-anim-head">Per-state animation hints</div>
        <div className="anim-grid">
          {Object.entries(STATES).map(([k, cfg], i) => (
            <div className="anim-row" key={k}>
              <span className="anim-row-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="anim-row-label">{cfg.label}</span>
              <span className="anim-row-hint">{cfg.anim}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── App ─────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "oledTone": "cyan",
  "animSpeed": 1.0,
  "animate": true,
  "bgTone": "cream",
  "songIndex": 0,
  "spotifyMode": "playing"
}/*EDITMODE-END*/;

const OLED_TONES = {
  cyan:  { glow: '#5ec8ff', pixel: '#9ee2ff' },
  white: { glow: '#dfe7f0', pixel: '#f5fbff' },
  amber: { glow: '#ffb45e', pixel: '#ffd591' },
  green: { glow: '#5effb4', pixel: '#9effc8' },
};

const BG_TONES = {
  cream: '#f5f1e8',
  slate: '#eaeaee',
  paper: '#fbf8f1',
};

function App() {
  const [activeState, setActiveState] = useState('idleCalm');
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const oled = OLED_TONES[tweaks.oledTone] || OLED_TONES.cyan;
  const bg = BG_TONES[tweaks.bgTone] || BG_TONES.cream;

  React.useEffect(() => {
    document.body.style.background = bg;
  }, [bg]);

  return (
    <div className="page">
      {/* Title header */}
      <header className="page-head">
        <div className="page-head-left">
          <div className="brand-mark">
            <svg viewBox="0 0 128 64" width="48" height="24"><Miaw state="idleCalm" animate={false} /></svg>
          </div>
          <div className="brand-text">
            <div className="brand-eyebrow">Character Bible · v1.0 · 2026</div>
            <h1>Miaw <span className="em">—</span> Anime Cat Mascot Design Sheet</h1>
            <p className="subtitle">8 Emotion States for OLED 128 × 64 Display</p>
            <p className="note">Style: Kawaii anime · monochrome line art + selective fill · SSD1306-ready</p>
          </div>
        </div>
        <div className="page-head-right">
          <div className="meta-chip"><span>Target</span><strong>SSD1306</strong></div>
          <div className="meta-chip"><span>Canvas</span><strong>128 × 64</strong></div>
          <div className="meta-chip"><span>States</span><strong>08</strong></div>
          <div className="meta-chip"><span>Palette</span><strong>1-bit</strong></div>
        </div>
      </header>

      <hr className="divider" />

      {/* Hero — selected state */}
      <header className="section-head section-head-row">
        <div>
          <span className="section-eyebrow">02 · Hero reference</span>
          <h2>Currently inspecting: <em>{STATES[activeState].label}</em></h2>
          <p className="section-sub">Click any card below to swap the hero into that state.</p>
        </div>
      </header>
      <HeroSection
        state={activeState}
        animSpeed={tweaks.animSpeed}
        animate={tweaks.animate}
        oledGlow={oled.glow}
        oledPixel={oled.pixel}
      />

      {/* 8 state grid */}
      <header className="section-head">
        <span className="section-eyebrow">03 · State library</span>
        <h2>Eight Emotion States</h2>
        <p className="section-sub">Same proportions and outline weight; only expression and pose change.</p>
      </header>

      <section className="state-grid">
        {Object.keys(STATES).map((k, i) => (
          <StateCard
            key={k}
            stateKey={k}
            idx={i}
            isActive={activeState === k}
            onClick={() => setActiveState(k)}
            animSpeed={tweaks.animSpeed}
            animate={tweaks.animate}
            oledGlow={oled.glow}
            oledPixel={oled.pixel}
          />
        ))}
      </section>

      {/* Spotify lyrics screen */}
      <header className="section-head">
        <span className="section-eyebrow">04 · Bonus screen</span>
        <h2>Spotify Lyrics Display</h2>
        <p className="section-sub">Two-line lyric focus, ticking playhead, mini Miaw cameo. Same canvas, different mode.</p>
      </header>

      <SpotifySection
        songIndex={tweaks.songIndex || 0}
        setSongIndex={(i) => setTweak('songIndex', i)}
        activeMode={tweaks.spotifyMode || 'playing'}
        setActiveMode={(m) => setTweak('spotifyMode', m)}
        animSpeed={tweaks.animSpeed}
        animate={tweaks.animate}
        oledGlow={oled.glow}
        oledPixel={oled.pixel}
      />

      {/* Specs */}
      <SpecsSection />

      <footer className="page-foot">
        <div className="foot-left">
          <span className="brand-eyebrow">Miaw · Character Bible</span>
          <span className="foot-dim">For internal art reference. Convert artwork → 1-bit XBM / Adafruit_GFX bitmap.</span>
        </div>
        <div className="foot-right mono">
          <span>v1.0 · 2026</span>
          <span>·</span>
          <span>states/8 · 128×64</span>
        </div>
      </footer>

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="OLED look">
          <window.TweakRadio
            label="Pixel tone"
            value={tweaks.oledTone}
            options={[
              { value: 'cyan', label: 'Cyan' },
              { value: 'white', label: 'White' },
              { value: 'amber', label: 'Amber' },
              { value: 'green', label: 'Green' },
            ]}
            onChange={(v) => setTweak('oledTone', v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Animation">
          <window.TweakToggle
            label="Animate"
            value={tweaks.animate}
            onChange={(v) => setTweak('animate', v)}
          />
          <window.TweakSlider
            label="Speed"
            value={tweaks.animSpeed}
            min={0.25}
            max={2.5}
            step={0.05}
            onChange={(v) => setTweak('animSpeed', v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Page tone">
          <window.TweakRadio
            label="Background"
            value={tweaks.bgTone}
            options={[
              { value: 'cream', label: 'Cream' },
              { value: 'paper', label: 'Paper' },
              { value: 'slate', label: 'Slate' },
            ]}
            onChange={(v) => setTweak('bgTone', v)}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
