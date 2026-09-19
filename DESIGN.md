# Design Brief

## Direction

Bench Instrument — a dark-first control-room dashboard that reads like a calibrated measurement instrument for an ESP32 + DHT11 + MQ-2 rig.

## Tone

Industrial/utilitarian executed with precision: dense, technical, phosphor-lit, zero decoration that does not carry information.

## Differentiation

The **LCD phosphor echo strip** — the header reproduces the physical 16×2 I2C readout (`T: 25.0C H: 60% / G: 422 S: 1 Ok`) in glowing cyan monospace, so the screen feels like a live window into the hardware on the bench.

## Color Palette

| Token      | OKLCH           | Role                                    |
| ---------- | --------------- | --------------------------------------- |
| background | 0.145 0.018 250 | Dark control-room base (primary mode)   |
| foreground | 0.94 0.008 245  | Primary text, near-white cool ink       |
| card       | 0.185 0.02 250  | Instrument panel surfaces               |
| primary    | 0.78 0.13 195   | Phosphor cyan signal / active states    |
| accent     | 0.78 0.13 195   | Same family — used sparingly for focus  |
| muted      | 0.235 0.022 250 | Inactive chips, log rows, secondary UI  |
| success    | 0.74 0.16 152   | Stable status (green)                   |
| warning    | 0.79 0.15 78    | Warning status (amber)                  |
| unstable   | 0.66 0.21 25    | Unstable status (red)                   |

Light mode is a deliberate "lab bench daylight" variant: cool paper `0.965 0.006 245`, deep ink text, teal primary `0.5 0.115 210`; the status triad darkens to `0.52/0.62/0.52` at matching hues so all three remain AA on white.

## Typography

- Display: JetBrains Mono — headings, section labels, and the large numeric readouts
- Body: Satoshi — labels, descriptions, log text
- Mono: Geist Mono — LCD echo strip, timestamps, raw ADC values
- Scale: hero `text-5xl md:text-6xl readout`, h2 `text-lg font-semibold tracking-tight`, label `text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground`, body `text-sm`

## Elevation & Depth

Flat panels with a 1px border and `shadow-inset-soft` for a machined-metal edge; `shadow-elevated` only on the overall status banner, `shadow-signal` reserved for the live/active indicator.

## Structural Zones

| Zone    | Background                  | Border        | Notes                                                        |
| ------- | --------------------------- | ------------- | ------------------------------------------------------------ |
| Header  | `bg-card` + `panel-grid`    | `border-b`    | Rig identity left, LCD echo strip right, live pulse dot      |
| Content | `bg-background`             | —             | Status banner → readout cards → chart → log; `bg-muted/30` alternates |
| Footer  | `bg-muted/40`               | `border-t`    | Monospace build/sensor provenance line, low emphasis         |

## Spacing & Rhythm

Page gutters `p-4 md:p-6`, section gaps `space-y-4 md:space-y-6`, card padding `p-4 md:p-5`, micro-spacing `gap-1.5` inside labels and `gap-3` inside card headers.

## Component Patterns

- Buttons: square-ish `rounded-sm`, `bg-primary text-primary-foreground`, hover `brightness-110` + `shadow-signal`; ghost variants for theme toggle
- Cards: `rounded-md border border-border bg-card`, no drop shadow, `shadow-inset-soft`; status accent rendered as a 3px left border in the status hue
- Badges: `rounded-sm` pill, `bg-{status}/15 text-{status} border border-{status}/30`, uppercase 11px tracking-widest with a 6px status dot

## Motion

- Entrance: `animate-tick-in` on log rows as new readings arrive (0.28s ease-out)
- Hover: `transition-smooth` brightness/border shifts on cards and buttons
- Decorative: `status-pulse` on the live dot and Unstable badges; `sweep` shimmer on the chart's "live" edge

## Constraints

- Never use raw hex/rgb or arbitrary color classes — semantic tokens only (`bg-success`, `text-warning`, `border-unstable`)
- Status color must never be the sole signal: pair every badge with its text label and dot
- Numeric readouts use tabular figures so digits do not jitter as values drift
- No buzzer, threshold-config, vibration, or alert-history UI — not in scope
- Dark mode is primary; light mode must remain fully legible, not an inverted afterthought

## Signature Detail

The LCD phosphor echo strip in the header — a glowing cyan monospace line mirroring the physical 16×2 display, tying the dashboard to the hardware on the bench.
