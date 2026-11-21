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
  const parts = text.split(/(\$[^$]+\$)/g)
  let out = ''
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!
    if (!(part.startsWith('$') && part.endsWith('$') && part.length > 2)) {
      out += escapeHtml(part)
      continue
    }
    let html: string
    try {
      html = katex.renderToString(part.slice(1, -1), { throwOnError: false })
    } catch {
      html = escapeHtml(part)
    }
    // Keep punctuation right after the maths on the same line ("$x$," never wraps before the comma).
    const glue = parts[i + 1]?.match(/^[,.;:!?)]+/)?.[0]
    if (glue) {
      out += `<span style="white-space:nowrap">${html}${escapeHtml(glue)}</span>`
      parts[i + 1] = parts[i + 1]!.slice(glue.length)
    } else {
      out += html
    }
  }
  return out
}

/**
 * Rounds to `digits` decimals the way a person would on paper: 7.175 → 7.18.
 * (toFixed works on the binary value, and 7.175 is stored as 7.17499…, so it gives 7.17.)
 */
export function roundTo(v: number, digits = 2): number {
  if (!Number.isFinite(v)) return v
  const clean = Number(v.toPrecision(12))
  const shifted = Math.round(Math.abs(Number(`${clean}e${digits}`)))
  return Math.sign(clean) * Number(`${shifted}e-${digits}`)
}
