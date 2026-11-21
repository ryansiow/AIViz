# CLAUDE.md: AIViz

This file is the working contract for any session on this repository. Read it fully before changing code. If something here is wrong or out of date, fix this file in the same change.

---

## 1. What this project is

**AIViz** is a web app for learning AI and machine-learning concepts through **interactive, scrubbable animations**. It is for a working professional who finds academic material heavy. Each concept is taught by showing it, not by derivation first.

Every concept page has two views:

- **Visualize** (default): an SVG animation in steps, with a player (play/pause, previous/next step, a scrubber with step markers, speed). It also has an **Inputs** panel that changes the concept's variables live, a **Values** card with live numbers and a formula, and a **Log** of each step's calculation. Hovering any drawn element shows a **tracking overlay**: corner brackets plus a translucent metadata box with live values.
- **Explain**: a full written explainer with LaTeX maths and click-to-reveal phrases for self-testing. The right panel is hidden in this view.

Reference apps the design was studied from (patterns only, never their content or art): `vizlearn.app/ai` and `poloclub.github.io/transformer-explainer`.

### Ground rules

- **Standalone project.** It does not sync with, link to, or depend on the owner's Obsidian vault ("Journey to AI Expert"). The vault may be used as *reference material* when writing explanations, but the app owns its own content. Never present a claim the vault marks `[VERIFY]` as fact.
- **Original work.** Do not copy text, art, diagrams or curriculum structure from the reference apps.
- **Not deployed yet.** It runs locally until the owner decides it is good enough to host. It builds as a static site (`npm run generate`), so hosting later is cheap. Do not add hosting config unless asked.

---

## 2. Tech stack

| Area | Choice | Notes |
|---|---|---|
| Framework | **Nuxt 4** (Vue 3.5, Vue Router 5), TypeScript | Source lives in `app/` (Nuxt 4 layout). Static generation. |
| Animation | **GSAP 3.15** + **DrawSVGPlugin** | GSAP and all its plugins are free. Registered once in `app/engine/gsap.ts`. |
| Maths | **KaTeX 0.16** | Rendered with `renderToString`, so it works at build time (SSR). CSS is imported globally in `nuxt.config.ts`. |
| Explain content | **Nuxt Content 3.17** + `remark-math` / `rehype-katex` | One Markdown (MDC) file per concept in `content/explain/`. Uses Node's built-in SQLite (`sqliteConnector: 'native'`), no native build. |
| Styling | Plain CSS: design tokens (CSS custom properties) + scoped component styles | No Tailwind or UI library. |
| Fonts | Inter (UI), JetBrains Mono (numbers, code, log), KaTeX fonts (maths) | Google Fonts link in `nuxt.config.ts`. |
| Unit tests | **Vitest 3** (`tests/unit`) | Pure logic only, Node environment, `~` alias to `app/`. |
| E2E tests | **Playwright 1.65** (`tests/e2e`), Chromium | Desktop project (1440×900) + mobile project (Pixel 7). |
| Type checking | `vue-tsc` via `nuxi typecheck` | Must be clean before committing. |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | On pull requests and pushes to `main`: typecheck → unit → Playwright. |

Not used, on purpose: D3 (only small helpers were needed, see `engine/plot.ts`), Rough.js (the hand-drawn style was dropped), any CSS framework.

---

## 3. Commands

```bash
npm install                 # also runs `nuxt prepare`
npm run dev                 # dev server on http://localhost:3000
npm run typecheck           # vue-tsc over the whole app, must print no "error TS"
npm run test:unit           # Vitest
npm run test:e2e            # Playwright (reuses a running dev server on :3000)
npm test                    # unit + e2e
npm run generate            # static build to .output/public (all routes prerendered)
npx playwright install chromium   # first time only, for e2e
```

- **One Nuxt dev server per project folder.** Nuxt refuses to start a second one in the same directory. Playwright is configured for port 3000 with `reuseExistingServer` (locally), so `npm run test:e2e` uses your running `npm run dev`. If none is running, Playwright starts one.
- Useful e2e flags: `npx playwright test concepts -g "softmax"` runs a subset, and `--repeat-each=3` checks for flakiness (do this after changing timing-related code). On failure, open the trace with `npx playwright show-trace test-results/<test>/trace.zip`.
- The **component playground** is at `/dev/components` (dev server only; `nuxt.config.ts` removes `/dev/*` pages from production builds).

### Definition of done for any change

