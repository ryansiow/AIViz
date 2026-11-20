<script setup lang="ts">
import type { NumberParam, PadVector, ParamSchema, Preset, SelectParam, ToggleParam, Vector2Param } from '~/types/concept'
import { defaultsOf } from '~/types/concept'

/**
 * Builds the Inputs card from a concept's ParamSchema.
 * Vectors get numeric fields plus one shared drag pad.
 */
const props = defineProps<{
  schema: ParamSchema
  modelValue: Record<string, unknown>
  presets?: Preset[]
}>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, unknown>] }>()

const activePreset = ref<number | null>(null)

function set(key: string, value: unknown) {
  activePreset.value = null
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const entries = computed(() => Object.entries(props.schema))
const vectorEntries = computed(() => entries.value.filter(([, s]) => s.kind === 'vector2') as [string, Vector2Param][])

const padVectors = computed<PadVector[]>(() =>
  vectorEntries.value.map(([key, spec]) => ({
    key,
    label: spec.label,
    hue: spec.hue,
    value: props.modelValue[key] as [number, number],
    nonZero: spec.nonZero,
  })),
)
// The pad uses the widest range of all vectors.
const padRange = computed<[number, number]>(() => {
  const r = vectorEntries.value.map(([, s]) => s.range)
  return [Math.min(...r.map((x) => x[0])), Math.max(...r.map((x) => x[1]))]
})

function applyPreset(i: number) {
  const p = props.presets?.[i]
  if (!p) return
  emit('update:modelValue', { ...props.modelValue, ...structuredClone(toRaw(p.values)) })
  activePreset.value = i
}
function reset() {
  emit('update:modelValue', defaultsOf(props.schema))
  activePreset.value = null
}

const asNumber = (s: unknown) => s as NumberParam
const asVector = (s: unknown) => s as Vector2Param
const asSelect = (s: unknown) => s as SelectParam
const asToggle = (s: unknown) => s as ToggleParam
</script>

<template>
  <div class="params">
    <template v-for="[key, spec] in entries" :key="key">
      <VectorField
        v-if="spec.kind === 'vector2'"
        :spec="asVector(spec)"
        :model-value="modelValue[key] as [number, number]"
        @update:model-value="set(key, $event)"
      />
      <SliderField
        v-else-if="spec.kind === 'number' && spec.control !== 'field'"
        :spec="asNumber(spec)"
        :model-value="modelValue[key] as number"
        @update:model-value="set(key, $event)"
      />
      <div v-else-if="spec.kind === 'number'" class="field-row">
        <span class="field-label"><Tex v-if="spec.tex" :expr="spec.tex" /><template v-else>{{ spec.label }}</template></span>
        <NumberField
          :model-value="modelValue[key] as number"
          :min="asNumber(spec).min"
          :max="asNumber(spec).max"
          :step="asNumber(spec).step ?? 1"
          :label="spec.label"
          @update:model-value="set(key, $event)"
        />
      </div>
      <SelectField
        v-else-if="spec.kind === 'select'"
        :spec="asSelect(spec)"
        :model-value="modelValue[key] as string"
        @update:model-value="set(key, $event)"
      />
      <ToggleField
        v-else-if="spec.kind === 'toggle'"
        :spec="asToggle(spec)"
        :model-value="modelValue[key] as boolean"
        @update:model-value="set(key, $event)"
      />
    </template>

    <VectorPad
      v-if="padVectors.length"
      :vectors="padVectors"
      :range="padRange"
      :step="vectorEntries[0]?.[1].step ?? 1"
      @update="set"
    />

    <PresetChips v-if="presets?.length" :presets="presets" :active="activePreset" @apply="applyPreset" @reset="reset" />
  </div>
</template>

<style scoped>
.params { display: flex; flex-direction: column; gap: 10px; }
.field-row { display: grid; grid-template-columns: 1fr 96px; align-items: center; gap: 8px; }
.field-label { font-size: 13px; color: var(--text-dim); }
</style>
