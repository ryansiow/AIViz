<script setup lang="ts">
import { hueVar, type Readout } from '~/types/concept'
import { formatNumber } from '~/utils/math'

/** Grid of live values, each coloured by its role, plus an optional formula. */
defineProps<{ readouts: Readout[]; formula?: string; formulaHue?: Readout['hue'] }>()
</script>

<template>
  <div>
    <dl class="readouts">
      <div v-for="r in readouts" :key="r.tex" class="ro">
        <dt class="k"><Tex :expr="r.tex" /></dt>
        <dd class="v" :style="{ color: hueVar(r.hue) }">{{ formatNumber(r.value, r.digits ?? 3) }}</dd>
      </div>
    </dl>
    <div
      v-if="formula"
      class="formula"
      :style="{ color: hueVar(formulaHue ?? 'green'), background: `var(--c-${formulaHue ?? 'green'}-soft)` }"
    >
      <Tex :expr="formula" />
    </div>
  </div>
</template>

<style scoped>
.readouts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
.k { min-height: 20px; font-size: 12px; color: var(--text-faint); }
.v { font: 500 17px var(--font-mono); font-variant-numeric: tabular-nums; }
.formula { margin-top: 12px; padding: 8px 10px; border-radius: var(--radius); overflow-x: auto; }
.formula :deep(.katex) { font-size: 0.95em; }
</style>