1. `npm run typecheck` prints no errors.
2. `npm run test:unit` and `npm run test:e2e` pass. For anything touching the player, timelines or hover, also pass `--repeat-each=3`.
3. `npm run generate` succeeds.
4. **Look at it**, in light and dark: the browser pane, or Playwright screenshots (see §12). Tests do not catch layout collisions; screenshots do.
5. Update this file if architecture, conventions or status changed.

---

## 4. Repository map

```
app/
  app.vue                      NuxtLayout + NuxtPage
  assets/css/tokens.css        Design tokens: light default, dark via OS or data-theme
  assets/css/base.css          Reset, focus ring, .pressable, hue helper classes, reduced motion
  layouts/default.vue          Shell: topbar, curriculum sidebar (docked or drawer), main, TrackOverlay
  pages/
    index.vue                  Curriculum overview (all chapters and concepts)
    [chapter]/index.vue        Chapter page (404 if unknown)
    [chapter]/[concept].vue    Concept page: loads module, owns values + player, keyboard shortcuts
    dev/components.vue         Component playground (dev only)
  data/curriculum.ts           THE curriculum: chapters → concepts (slug, title, summary, status)
  concepts/
    registry.ts                "<chapter>/<concept>" → lazy import of the concept module
    <chapter>/<concept>/
      derive.ts                params schema + pure derive() + layout constants (unit-tested)
      Scene.vue                SVG rendering from derived data (no animation logic)
      index.ts                 defineConcept({...}): steps, captions, log, readouts, formula, build()
  engine/
    types.ts                   ConceptModule contract, StepDef, BuildContext, defineConcept
    usePlayer.ts               Timeline player (play/pause/seek/next/prev/goToStep/speed, rebuild)
    beats.ts                   Animation building blocks (drawIn, fadeIn, riseIn, popIn, activate, …)
    gsap.ts                    getGsap(): registers DrawSVGPlugin once, client only
    plane.ts                   2D plane geometry (toSvg, angles, arcs, arrowheads, label/card placement)
    plot.ts                    Linear scales, 1/2/5 ticks, curvePath (edge-clipped), compact numbers
  components/                  Auto-imported by FILE NAME (pathPrefix: false), sub-folders are only organisation
    AppTopbar.vue, CurriculumSidebar.vue, ThemeToggle.vue, Tex.vue
    concept/                   ConceptStage, PlayerBar, ConceptPanel, ExplainView
    controls/                  ParamPanel (+ NumberField, VectorField, SliderField, SelectField,
                               ToggleField, PresetChips, VectorPad)
    panel/                     ValueReadouts, LogFeed
    stage/                     StageCaption, TrackOverlay
    plane/                     PlaneGrid, PlaneVector, AngleArc (reusable SVG primitives)
    explain/                   FormulaBlock, RevealPhrase, RevealHint, Term
  composables/useUi.ts         useSidebar, useTheme, useConceptView (?view=explain)
  composables/useReviewStatus.ts  What awaits the owner's review per concept: draft explainers + unreviewed visualisations (sidebar dots, topbar chip)
  utils/explain.ts             explainPath() / parseExplainPath(): curriculum slugs <-> content paths
  plugins/track.ts             v-track directive (hover tracking overlay)
  plugins/hydrated.client.ts   Sets <html data-hydrated="true"> once hydrated (test hook)
  types/concept.ts             Param schema types, Readout, LogEntry, TrackMeta, Hue, helpers
  utils/math.ts                clamp, snap, formatNumber, renderInlineTex ($…$ → KaTeX HTML, escaped)
  utils/track.ts               Reactive store behind the tracking overlay
content/explain/<chapter>/<concept>.md   Explain view text (Markdown + MDC + $maths$), see §5.7
content.config.ts              The `explain` collection and its front matter schema (draft, updated)
design/concept-page-mock.html  The LOCKED visual reference (v2). Open it in a browser to compare.
tests/unit/*.test.ts           Vitest
tests/e2e/*.spec.ts            Playwright; *.mobile.spec.ts run on the phone project only
.github/workflows/ci.yml       CI
.claude/launch.json            Browser-pane dev server config (aiviz-dev, port 3000)
```

---

## 5. Architecture

### 5.1 Routing and data flow

- `curriculum.ts` is the single source of truth for navigation. Routes are `/` → `/:chapter` → `/:chapter/:concept`. Unknown slugs throw a fatal 404 (`createError`).
- The concept page uses `definePageMeta({ key: route => route.path })`, so it remounts per concept (fresh values, player and timeline). Switching the `?view=` query does **not** remount.
- The page loads the module with `loadConcept(chapter, concept)` (top-level `await`, works during SSR), creates `values = defaultsOf(module.params)`, and calls `usePlayer(module, values, svgRoot)`.
- A concept with no registered module shows a placeholder stage and a disabled player. Explain still works.

