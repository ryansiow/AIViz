<script setup lang="ts">
/**
 * Playback controls. Phase 3 wires these to the concept timeline
 * (progress = timeline.progress(), markers = timeline labels).
 */
withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: true })
</script>

<template>
  <div class="player" :class="{ disabled }" :aria-disabled="disabled">
    <button class="round pressable" aria-label="Previous step" :disabled="disabled">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
    </button>
    <button class="round play pressable" aria-label="Play" :disabled="disabled">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" class="fill" /></svg>
    </button>
    <button class="round pressable" aria-label="Next step" :disabled="disabled">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
    </button>
    <div class="track">
      <input type="range" min="0" max="1000" value="0" aria-label="Seek" :disabled="disabled" />
    </div>
    <span class="pill">0 / 0</span>
    <button class="speed" :disabled="disabled">1×</button>
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
@media (hover: hover) and (pointer: fine) { .round:not(:disabled):hover { background: var(--surface); } }
.round svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.round svg .fill { fill: currentColor; stroke: none; }
.round.play { width: 40px; height: 40px; background: var(--text); color: var(--bg); border-color: var(--text); }
.track { position: relative; flex: 1; height: 24px; }
.track input { position: absolute; inset: 0; width: 100%; appearance: none; background: transparent; }
.track input::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: var(--surface-2); }
.track input::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%; background: var(--bg); border: 2px solid var(--brand); }
.track input::-moz-range-track { height: 4px; background: var(--surface-2); }
.track input::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--bg); border: 2px solid var(--brand); }
.pill { padding: 4px 10px; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 600; color: var(--text-dim); white-space: nowrap; }
.speed { font-size: 12px; color: var(--text-dim); padding: 4px 8px; border-radius: var(--radius-sm); }

@media (max-width: 560px) {
  .player { gap: 8px; padding: 12px; }
  .speed { display: none; }
}
</style>
