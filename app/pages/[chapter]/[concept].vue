<script setup lang="ts">
import { loadConcept } from '~/concepts/registry'
import { findConcept } from '~/data/curriculum'
import { usePlayer } from '~/engine/usePlayer'
import type { AnyConceptModule } from '~/engine/types'
import { defaultsOf } from '~/types/concept'
import { explainPath } from '~/utils/explain'

// Remount for each concept so the player, inputs and timeline start fresh.
definePageMeta({ key: (route) => route.path })

const route = useRoute()
const found = findConcept(route.params.chapter as string, route.params.concept as string)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Concept not found', fatal: true })
}
const { view } = useConceptView()

// Load the explainer whatever the view, so it is prerendered into this page's payload.
// (Fetching it only when Explain opens would make the static site query the content
// database in the browser, which downloads SQLite WASM.)
const docPath = explainPath(found.chapter.slug, found.concept.slug)
const { data: explainDoc } = await useAsyncData(`explain:${docPath}`, () =>
  queryCollection('explain').path(docPath).first(),
)

const module = shallowRef<AnyConceptModule | null>(await loadConcept(found.chapter.slug, found.concept.slug))
const values = ref<Record<string, unknown>>(module.value ? defaultsOf(module.value.params) : {})

const stage = ref<{ svg?: SVGSVGElement }>()
const root = computed(() => (view.value === 'visualize' ? stage.value?.svg : null))
const player = usePlayer(module, values, root)

// Leaving Visualize stops playback.
watch(view, (v) => {
  if (v !== 'visualize') player.pause()
})

// Keyboard: Space plays/pauses, ←/→ step. Ignored while typing or on controls
// that use these keys themselves.
function onKey(e: KeyboardEvent) {
  if (!module.value || view.value !== 'visualize' || e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target as HTMLElement
  if (t.closest('input, textarea, select, button, [role="slider"], [role="radio"], [contenteditable="true"]')) return
  if (e.code === 'Space') {
    e.preventDefault()
    player.toggle()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    player.next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    player.prev()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

useHead({ title: `${found.concept.title} — AIViz` })
</script>

<template>
  <div class="concept-page" :class="`view-${view}`">
    <template v-if="view === 'visualize'">
      <section class="center" aria-label="Visualization">
        <ConceptStage
          ref="stage"
          :concept="found!.concept"
          :module="module"
          :d="player.derived.value"
          :caption="player.caption.value"
          :step="player.stepIndex.value"
          :total="player.total.value"
          :ready="player.ready.value"
        />
        <PlayerBar
          :disabled="!module"
          :playing="player.playing.value"
          :progress="player.progress.value"
          :markers="player.markers.value"
          :step="player.stepIndex.value"
          :total="player.total.value"
          :speed="player.speed.value"
          :time="module ? player.timeLabel.value : ''"
          :step-names="module?.steps.map((s) => s.id)"
          @toggle="player.toggle"
          @prev="player.prev"
          @next="player.next"
          @seek="player.seek"
          @step="player.goToStep"
          @speed="player.setSpeed"
        />
      </section>
      <ConceptPanel
        v-model:values="values"
        class="panel"
        :schema="module?.params"
        :presets="module?.presets"
        :readouts="player.readouts.value"
        :formula="player.formula.value"
        :log="player.log.value"
      />
    </template>

    <ExplainView
      v-else
      :chapter="found!.chapter"
      :concept="found!.concept"
      :index="found!.index"
      :doc="explainDoc"
      :prev="found!.prev"
      :next="found!.next"
    />
  </div>
</template>

<style scoped>
.concept-page { height: 100%; display: grid; grid-template-columns: 1fr var(--panel-w); min-height: 0; }
.concept-page.view-explain { grid-template-columns: 1fr; }
.center { display: grid; grid-template-rows: 1fr auto; min-width: 0; min-height: 0; }

@media (max-width: 1100px) {
  .concept-page { grid-template-columns: 1fr; height: auto; }
  .center { min-height: 72vh; }
}
</style>
