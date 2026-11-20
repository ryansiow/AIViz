import katex from 'katex'

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Snap to a step grid, avoiding float noise like 0.30000000000000004. */
export function snap(v: number, step = 1): number {
  const decimals = (String(step).split('.')[1] || '').length
  return Number((Math.round(v / step) * step).toFixed(decimals))
}

export function formatNumber(v: number | string, digits = 3): string {
  if (typeof v === 'string') return v
  if (!Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Render text with inline maths in $…$ to HTML. Everything outside the
 * dollar signs is escaped, so this is safe for authored strings.
 */
export function renderInlineTex(text: string): string {
  return text
    .split(/(\$[^$]+\$)/g)
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          return katex.renderToString(part.slice(1, -1), { throwOnError: false })
        } catch {
          return escapeHtml(part)
        }
      }
      return escapeHtml(part)
    })
    .join('')
}
