<script setup lang="ts">
import { hueSoftVar, hueVar, type Vector2Param } from '~/types/concept'

/** A 2D vector as a coloured badge plus two numeric fields. */
const props = defineProps<{ modelValue: [number, number]; spec: Vector2Param }>()
const emit = defineEmits<{ 'update:modelValue': [[number, number]] }>()

const error = ref('')
const comps = computed(() => props.spec.components ?? ['x_1', 'x_2'])

function set(i: 0 | 1, v: number) {
  const next: [number, number] = [...props.modelValue]
  next[i] = v
  if (props.spec.nonZero && next[0] === 0 && next[1] === 0) {
    error.value = `${props.spec.label} can’t be the zero vector.`
    return
  }
  error.value = ''
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="vec">
    <div class="row">
      <span class="badge" :style="{ color: hueVar(spec.hue), background: hueSoftVar(spec.hue) }" :title="spec.label">
        <Tex :expr="spec.tex ?? spec.label" />
      </span>
      <NumberField
        :model-value="modelValue[0]"
        :min="spec.range[0]"
        :max="spec.range[1]"
        :step="spec.step ?? 1"
        :tex="comps[0]"
        :label="`${spec.label} first component`"
        @update:model-value="set(0, $event)"
      />
      <NumberField
        :model-value="modelValue[1]"
        :min="spec.range[0]"
        :max="spec.range[1]"
        :step="spec.step ?? 1"
        :tex="comps[1]"
        :label="`${spec.label} second component`"
        @update:model-value="set(1, $event)"
      />
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.row { display: grid; grid-template-columns: 24px 1fr 1fr; gap: 8px; align-items: center; }
.badge { width: 22px; height: 22px; border-radius: var(--radius-sm); display: grid; place-items: center; }
.error { margin: 6px 0 0 32px; font-size: 12px; color: var(--c-rose); }
</style>
