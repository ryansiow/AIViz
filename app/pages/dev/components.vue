<script setup lang="ts">
import { curvePath, linear, tangentSegment } from '~/engine/plot'
import { defaultsOf, type LogEntry, type ParamSchema, type Preset, type Readout, type TrackMeta } from '~/types/concept'

/**
 * Component playground (not linked from the app). Every Phase 2 building
 * block wired to sample dot-product data, so they can be checked together.
 */
useHead({ title: 'Components — AIViz', meta: [{ name: 'robots', content: 'noindex' }] })

const schema = {
  w: { kind: 'vector2', label: 'w', tex: '\\mathbf{w}', hue: 'blue', range: [-4, 4], default: [3, 1], nonZero: true },
  x: { kind: 'vector2', label: 'x', tex: '\\mathbf{x}', hue: 'rose', range: [-4, 4], default: [1, 2], nonZero: true },
} satisfies ParamSchema

const presets: Preset[] = [
  { label: 'Perpendicular', values: { w: [3, 1], x: [-1, 3] } },
  { label: 'Same direction', values: { w: [2, 1], x: [4, 2] } },
  { label: 'Opposite', values: { w: [3, 1], x: [-3, -1] } },
]

const values = ref<Record<string, unknown>>(defaultsOf(schema))
const w = computed(() => values.value.w as [number, number])
const x = computed(() => values.value.x as [number, number])

const dot = computed(() => w.value[0] * x.value[0] + w.value[1] * x.value[1])
const nw = computed(() => Math.hypot(...w.value))
const nx = computed(() => Math.hypot(...x.value))
const cos = computed(() => dot.value / (nw.value * nx.value))
const theta = computed(() => (Math.acos(Math.min(1, Math.max(-1, cos.value))) * 180) / Math.PI)

const readouts = computed<Readout[]>(() => [
  { tex: '\\mathbf{w}\\cdot\\mathbf{x}', value: dot.value, hue: 'green' },
  { tex: '\\cos\\theta', value: cos.value, hue: 'violet' },
  { tex: '\\lVert\\mathbf{w}\\rVert', value: nw.value, hue: 'blue' },
  { tex: '\\lVert\\mathbf{x}\\rVert', value: nx.value, hue: 'rose' },
])
const f = (v: number) => v.toFixed(3)
const formula = computed(
  () => `\\lVert\\mathbf{w}\\rVert\\lVert\\mathbf{x}\\rVert\\cos\\theta = ${f(nw.value)}\\times${f(nx.value)}\\times${f(cos.value)} = ${dot.value}`,
)

const log = computed<LogEntry[]>(() => [
  { step: 1, segments: [{ text: 'grid ready · 1 unit = 50 px' }] },
  { step: 2, segments: [{ text: `w = (${w.value})   |w| = ` }, { text: f(nw.value), hue: 'blue' }] },
  { step: 3, segments: [{ text: `x = (${x.value})   |x| = ` }, { text: f(nx.value), hue: 'rose' }] },
  { step: 4, segments: [{ text: 'θ = ' }, { text: `${theta.value.toFixed(1)}°`, hue: 'violet' }] },
  { step: 5, segments: [{ text: `w · x = ${w.value[0]}·${x.value[0]} + ${w.value[1]}·${x.value[1]} = ` }, { text: String(dot.value), hue: 'green' }] },
])

// Other control kinds, for coverage.
const misc = {
  temperature: { kind: 'number', label: 'Temperature', tex: 'T', hue: 'amber', min: 0.1, max: 3, step: 0.05, default: 1, hint: 'Lower is sharper, higher is flatter.' },
  lr: { kind: 'number', label: 'Learning rate', tex: '\\eta', min: 0.001, max: 1, step: 0.001, default: 0.1, control: 'field' },
  activation: { kind: 'select', label: 'Activation', default: 'relu', options: [{ value: 'sigmoid', label: 'Sigmoid' }, { value: 'tanh', label: 'tanh' }, { value: 'relu', label: 'ReLU' }] },
  showGrid: { kind: 'toggle', label: 'Show grid', default: true, hue: 'green' },
} satisfies ParamSchema
const miscValues = ref<Record<string, unknown>>(defaultsOf(misc))

