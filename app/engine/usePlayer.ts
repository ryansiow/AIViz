import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue'
import type { LogEntry } from '~/types/concept'
import { getGsap } from './gsap'
import type { AnyConceptModule } from './types'

/**
 * Drives one concept's GSAP timeline.
 *
 * - The timeline is always paused; play/next/seek move it explicitly.
 * - Steps are timeline labels. Step i spans [label i, label i+1).
 * - `next` plays the rest of the current step, or the whole next step,
 *   then stops at that step's end. `prev` jumps to the end of the step before.
 * - Changing inputs re-derives data; the scene re-renders and the timeline is
 *   rebuilt and put back at the same progress (playing continues).
 * - Reduced motion: no tweening. Play and next jump between finished steps.
 */
export function usePlayer(module: Ref<AnyConceptModule | null>, values: Ref<Record<string, unknown>>, root: Ref<Element | null | undefined>) {
  // Values come from the module's own schema (defaultsOf + ParamPanel), so the cast is safe.
  const derived = computed(() =>
    module.value ? module.value.derive(values.value as Parameters<AnyConceptModule['derive']>[0]) : null,
  )

  const progress = ref(0)
  const playing = ref(false)
  const speed = ref(1)
  const duration = ref(0)
  /** Start of each step as a fraction of the timeline. */
  const markers = ref<number[]>([])
  const reduced = ref(false)
  /** False until the first build, so the server-rendered (fully drawn) scene never flashes. */
  const ready = ref(false)

  const tl = shallowRef<gsap.core.Timeline | null>(null)
  let stopAt: number | null = null
  let reducedTimer: ReturnType<typeof setInterval> | undefined
  let built = false

  const steps = computed(() => module.value?.steps ?? [])
  const total = computed(() => steps.value.length)

  const stepIndex = computed(() => {
    let i = 0
    markers.value.forEach((m, k) => {
      if (progress.value >= m - 1e-6) i = k
    })
    return i
  })

  /** Time (s) at which step i is fully drawn: just before the next step starts. */
  function stepEnd(i: number): number {
    const t = tl.value
    if (!t) return 0
    if (i >= total.value - 1) return t.duration()
    return Math.max(0, markers.value[i + 1]! * t.duration() - 0.001)
  }
  const stepStart = (i: number) => (tl.value ? markers.value[i]! * tl.value.duration() : 0)

  function onUpdate() {
    const t = tl.value
    if (!t) return
    if (stopAt !== null && t.time() >= stopAt) {
      t.pause(stopAt)
      stopAt = null
      playing.value = false
    }
    progress.value = t.progress()
  }

  function build() {
    const mod = module.value
    const d = derived.value
    const el = root.value
    if (!mod || !d || !el) return
    const gsap = getGsap()

    const prev = tl.value
    const keepTime = prev ? prev.time() : 0
    const wasPlaying = playing.value && !reduced.value
    const keepStop = stopAt
    if (prev) {
      prev.revert()
      prev.kill()
    }

    const t = gsap.timeline({
      paused: true,
      onUpdate,
      onComplete: () => {
        playing.value = false
      },
    })
    const q = gsap.utils.selector(el)
    const seen: string[] = []
    mod.build({
      tl: t,
      d,
      el: (name) => q(`[data-el="${name}"]`),
      step: (id, at) => {
        t.addLabel(id, at)
        seen.push(id)
      },
    })
    if (import.meta.dev) {
      const expected = mod.steps.map((s) => s.id)
      if (expected.join() !== seen.join()) console.warn('[player] step labels do not match steps:', { expected, seen })
    }

    tl.value = t
    duration.value = t.duration()
    markers.value = mod.steps.map((s) => (t.labels[s.id] ?? 0) / (t.duration() || 1))
    t.timeScale(speed.value)

    // First build: show step 1 finished, so the stage is never blank.
    t.pause(built ? Math.min(keepTime, t.duration()) : stepEnd(0))
    built = true
    ready.value = true
    progress.value = t.progress()
    stopAt = keepStop
    if (wasPlaying) t.play()
  }

  // Rebuild after the scene has re-rendered with the new data.
  watch([derived, root], async () => {
    await nextTick()
    build()
  })

  function clearReducedTimer() {
    clearInterval(reducedTimer)
    reducedTimer = undefined
  }

  function pause() {
    clearReducedTimer()
    tl.value?.pause()
    stopAt = null
    playing.value = false
  }

  function play() {
    const t = tl.value
    if (!t) return
    if (t.progress() >= 1) t.pause(0)
    stopAt = null
    playing.value = true
    if (reduced.value) {
      // Show each finished step in turn instead of animating.
      clearReducedTimer()
      reducedTimer = setInterval(() => {
        const i = stepIndex.value
        if (i >= total.value - 1 && t.progress() >= 1) return pause()
        t.pause(t.time() < stepEnd(i) - 0.01 ? stepEnd(i) : stepEnd(i + 1))
        progress.value = t.progress()
      }, 1400)
      return
    }
    t.play()
  }

  function toggle() {
    playing.value ? pause() : play()
  }

  /** Jump to a fraction of the timeline (scrubber). */
  function seek(p: number) {
    const t = tl.value
    if (!t) return
    clearReducedTimer()
    stopAt = null
    playing.value = false
    t.pause(Math.min(1, Math.max(0, p)) * t.duration())
    progress.value = t.progress()
  }

  /** Play to the end of the current step, or through the next one. */
  function next() {
    const t = tl.value
    if (!t) return
    clearReducedTimer()
    const i = stepIndex.value
    const unfinished = t.time() < stepEnd(i) - 0.01
    const target = unfinished ? i : Math.min(i + 1, total.value - 1)
    if (!unfinished && i >= total.value - 1) return
    if (reduced.value) {
      t.pause(stepEnd(target))
      progress.value = t.progress()
      playing.value = false
      return
    }
    if (!unfinished) t.pause(stepStart(target))
    stopAt = stepEnd(target)
    playing.value = true
    t.play()
  }

  /** Jump to the finished state of the previous step. */
  function prev() {
    const t = tl.value
    if (!t) return
    pause()
    const i = stepIndex.value
    t.pause(i === 0 ? 0 : stepEnd(i - 1))
    progress.value = t.progress()
  }

  /** Jump to the finished state of step i. */
  function goToStep(i: number) {
    const t = tl.value
    if (!t) return
    pause()
    t.pause(stepEnd(Math.max(0, Math.min(i, total.value - 1))))
    progress.value = t.progress()
  }

  function setSpeed(s: number) {
    speed.value = s
    tl.value?.timeScale(s)
  }

  const caption = computed(() => (derived.value ? steps.value[stepIndex.value]?.caption(derived.value) ?? '' : ''))

  const log = computed<LogEntry[]>(() => {
    const d = derived.value
    if (!d || !ready.value) return []
    return steps.value
      .slice(0, stepIndex.value + 1)
      .flatMap((s, i) => (s.log ? [{ step: i + 1, segments: s.log(d) }] : []))
  })

  const readouts = computed(() => (derived.value && module.value?.readouts ? module.value.readouts(derived.value) : []))
  const formula = computed(() => (derived.value && module.value?.formula ? module.value.formula(derived.value) : undefined))

  const timeLabel = computed(() => {
    const f = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    return `${f(progress.value * duration.value)} / ${f(duration.value)}`
  })

  let mq: MediaQueryList | undefined
  const onMq = (e: MediaQueryListEvent) => (reduced.value = e.matches)
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    mq.addEventListener('change', onMq)
    // Test hook: lets end-to-end tests drive the player deterministically.
    ;(window as unknown as { __aiviz?: unknown }).__aiviz = {
      seek,
      goToStep,
      progress: () => progress.value,
      step: () => stepIndex.value,
      playing: () => playing.value,
    }
  })
  onBeforeUnmount(() => {
    mq?.removeEventListener('change', onMq)
    clearReducedTimer()
    tl.value?.kill()
    delete (window as unknown as { __aiviz?: unknown }).__aiviz
  })

  return {
    ready,
    derived,
    progress,
    playing,
    speed,
    duration,
    markers,
    stepIndex,
    total,
    caption,
    log,
    readouts,
    formula,
    timeLabel,
    play,
    pause,
    toggle,
    seek,
    next,
    prev,
    goToStep,
    setSpeed,
  }
}
