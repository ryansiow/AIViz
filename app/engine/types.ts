import type { Component } from 'vue'
import type { LogSegment, ParamSchema, ParamValues, Preset, Readout } from '~/types/concept'

/**
 * A concept module: everything the engine needs to animate one concept.
 *
 *   params ──► derive() ──► D (all numbers the scene and text need)
 *                            │
 *          ┌─────────────────┼──────────────────┐
 *        scene (SVG)     build() (GSAP)     steps / readouts / formula
 *
 * The scene renders geometry reactively from D. build() only animates how
 * scene elements appear (draw, fade, rise); it never computes geometry.
 * Changing an input re-derives D, the scene re-renders, and the engine
 * rebuilds the timeline at the same progress.
 */

export interface StepDef<D> {
  /** Timeline label for this step; build() must add it via ctx.step(). */
  id: string
  /** Narration under the stage; may contain inline maths in $…$. */
  caption: (d: D) => string
  /** Line written to the Log card when this step is reached. */
  log?: (d: D) => LogSegment[]
}

export interface BuildContext<D> {
  tl: gsap.core.Timeline
  d: D
  /** Elements in this scene with data-el="<name>". */
  el: (name: string) => Element[]
  /** Mark where a step starts. Call once per StepDef, in order. */
  step: (id: string, at: number) => void
}

export interface ConceptModule<S extends ParamSchema = ParamSchema, D = unknown> {
  params: S
  presets?: Preset<S>[]
  derive: (p: ParamValues<S>) => D
  steps: StepDef<D>[]
  readouts?: (d: D) => Readout[]
  /** Live formula under the Values card (LaTeX). */
  formula?: (d: D) => string
  /** SVG content, rendered inside <svg :viewBox>. Receives prop `d`. */
  scene: Component
  viewBox: string
  build: (ctx: BuildContext<D>) => void
}

/** Identity helper that keeps the param and derived types linked. */
export function defineConcept<S extends ParamSchema, D>(m: ConceptModule<S, D>): ConceptModule<S, D> {
  return m
}

/** Loosely-typed module, as stored in the registry. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyConceptModule = ConceptModule<any, any>