// Stage sample: 1 unit = 40 px, origin at (200, 150).
const U = 40
const sx = (v: number) => 200 + v * U
const sy = (v: number) => 150 - v * U
const metaW = computed<TrackMeta>(() => ({ id: 'TRK-01', kind: 'VECTOR', name: 'w', hue: 'blue', rows: [['coords', `(${w.value})`], ['|w|', f(nw.value)]], foot: 'T+00:04:12 · FRM 0132' }))
const metaX = computed<TrackMeta>(() => ({ id: 'TRK-02', kind: 'VECTOR', name: 'x', hue: 'rose', rows: [['coords', `(${x.value})`], ['|x|', f(nx.value)]] }))
// Batch 2 primitives: MatrixGrid (with a row highlight) and TangentLine on y = x².
const prim = {
  t: { kind: 'number', label: 'Tangent at x', tex: 'x', hue: 'violet', min: -2, max: 2, step: 0.1, default: 1, digits: 1 },
  row: { kind: 'select', label: 'Highlight row', default: '0', options: [{ value: '0', label: 'Row 1' }, { value: '1', label: 'Row 2' }, { value: 'none', label: 'None' }] },
} satisfies ParamSchema
const primValues = ref<Record<string, unknown>>(defaultsOf(prim))
const tx = computed(() => primValues.value.t as number)
const psx = linear([-2.2, 2.2], [230, 390])
const psy = linear([-0.5, 4.8], [260, 40])
const parabola = curvePath((v) => v * v, psx, psy, 120)
const tangent = computed(() => tangentSegment(tx.value, tx.value ** 2, 2 * tx.value, psx, psy))
const tangentLabel = computed(() => ({ x: psx(tx.value), y: psy(tx.value ** 2) - 12, anchor: 'middle' as const }))

const metaDot = computed<TrackMeta>(() => ({ id: 'TRK-03', kind: 'SCALAR', name: 'w · x', hue: 'green', rows: [['value', String(dot.value)], ['sign', dot.value > 0 ? 'positive' : dot.value < 0 ? 'negative' : 'zero']] }))
</script>

