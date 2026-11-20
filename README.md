# AIViz

Learn AI concepts through interactive animations. Each concept has a
**Visualize** view (an animation you can scrub, with inputs you can change)
and an **Explain** view (a written explainer with LaTeX maths).

Built with Nuxt 4, Vue 3 and TypeScript. KaTeX renders the maths; GSAP will
drive the animations (Phase 3).

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

The component playground is at `/dev/components` (dev server only).

## Test

```bash
npm run typecheck    # vue-tsc across the app
npm run test:unit    # Vitest: pure logic in tests/unit
npm run test:e2e     # Playwright: browser tests in tests/e2e
npm test             # unit + e2e
```

First run of the browser tests needs Chromium: `npx playwright install chromium`.
Locally, the e2e tests reuse a running `npm run dev`; otherwise they start one.

## Layout

| Path | What |
|---|---|
| `app/data/curriculum.ts` | Chapters and concepts; drives navigation and routes |
| `app/types/concept.ts` | Param schema and shared concept types |
| `app/assets/css/tokens.css` | Design tokens (light and dark) |
| `app/components/controls/` | Inputs generated from a concept's param schema |
| `app/components/panel/`, `stage/`, `explain/` | Values/log, stage overlay, explainer blocks |
| `design/concept-page-mock.html` | The locked visual reference |
