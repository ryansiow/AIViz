/**
 * Shared types for concept modules.
 *
 * A concept declares its inputs as a ParamSchema. The right-hand panel builds
 * its controls from that schema, and the visualisation reads the resulting
 * ParamValues. Phase 3 adds `derive()` and `build()` on top of this.
 */

/** Semantic colour roles from the design tokens (--c-<hue>). */
export type Hue = 'blue' | 'rose' | 'violet' | 'green' | 'amber' | 'neutral'

interface ParamBase {
  /** Plain-text label, used for accessibility and as a fallback. */
  label: string
  /** Optional LaTeX label shown instead of `label` (e.g. "\\mathbf{w}"). */
  tex?: string
  hue?: Hue
  /** One-line help text under the control. */
  hint?: string
}

export interface NumberParam extends ParamBase {
  kind: 'number'
  min: number
  max: number
  step?: number
  default: number
  /** 'slider' (default) or a compact numeric 'field'. */
  control?: 'slider' | 'field'
  /** Digits shown next to a slider. */
  digits?: number
}

export interface Vector2Param extends ParamBase {
  kind: 'vector2'
  /** Inclusive range for both components. */
  range: [number, number]
  step?: number
  default: [number, number]
  /** Component labels in LaTeX, default x₁ / x₂. */
  components?: [string, string]
  /** Reject the zero vector (e.g. when a direction is needed). */
  nonZero?: boolean
}

export interface SelectParam extends ParamBase {
  kind: 'select'
  options: { value: string; label: string }[]
  default: string
}

export interface ToggleParam extends ParamBase {
  kind: 'toggle'
  default: boolean
}

export type ParamSpec = NumberParam | Vector2Param | SelectParam | ToggleParam
export type ParamSchema = Record<string, ParamSpec>

type ValueOf<P extends ParamSpec> = P extends NumberParam
  ? number
  : P extends Vector2Param
    ? [number, number]
    : P extends SelectParam
      ? string
      : P extends ToggleParam
        ? boolean
        : never

export type ParamValues<S extends ParamSchema> = { [K in keyof S]: ValueOf<S[K]> }

export interface Preset<S extends ParamSchema = ParamSchema> {
  label: string
  values: Partial<ParamValues<S>>
}

/** One live number in the Values card. */
export interface Readout {
  /** LaTeX label, e.g. "\\cos\\theta". */
  tex: string
  value: number | string
  hue?: Hue
  digits?: number
}

/** A piece of a log line; `hue` colours a value. */
export interface LogSegment {
  text: string
  hue?: Hue
}

export interface LogEntry {
  step: number
  segments: LogSegment[]
}

/** One draggable handle on the VectorPad. */
export interface PadVector {
  key: string
  label: string
  hue?: Hue
  value: [number, number]
  nonZero?: boolean
}

/** Metadata shown in the hover tracking overlay. */
export interface TrackMeta {
  id: string
  kind: string
  name: string
  hue?: Hue
  rows: [string, string][]
  /** Optional footer, e.g. a timestamp from the player. */
  foot?: string
}

/** CSS colour for a hue role. */
export function hueVar(hue: Hue | undefined): string {
  return !hue || hue === 'neutral' ? 'var(--text)' : `var(--c-${hue})`
}

export function hueSoftVar(hue: Hue | undefined): string {
  return !hue || hue === 'neutral' ? 'var(--surface-2)' : `var(--c-${hue}-soft)`
}

/** Default values for a schema. */
export function defaultsOf<S extends ParamSchema>(schema: S): ParamValues<S> {
  const out: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(schema)) {
    out[key] = Array.isArray(spec.default) ? [...spec.default] : spec.default
  }
  return out as ParamValues<S>
}