<template>
  <div class="page">
    <h1>Components</h1>
    <p class="sub">Phase 2 building blocks with sample dot-product data. Change inputs, drag the pad, hover the stage.</p>

    <div class="grid">
      <section class="stage-demo" data-track-host>
        <svg viewBox="0 0 400 300" class="svg">
          <defs>
            <pattern id="dev-grid" width="40" height="40" patternUnits="userSpaceOnUse" x="0" y="-10">
              <path d="M40 0H0V40" fill="none" stroke="var(--grid)" />
            </pattern>
            <marker id="dev-ah-w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-blue)" /></marker>
            <marker id="dev-ah-x" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-rose)" /></marker>
          </defs>
          <rect width="400" height="300" fill="url(#dev-grid)" />
          <path :d="`M0 150H400M200 0V300`" stroke="var(--axis)" />
          <g v-track="metaW">
            <line x1="200" y1="150" :x2="sx(w[0])" :y2="sy(w[1])" stroke="var(--c-blue)" stroke-width="2.2" marker-end="url(#dev-ah-w)" />
            <line x1="200" y1="150" :x2="sx(w[0])" :y2="sy(w[1])" stroke="transparent" stroke-width="16" />
          </g>
          <g v-track="metaX">
            <line x1="200" y1="150" :x2="sx(x[0])" :y2="sy(x[1])" stroke="var(--c-rose)" stroke-width="2.2" marker-end="url(#dev-ah-x)" />
            <line x1="200" y1="150" :x2="sx(x[0])" :y2="sy(x[1])" stroke="transparent" stroke-width="16" />
          </g>
          <g v-track="metaDot">
            <text x="20" y="34" fill="var(--c-green)" font-size="22" font-family="var(--font-math-upright)">w · x = {{ dot }}</text>
          </g>
        </svg>
        <StageCaption :step="5" :total="6" text="Project $\mathbf{x}$ onto $\mathbf{w}$: the shadow it casts." />
      </section>

      <ConceptPanel
        v-model:values="values"
        class="panel-demo"
        :schema="schema"
        :presets="presets"
        :readouts="readouts"
        :formula="formula"
        :log="log"
      />
    </div>

    <h2>Matrix grid and tangent line</h2>
    <div class="grid">
      <section class="stage-demo prim" data-track-host :class="`hl-${primValues.row}`">
        <svg viewBox="0 0 400 300" class="svg short">
          <MatrixGrid el="pg-A" :values="[[1, 2, -0.5], [0, 1, 3]]" :x="30" :y="80" hue="blue" label="A" />
          <MatrixGrid el="pg-x" :values="[[3], [1], [2]]" :x="30" :y="200" :cell="28" hue="rose" label="x" vector />
          <path :d="parabola" fill="none" stroke="var(--text-dim)" stroke-width="1.5" />
          <TangentLine el="pg-tan" :seg="tangent" :point="[psx(tx), psy(tx ** 2)]" hue="violet" :label="`slope ${(2 * tx).toFixed(1)}`" :label-at="tangentLabel" />
        </svg>
      </section>
      <div class="card"><ParamPanel v-model="primValues" :schema="prim" /></div>
    </div>

    <h2>Other controls</h2>
    <div class="card">
      <ParamPanel v-model="miscValues" :schema="misc" />
      <pre class="dump">{{ miscValues }}</pre>
    </div>

    <h2>Explain primitives</h2>
    <div class="card prose">
      <RevealHint />
      <p>
        The dot product of <Term hue="blue" tex="\mathbf{w}" /> and <Term hue="rose" tex="\mathbf{x}" /> is positive when they
        <RevealPhrase>point roughly the same way</RevealPhrase>. A perceptron computes <RevealPhrase tex="\mathbf{w}\cdot\mathbf{x}+b" />.
      </p>
      <FormulaBlock tex="\mathbf{w}\cdot\mathbf{x} \;=\; \sum_{i=1}^{n} w_i\,x_i \;=\; \lVert\mathbf{w}\rVert\,\lVert\mathbf{x}\rVert\cos\theta" />
    </div>
  </div>
</template>

<style scoped>
.page { height: 100%; overflow-y: auto; padding: 32px 32px 80px; }
h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.sub { color: var(--text-dim); margin: 4px 0 20px; }
h2 { font-size: 15px; font-weight: 600; margin: 32px 0 10px; }
.grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
.stage-demo { position: relative; border: 1px solid var(--line); border-radius: var(--radius-xl); background: var(--surface); min-height: 420px; overflow: hidden; }
.svg { display: block; width: 100%; height: 420px; }
.svg.short { height: 300px; }
.stage-demo.prim { min-height: 300px; }
.prim.hl-0 :deep([data-el="pg-A-row-0"]), .prim.hl-1 :deep([data-el="pg-A-row-1"]) { opacity: 1; }
.panel-demo { border: 1px solid var(--line); border-radius: var(--radius-xl); max-height: 640px; }
.card { max-width: 680px; padding: 18px; border: 1px solid var(--line); border-radius: var(--radius-lg); }
.dump { margin-top: 12px; padding: 10px; border-radius: var(--radius); background: var(--surface); font: 12px var(--font-mono); color: var(--text-dim); }
.prose p { font-size: 15.5px; line-height: 1.75; color: var(--text-body); }

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .page { padding: 20px 16px 56px; }
}
</style>
