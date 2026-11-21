import type { BuildContext } from './types'

/**
 * Reusable animation beats for build(). Every beat uses fromTo, so the
 * hidden state is applied when the timeline is built and scrubbing back
 * restores it exactly. Timings follow the motion rules: one lead per step,
 * accents land with the lead, labels overlap the end of the draw.
 */

type Ctx = BuildContext<unknown>
type Targets = Element[]
// Beats skip empty target lists (optional elements), which GSAP would warn about.

/** Draw a stroke from its start (lines, arcs). The lead of a step. */
export function drawIn(ctx: Ctx, t: Targets, at: number, duration = 0.7, ease = 'power2.out') {
  if (!t.length) return
  ctx.tl.fromTo(t, { drawSVG: '0%' }, { drawSVG: '100%', duration, ease }, at)
}

/** Fade in place. For decoration (grids, guides, fills). */
export function fadeIn(ctx: Ctx, t: Targets, at: number, duration = 0.4, to = 1) {
  if (!t.length) return
  ctx.tl.fromTo(t, { opacity: 0 }, { opacity: to, duration, ease: 'power1.out' }, at)
}

/** Fade with a small rise. For labels and support text. */
export function riseIn(ctx: Ctx, t: Targets, at: number, duration = 0.35, distance = 4) {
  if (!t.length) return
  ctx.tl.fromTo(t, { opacity: 0, y: distance }, { opacity: 1, y: 0, duration, ease: 'power2.out' }, at)
}

/** Scale up from 60% with a fade. For arrowheads and points landing with a line. */
export function popIn(ctx: Ctx, t: Targets, at: number, duration = 0.2) {
  if (!t.length) return
  ctx.tl.fromTo(
    t,
    { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
    { opacity: 1, scale: 1, duration, ease: 'power2.out' },
    at,
  )
}

/**
 * Make hover targets live from this moment on (and dead again when scrubbed back).
 * Uses autoAlpha (opacity + visibility): hidden elements get no pointer events.
 * A real, tiny duration is used on purpose: zero-duration fromTo tweens placed
 * later in a paused timeline do not apply their start state, which left every
 * hover target live from the first frame.
 */
export function activate(ctx: Ctx, t: Targets, at: number) {
  if (!t.length) return
  ctx.tl.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, at)
}

/**
 * The standard vector entrance: the line draws (lead), the arrowhead lands
 * as the line reaches the tip, the label rises in overlapping the end.
 * Returns the time the beat finishes.
 */
export function vectorIn(ctx: Ctx, el: string, at: number): number {
  const draw = 0.7
  drawIn(ctx, ctx.el(`${el}-line`), at, draw)
  popIn(ctx, ctx.el(`${el}-head`), at + draw * 0.8)
  riseIn(ctx, ctx.el(`${el}-label`), at + draw * 0.65)
  activate(ctx, ctx.el(`${el}-hit`), at + draw)
  return at + draw * 0.65 + 0.35
}

/** Angle arc entrance: arc draws, wedge and label follow. */
export function arcIn(ctx: Ctx, el: string, at: number): number {
  drawIn(ctx, ctx.el(`${el}-arc`), at, 0.5, 'power1.inOut')
  fadeIn(ctx, ctx.el(`${el}-fill`), at + 0.2, 0.4, 0.1)
  riseIn(ctx, ctx.el(`${el}-label`), at + 0.3, 0.3)
  activate(ctx, ctx.el(`${el}-hit`), at + 0.5)
  return at + 0.6
}

/** Hold the timeline open until `at` so a step has time to be read. */
export function holdUntil(ctx: Ctx, at: number) {
  if (ctx.tl.duration() < at) ctx.tl.set({}, {}, at)
}

/**
 * Fade an element that is already on stage down to `to`, to move attention
 * elsewhere. immediateRender is off: it follows the element's own entrance.
 */
export function dim(ctx: Ctx, t: Targets, at: number, to = 0.25, duration = 0.35) {
  if (!t.length) return
  ctx.tl.fromTo(t, { opacity: 1 }, { opacity: to, duration, ease: 'power1.inOut', immediateRender: false }, at)
}

/** Fade a transient element (a highlight) out again. */
export function fadeOut(ctx: Ctx, t: Targets, at: number, duration = 0.25) {
  if (!t.length) return
  ctx.tl.fromTo(t, { opacity: 1 }, { opacity: 0, duration, ease: 'power1.in', immediateRender: false }, at)
}
