<script setup lang="ts">
/**
 * Playback controls for a concept timeline. Presentational: the page owns the
 * player and passes state down. Step markers jump to that step's finished frame.
 */
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    playing?: boolean
    progress?: number
    markers?: number[]
    step?: number
    total?: number
    speed?: number
    time?: string
    stepNames?: string[]
  }>(),
  { disabled: true, playing: false, progress: 0, markers: () => [], step: 0, total: 0, speed: 1, time: '' },
)
const emit = defineEmits<{ toggle: []; prev: []; next: []; seek: [number]; step: [number]; speed: [number] }>()

const SPEEDS = [1, 1.5, 2, 0.5]
function cycleSpeed() {
  const i = SPEEDS.indexOf(props.speed)
  emit('speed', SPEEDS[(i + 1) % SPEEDS.length]!)
}
</script>

<template>
  <div class="player" :class="{ disabled }" :aria-disabled="disabled">
    <button class="round pressable" aria-label="Previous step" :disabled="disabled" @click="emit('prev')">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
    </button>
    <button class="round play pressable" :aria-label="playing ? 'Pause' : 'Play'" :disabled="disabled" @click="emit('toggle')">
      <svg v-if="playing" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" class="bars" /></svg>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" class="fill" /></svg>
    </button>
    <button class="round pressable" aria-label="Next step" :disabled="disabled" @click="emit('next')">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
    </button>

    <div class="track" :style="{ '--p': `${progress * 100}%` }">
      <div class="fill-bar" aria-hidden="true" />
      <button
        v-for="(m, i) in markers"
        :key="i"
        class="marker"
        :class="{ passed: i <= step }"
        :style="{ left: `${m * 100}%` }"
        :aria-label="`Go to step ${i + 1}${stepNames?.[i] ? `: ${stepNames[i]}` : ''}`"
        :disabled="disabled"
        tabindex="-1"
        @click="emit('step', i)"
      />
      <input
        type="range"
        min="0"
        max="1000"
        :value="Math.round(progress * 1000)"
        aria-label="Seek"
        :aria-valuetext="`Step ${step + 1} of ${total}`"
        :disabled="disabled"
        @input="emit('seek', Number(($event.target as HTMLInputElement).value) / 1000)"
      />
    </div>

    <span class="pill" aria-live="polite">{{ total ? `${step + 1} / ${total}` : '0 / 0' }}</span>
    <span v-if="time" class="time">{{ time }}</span>
    <button class="speed" :disabled="disabled" :aria-label="`Playback speed ${speed}×`" @click="cycleSpeed">{{ speed }}×</button>
  </div>
</template>

<style scoped>
.player { display: flex; align-items: center; gap: 12px; padding: 14px 18px 16px; }
.player.disabled { opacity: 0.5; }
button:disabled, input:disabled { cursor: not-allowed; }
.round {
  width: 34px; height: 34px; flex: none; border-radius: 50%; display: grid; place-items: center;
  border: 1px solid var(--line); color: var(--text-dim);
}
@media (hover: hover) and (pointer: fine) { .round:not(:disabled):hover { background: var(--surface); color: var(--text); } }
.round svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.round svg .fill { fill: currentColor; stroke: none; }
.round svg .bars { stroke-width: 2.4; }
.round.play { width: 40px; height: 40px; background: var(--text); color: var(--bg); border-color: var(--text); }
@media (hover: hover) and (pointer: fine) { .round.play:not(:disabled):hover { background: var(--text); color: var(--bg); opacity: 0.9; } }

.track { position: relative; flex: 1; height: 24px; min-width: 80px; }
.fill-bar {
  position: absolute; left: 0; right: 0; top: 10px; height: 4px; border-radius: 2px; pointer-events: none;
  background: linear-gradient(to right, color-mix(in srgb, var(--brand) 40%, transparent) var(--p), var(--surface-2) var(--p));
}
.marker {
  position: absolute; top: 9px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%;
  background: var(--line-strong); z-index: 3;
}
.marker.passed { background: var(--brand); }
.track input { position: absolute; inset: 0; width: 100%; appearance: none; background: transparent; cursor: pointer; z-index: 2; }
.track input::-webkit-slider-runnable-track { height: 4px; background: transparent; }
.track input::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%; background: var(--bg); border: 2px solid var(--brand); position: relative; z-index: 4; }
.track input::-moz-range-track { height: 4px; background: transparent; }
.track input::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--bg); border: 2px solid var(--brand); }
.pill { padding: 4px 10px; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 600; color: var(--text-dim); white-space: nowrap; font-variant-numeric: tabular-nums; }
.time { font: 12px var(--font-mono); color: var(--text-faint); white-space: nowrap; font-variant-numeric: tabular-nums; }
.speed { font-size: 12px; color: var(--text-dim); padding: 4px 8px; border-radius: var(--radius-sm); min-width: 40px; font-variant-numeric: tabular-nums; }
@media (hover: hover) and (pointer: fine) { .speed:not(:disabled):hover { background: var(--surface); color: var(--text); } }

@media (max-width: 560px) {
  .player { gap: 8px; padding: 12px; }
  .speed, .time { display: none; }
}
</style>