### 5.2 The concept module contract (`engine/types.ts`)

```
params ──► derive(params) ──► D  (every number and every geometry the concept needs)
                               │
     ┌─────────────────────────┼─────────────────────────────┐
  scene (Vue SVG, renders D)  build(ctx) (GSAP: WHEN things   steps / readouts(D) /
                              appear, never WHERE)            formula(D) / presets
```

```ts
defineConcept({
  params,                  // ParamSchema: number | vector2 | select | toggle (see types/concept.ts)
  presets?: Preset[],      // { label, values: Partial<ParamValues> }
  derive: (p) => D,        // PURE. Unit-test it. Put layout geometry here too (bars, positions).
  steps: StepDef<D>[],     // { id, caption(d) with $…$ maths, log?(d) → LogSegment[] }
  readouts?: (d) => Readout[],   // Values card: { tex, value, hue, digits }
  formula?: (d) => string,       // LaTeX under the Values card
  scene: Component,        // receives prop `d`
  viewBox: '0 0 600 400',  // all current concepts use 600×400
  build(ctx) { … },        // ctx = { tl, d, el(name), step(id, at) }
})
```

Rules:

- **`derive` is pure and complete.** The scene and captions only read from `D`. Geometry (SVG coordinates of bars, points, cards) is computed in `derive`, so it is testable and the scene stays dumb.
- **The scene renders the FINAL state** of every element, from `D`. Every element that animates gets `data-el="<name>"` (unique, or indexed like `exp-bar-2`).
- **`build()` only animates appearance**: draw, fade, rise, pop, grow from zero, morph from a previous value to the rendered one. Use `ctx.el(name)` to select. Call `ctx.step(id, time)` once per `StepDef`, **in order**; in dev a warning is logged if the labels do not match `steps`.
- Every `build()` should end with `holdUntil(ctx, t)`, so the last step has reading time.
- Register the module in `concepts/registry.ts` **and** set `status: 'ready'` in `curriculum.ts`. A unit test enforces that these match. New visualisations stay `reviewed: false` (the default) until the owner reviews them; only the owner's go-ahead sets `{ reviewed: true }`.
- **Steps:** as many as the concept needs to be explained well (owner's rule): 4–9 is typical, longer is fine when each step teaches one thing.
- **Variants:** a concept can reuse another's maths (`import { softmax } from '../softmax/derive'`, `descend`/`classify` from Gradient Descent) and tell its own story with its own scene and steps (Temperature, Learning Rate).

### 5.3 The player (`engine/usePlayer.ts`)

- One **paused** GSAP timeline per concept. Nothing ever plays on its own.
- **Steps are timeline labels.** Step *i* spans [label *i*, label *i+1*). `stepEnd(i)` = just before the next label, i.e. the finished frame of step *i*.
- `next()`: if the current step is unfinished, play to its end; otherwise play the whole next step, then **stop** at its end (`stopAt`). `prev()`: jump to the finished frame of the previous step. `goToStep(i)`: jump to the finished frame of step *i*. `seek(p)`: scrubber. `toggle()/play()`: plays to the end; Play at the end restarts.
- **First build** lands on the finished frame of step 1, so the stage is never blank. The SVG has `opacity: 0` until the first build (`ready`), so the server-rendered, fully drawn scene never flashes.
- **Rebuild on input change:** `derive` re-runs → Vue re-renders the scene → after `nextTick` the old timeline is `revert()`ed and `kill()`ed → `build()` runs again → the player restores **the same step and the same fraction through that step** (not raw time: timelines change length when inputs change, e.g. Gradient Descent draws fewer points). Playback continues if it was playing.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no tweening. Play steps through finished frames every 1.4 s; Next and Previous jump straight to finished frames.
- **Keyboard** (concept page, Visualize view): Space = play/pause, ←/→ = previous/next. Ignored while focus is in inputs, buttons, sliders, radios or editable content.
- **Test hook (dev only):** `window.__aiviz = { seek, goToStep, progress(), step(), playing() }`. It is wrapped in `import.meta.dev` and absent from production builds. E2E tests rely on it.

### 5.4 Animation building blocks (`engine/beats.ts`)

| Beat | Use for | Notes |
|---|---|---|
| `drawIn(ctx, els, at, dur=0.7, ease)` | The **lead** of a step: lines, arcs, curves | DrawSVG `0% → 100%`. **Breaks `stroke-dasharray`**: never use on dashed lines; fade those. |
| `fadeIn(ctx, els, at, dur=0.4, to=1)` | Decoration: grids, guides, fills | Opacity only. |
| `riseIn(ctx, els, at, dur=0.35, dist=4)` | Labels, cards, support text | Fade + small rise. |
| `popIn(ctx, els, at, dur=0.2)` | Arrowheads and points landing with a line | Scale from 0.6 + fade. |
| `activate(ctx, els, at)` | Turn hover targets on | `autoAlpha 0 → 1` over 0.01 s (see gotchas). |
| `vectorIn(ctx, el, at)` | Standard vector entrance | Line draws, head lands at 80%, label overlaps the end, hit area activated. |
| `arcIn(ctx, el, at)` | Angle arc entrance | |
| `holdUntil(ctx, t)` | Reading time at the end | |

Morphs (for example Softmax bars rescaling) are written inline with `tl.fromTo(el, {attr:{…from}}, {attr:{…to}, immediateRender: false}, at)`. **`immediateRender: false` is required** on any second tween of the same element, or its start state overwrites the first tween's.

### 5.5 Hover tracking overlay

- Put `v-track="meta"` (a `TrackMeta`: `{ id, kind, name, hue, rows: [k, v][], foot? }`) on an SVG group. `TrackOverlay` (one instance, in the layout) draws brackets around the element and a translucent metadata box, kept inside the nearest `[data-track-host]` (the stage). After the first overlay, moving between elements shows the next one instantly.
- **Only the invisible hit element takes pointer events.** Groups use `pointer-events: none`. Each has a transparent `.hit` (wide stroke) or `.hit-area` (fill) with `data-el="<name>-hit"`, switched on by `activate()` when the element is drawn. Use **`pointer-events: visibleStroke`** for hit strokes and **`visible`** for hit areas (see gotchas).
- Diagram elements only. **No tracking overlay in the Explain view** (owner's decision).

### 5.6 Inputs, values, log

- `ParamPanel` builds the Inputs card from the schema: `number` gives a `SliderField` (or a `NumberField` with `control: 'field'`), `vector2` gives a `VectorField`, plus **one shared `VectorPad`** with draggable handles for all vectors. `select` gives a segmented control (≤ 4 options) or a native select, `toggle` gives a switch. Presets and Reset are chips.
- `vector2` with `nonZero: true` rejects the zero vector (shows an alert, keeps the previous value).
- **Inputs stay editable while playing** (a deliberate difference from vizlearn, which locks them). Changing one rebuilds in place.
- Log lines are `LogSegment[]` (`{ text, hue? }`), monospace, plain text (no LaTeX). Steps reached so far are shown; the newest is highlighted.

### 5.7 Explain content (Nuxt Content)

- One file per concept: `content/explain/<chapter>/<concept>.md`. **The file path is the link** to the curriculum (`explainPath()`); a unit test checks every file matches a real concept and that every `ready` concept has one.
- Front matter: `title` (must equal the curriculum title), `draft` (boolean), `updated` (YYYY-MM-DD). Do not write a `# H1`: the page renders the title. Start with a short intro paragraph, then `## sections`.
- **`draft: true`** = written by Claude, not yet reviewed by the owner. The owner flips it to `false` after review. **Anything Claude writes or substantially rewrites is `draft: true`.**
- **Review markers** (`useReviewStatus`): a concept is "in draft" when its explainer is `draft: true` **or** its visualisation is `ready` but not `reviewed` (curriculum). It shows an amber sidebar dot (filled if `ready`, a ring if `planned`) and an **"In draft"** chip after the concept name in the topbar (kept visible on phones); the chip's tooltip says which part awaits review.
- **Text-first concepts** (`format: 'text'` in the curriculum: Universal Approximation, Hyperparameter Tuning, Context Window, LLM Training Pipeline, ELBO) get a written explainer with one simple diagram instead of a long animation.
- Writing syntax:
  - Maths: `$…$` inline, `$$…$$` display (rendered at build time by `rehype-katex`; display maths gets the formula-card style).
  - Coloured term: `:term[$\mathbf{w}$]{hue="blue"}` or `:term[projection]{hue="green"}`. Hues follow §6.
  - Self-test: `:reveal[perpendicular]` or `:reveal[$\mathbf{w}\cdot\mathbf{x}+b$]`. The reveal hint is added at the top automatically when a page has reveals.
  - Put maths in the slot (`[$…$]`), not in a `tex="…"` attribute.
  - Tables and lists are styled; tables scroll inside their own box on phones.
- The explain components (`components/explain/`) are registered **global** so MDC can use them; `reveal` and `formula` are aliases (`content.renderer.alias`) for `RevealPhrase` and `FormulaBlock`.
- **The concept page loads the explainer** (`useAsyncData` in `[concept].vue`), whatever the view, and passes it to `ExplainView` as `doc`. That puts it in the prerendered payload. Fetching it only when Explain opens made the static site query the content database in the browser (a SQLite WASM download).
- Concepts without a file show their summary and a "not written yet" note.
- Content rules: original writing; the vault may be used as reference; never state a vault `[VERIFY]` claim as fact; numbers in worked examples must match the visualisation's defaults (compute them, don't estimate).

---

## 6. Design system

The visual direction is **locked**: `design/concept-page-mock.html` (v2), a light explainer style close to the Transformer Explainer, with **v1-style thin line drawings** and a **dark mode toggle**. An earlier surveillance/camera theme was **rejected**. Only the hover overlay keeps a subtle "tracking" flavour (brackets, `TRK-01`, a red live dot).

### Tokens (`assets/css/tokens.css`), never hard-code colours

- Surfaces: `--bg`, `--surface`, `--surface-2`, `--line`, `--line-strong`; plot: `--grid`, `--axis`.
- Text: `--text`, `--text-body`, `--text-dim`, `--text-faint`. Brand: `--brand`, `--brand-soft`.
- **Semantic hues**, one role each, used consistently across diagram, inputs, values, log and Explain text: `--c-blue`, `--c-rose`, `--c-violet`, `--c-green`, `--c-amber` (+ `-soft` variants). In TypeScript use the `Hue` type and `hueVar()` / `hueSoftVar()`. Current conventions:
  - **blue** = primary input / weights (w, logits, the start point θ₀)
  - **rose** = second input (x), errors, off-chart
  - **violet** = angles, slopes, intermediate quantities (e^(z/T), the tangent)
  - **green** = results and success (w·x, probabilities, converged)
  - **amber** = hyperparameters and updates (temperature T, learning rate η, iterates)
- Dark mode applies under `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`. **Both blocks must stay identical.** The theme follows the OS until the user toggles; the choice is saved in `localStorage['aiviz:theme']` and applied by an inline head script before first paint.
- SVG colours come from tokens via CSS classes (`stroke: var(--c-blue)`). Presentation attributes cannot take `var()`; `style` and classes can.

### Typography and maths

- UI in Inter; numbers in readouts and log in JetBrains Mono with `tabular-nums`.
- **All maths is LaTeX via KaTeX:** `<Tex expr="…" />`, `FormulaBlock`, inline `$…$` in captions (`renderInlineTex`, which escapes everything outside `$`).
- In SVG, maths labels use the KaTeX fonts: `font-family: var(--font-math)` (italic for variables) and `var(--font-math-upright)`. Vectors are bold italic (`w`, `x`).
- **Minus signs:** in SVG and plain text use the real minus `−` (`fmt`, `compact`). Inside LaTeX use ASCII `-`.

### Motion rules (from the emil-design-eng and choreograph skills)

- Custom curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; UI transitions 140–220 ms. Only `transform` and `opacity` animate in the UI chrome.
- Pressables: `.pressable` (scale 0.96 on `:active`). Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- In concept timelines: **one lead per step**; accents (arrowheads, points) land *with* the lead; labels overlap the end of the draw; decoration only fades; staggers shrink (no uniform delays); cause before effect.
- Reduced motion: the global CSS rule zeroes CSS transitions; the player jumps between finished frames.
- Never flash more than 3 times per second.

### Layout

- Grid: topbar 56px; sidebar 236px (docked, collapsible, remembered in `localStorage['aiviz:sidebar-open']`); main; right panel 300px (hidden in Explain).
- ≤ 1100px: the sidebar becomes a slide-in drawer (Escape, backdrop or navigation closes it), and the panel stacks under the stage. ≤ 560px: tighter padding, secondary controls hidden.
- The stage SVG uses `preserveAspectRatio="xMidYMid meet"`. Keep important content out of roughly the bottom 50 px of the 600×400 viewBox, where the caption overlays it on short screens.

---

## 7. How to add a new concept (checklist)

1. **Pick the slug** from `app/data/curriculum.ts` (or add the concept there first).
2. Create `app/concepts/<chapter>/<concept>/`:
   - `derive.ts`: `params` (`satisfies ParamSchema`), layout constants (`VIEW`, plot box…), a `Data` interface, and a pure `derive()`. Compute *all* geometry here. Use `engine/plane.ts` for 2D vectors and `engine/plot.ts` for curves and charts.
   - `Scene.vue`: render the final state from `d`. Add `data-el` names, `v-track` metadata, hit elements, token-based colours, math fonts.
   - `index.ts`: `defineConcept({...})` with as many steps as the story needs (captions with `$…$`, log lines), readouts, formula, 2–4 presets that each tell a *different story*, and `build()` using the beats.
3. Register it in `app/concepts/registry.ts` and set `status: 'ready'` in the curriculum (leave `reviewed` unset: it shows as in draft until the owner reviews it). Add the module path to the `vi.mock` list in `tests/unit/registry.test.ts`.
4. **Unit tests** (`tests/unit/<concept>.test.ts`): the worked example's numbers, invariants (probabilities sum to 1, derivative matches a finite difference…), each preset's outcome, and edge cases (zero, parallel, overflow, off-chart).
5. **E2E tests:** add the path to the smoke list in `tests/e2e/concepts.spec.ts` (plays every step, no console errors) and to `concept-page.mobile.spec.ts`. Add concept-specific tests for the caption and values at the final step, and for presets.
6. **Explainer:** write or update `content/explain/<chapter>/<concept>.md` (§5.7) with `draft: true`, and add the path to `EXPLAINED` in `tests/e2e/explain.spec.ts`.
7. **Visual check** at steps 1, mid and last, in light and dark, with the extreme presets. Look for label/curve/tick collisions, clipped content, and "spoilers" (the answer shown before its step).
8. Run the full definition of done (§3).

Good patterns to copy: `foundations/dot-product` (2D geometry, collision-free card placement), `transformers-llms/softmax` (bars and in-place morphs), `optimisation/gradient-descent` (curves, iterative runs, variable-length timelines, off-chart handling).

---

## 8. Hard-won gotchas (read before touching the engine or scenes)

1. **Zero-duration `fromTo` placed later in a paused timeline does not apply its start state.** Hover targets were live from frame 1. Use a tiny real duration (`activate()` uses 0.01 s on `autoAlpha`).
2. **SVG `pointer-events: stroke` / `fill` / `all` ignore `visibility: hidden`.** Hidden hit targets still caught the pointer. Use `visibleStroke` / `visibleFill` / `visible`.
3. **Vue and GSAP must not own the same attribute.** If Vue binds `transform` (for example to position a card) and GSAP animates `y` on the same element, `revert()` on rebuild restores the *old* position. Wrap it: an outer `<g :transform>` (Vue) and an inner `<g data-el>` (GSAP). Animated `attr` morphs are safe only when both ends are explicit in `fromTo`.
4. **DrawSVG overwrites `stroke-dasharray`.** Do not draw dashed lines; fade them.
5. **Second tween on the same property needs `immediateRender: false`**, or its start state replaces the first tween's.
6. **`acos` loses precision near ±1.** Compute angles with `atan2(|a×b|, a·b)` (exact at 0° and 180°).
7. **Draw order matters for overlaps.** Draw secondary shapes (projections, guides) *before* the main vectors so they never hide them, and remember hit-testing follows DOM order.
8. **Curves leaving the plot** must end at the edge (`curvePath` does this), never be clamped flat along the border. Points that leave the chart: stop drawing at the first one and label it (Gradient Descent's `shown`).
9. **Do not reveal the answer early.** For example, do not colour the winning token before the result step.
10. **Rebuilds preserve step + fraction, not time.** Keep `ctx.step()` labels in order and increasing.
11. **E2E: wait for hydration** (`visit()` waits for `html[data-hydrated]`) and for `svg.scene.ready`. Use `getByRole(..., { exact: true })` for "Play"/"Pause" ("Playback speed" also matches "Play"). After Next (which animates), wait for `playing() === false` before the next action. When hovering, aim at a spot not covered by another element (Playwright waits for the target to receive the pointer).
12. **Nuxt components are referenced by file name** (`pathPrefix: false`), so component file names must be unique across sub-folders.
13. `nuxt.config.ts` pre-bundles `gsap`, `gsap/DrawSVGPlugin` and `katex` (`vite.optimizeDeps.include`), which avoids a reload on first visit in dev. Add new heavy client libraries there.
14. **Reveal phrases are `inline-block`.** As plain inline spans, parts of a reveal holding KaTeX did not receive clicks (the paragraph caught them). Keep `display: inline-block`.
15. **Content in a static build:** any `queryCollection` that runs only on the client (not during prerender) makes the browser download the content database. Load content in the page's SSR path so it lands in `_payload.json`.
16. **E2E on the dev server:** the Nuxt devtools button sits at the bottom centre of the viewport and intercepts clicks there. Scroll targets away from it, or check hit-tests with that in mind.
17. **Hydration mismatches from floating point:** `exp`/`log` can differ in the last bit between Node (server) and Chrome, so a computed SVG attribute (e.g. a bar width) mismatches on hydration. Round geometry in `derive` (Temperature and Learning Rate use 1/1000 of a unit).
18. **Rounding for display:** `toFixed` rounds the binary value (7.175 → "7.17"). For numbers a learner may check by hand, use `roundTo()` from `utils/math` (7.175 → 7.18).
19. **Hide-until-step on a second property:** an element whose width morphs (first tween) and which must stay hidden until its step needs its opacity tween to render its start state at build time (no `immediateRender: false`; different property, so gotcha 5 does not apply). Otherwise it shows from step 1 and spoils the answer.

---

## 9. Testing conventions

- **Unit (Vitest):** pure functions only: `utils/`, `engine/plane.ts`, `engine/plot.ts`, each concept's `derive.ts`, curriculum/registry integrity. No `.vue` imports (Vitest has no Vue plugin here). That is why maths lives in `derive.ts`, separate from `index.ts`. `tests/unit/registry.test.ts` stubs the concept modules with `vi.mock`.
- **Unit, content:** `explain-content.test.ts` reads `content/explain/` with Node `fs`: paths match the curriculum, front matter is valid, ready concepts have an explainer, hues are semantic, `$` delimiters balance.
- **E2E (Playwright):** specs by area: `navigation`, `theme`, `sidebar` (+ `.mobile`), `components` (playground controls), `concept-player` (engine behaviour on Dot Product), `concepts` (per-concept stories + smoke for every ready concept), `explain` (every explainer renders without KaTeX errors, reveals, draft dot and chip), `concept-page.mobile`. Prefer roles and accessible names; use `data-el` for diagram parts; drive the timeline with `window.__aiviz`.
- Flakiness budget is zero: run `--repeat-each=3` after changing timing, hover or player code.
- Current counts (Phase 6, Batch 1): **95 unit tests, 78 e2e tests**, all passing.

---

## 10. Git, PRs and CI

- **Commit to `main` locally, never push.** The owner pushes manually (owner's decision, 2026-11-21). Commits go directly to `main` while the owner is the only contributor. Run the full definition of done (§3) before committing, because CI runs when the owner pushes. Do not run `git push`, even when asked to "ship" or "finish": say the commits are ready to push. If the owner asks for a branch and PR, use one (`phase-N-…`). Go back to branches + PRs if other contributors join.
- Commit or push only when the owner asks. Commit messages describe *what and why*, in sections. End commit messages with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  End PR descriptions with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- PR description template: Summary (per area) / Bugs found and fixed / Test plan (checkboxes: typecheck, unit N passed, e2e N passed + repeat runs, generate, visual check, CI) / Known gaps.
- CI must be green before merge. The repo (`github.com/ryansiow/AIViz`) is **public**: never commit secrets or personal data.
- The `gh` token is a fine-grained PAT; it needs Contents, Pull requests and Workflows permissions (read/write) for this repo.

---

## 11. Roadmap and status

| Phase | What | Status |
|---|---|---|
| 0 | Research (reference apps), design direction, static mock | ✅ Done: v2 locked in `design/` |
| 1 | Nuxt skeleton: routes, curriculum, layout, theme, tabs | ✅ Merged (PR #1) |
| 2 | Component library: controls, panel, overlay, Explain blocks, playground; Vitest + Playwright + CI | ✅ Merged (PR #1) |
| 3 | GSAP engine (module contract, player, beats, plane primitives) + **Dot Product** | ✅ Merged (PR #2) |
| 4 | Vertical slice: **Softmax** (+ temperature) and **Gradient Descent** (+ learning rate); plot helpers; step-preserving rebuilds | ✅ Merged (PR #3) |
| 5 | **Explain content:** Nuxt Content v3, one Markdown file per concept, KaTeX maths, MDC terms and reveals, draft flag (amber dot + "In draft" chip). 9 draft explainers | ✅ On `main` (direct commit); explainers await owner review |
| 6 | **Build out the curriculum** in batches, each first building the primitive it needs (§11.1) | ⏳ In progress: Batch 1 done |
| 7 | **Quality bar:** keyboard and a11y pass, reduced-motion review, contrast, tablet layout, progress tracking (localStorage; the sidebar dots already support `ready`), worst-case data (break-ui), motion audit (improve-animations) | Planned |
| — | Hosting (static: Cloudflare Pages or Vercel) | Deferred until the owner approves |
| — | **GitHub Issues as the work queue:** the owner will file Issues; Claude fetches them daily (`gh issue list`) and works on them, committing locally (no push, see §10) | Planned, not set up yet |

Ready concepts: `foundations/dot-product`, `transformers-llms/softmax`, `optimisation/gradient-descent` (reviewed), `transformers-llms/temperature`, `optimisation/learning-rate` (Phase 6 Batch 1, **awaiting review**). All other 36 concepts have a placeholder stage.

### 11.1 Phase 6 batches

| Batch | Concepts | New primitive | Status |
|---|---|---|---|
| 1 | Temperature, Learning Rate (variants of Softmax / Gradient Descent) | none (`roundTo` helper) | ✅ Built, awaiting review |
| 2 | Vectors, Cosine Similarity, Matrix Multiplication, Derivatives & Chain Rule | MatrixGrid; TangentLine helper | Next |
| 3 | Learning Basics (7) | ScatterPlot, loss-curve plot | Planned |
| 4 | Neural Networks (8) | NetworkGraph (forward values, backward gradients) | Planned |
| 5 | Optimisation: SGD, Adam, Early Stopping, Hyperparameter Tuning | ContourPlot | Planned |
| 6 | Transformers & LLMs (7 left) | TokenStrip, Heatmap | Planned |
| 7 | Generative Models (6) | Histogram/density, encoder–decoder diagram | Planned |

Each primitive: geometry in `engine/` with unit tests, an SVG component, and a `/dev/components` entry before a concept uses it. At the end of each batch: `dataviz` and `break-ui` passes, CLAUDE.md update.

Explainers (all `draft: true`, awaiting review): the 3 ready concepts plus `foundations/vectors`, `foundations/cosine-similarity`, `foundations/matrix-multiplication`, `learning-basics/loss-function`, `optimisation/learning-rate`, `transformers-llms/temperature`. The other 32 concepts show the "not written yet" note.

### Known gaps / small debts

- Dot Product: the `proj_w(x)` label can overlap x when x lies along w.
- `npm audit`: Nuxt Content brings `zod@3` (2 high advisories), used at build time only; the fix needs breaking `--force` upgrades. The other 12 advisories predate Phase 5.
- Progress tracking (seen / finished) is not implemented yet.

---

## 12. Environment notes

- **Node:** CI uses Node 24. Nuxt supports `^22.21 || ^24.11 || >=26`; Node 26 is the LTS. The owner's machine currently runs a Node 27 *alpha* (it works, but it is a pre-release).
- **Browser pane (Claude desktop app):** the `aiviz-dev` config in `.claude/launch.json` starts `npm run dev` on port 3000. If it fails silently with `getcwd: … Operation not permitted`, macOS is blocking the app from `~/Documents`. The owner must grant Files & Folders (Documents) or Full Disk Access to Claude and restart the app. Until then, verify visuals with **Playwright screenshots**: write a throwaway spec in `tests/e2e/_shoot.spec.ts` that visits a page, waits for `svg.scene.ready`, calls `window.__aiviz.goToStep(n)`, saves `page.screenshot()` to the scratchpad, then delete the spec.
- The dev server prints a Vite "discovered new dependencies" notice when a new client library is added; add it to `optimizeDeps.include`.

---

## 13. Skills to use

Installed skills that fit this project (use them; the owner asked for the Emil Kowalski skills and GSAP specifically):

- **animate**, **choreograph**, **animation-performance**, **emil-design-eng**: any motion, timeline or sequencing work. `choreograph` shaped the step timing rules in §6.
- **improve-animations**, **find-animation-opportunities**, **remove-animations**: periodic motion audits (Phase 7).
- **impeccable** / **ui-ux-pro-max**: visual and UX critique of pages and components.
- **dataviz**: any new chart-like concept (bars, curves, heatmaps, attention matrices).
- **break-ui**: worst-case data for components and concepts (Phase 7).
- **reverse-engineer-anything**: studying reference apps (its MCP server is not registered here; browser inspection was used instead).
- **code-review** / **simplify**: before opening a PR.
- **run**: launching the app to see a change.

---

## 14. Owner preferences (from the build conversation)

- Explanations over jargon. Learning by playing with variables.
- Minimalist and readable over decorative. A light, Transformer-Explainer-like look; thin line drawings; dark mode available.
- No hover overlay in the Explain view. The reveal hint sits at the top of the explainer.
- Plan → small reviewable PRs per phase; the owner reviews before each merge.
- Report honestly: what was verified (tests, screenshots) and what was not.
