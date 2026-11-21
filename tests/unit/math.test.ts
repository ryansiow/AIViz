import { describe, expect, it } from 'vitest'
import { clamp, formatNumber, renderInlineTex, snap } from '~/utils/math'

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('snap', () => {
  it('rounds to the step', () => {
    expect(snap(2.4, 1)).toBe(2)
    expect(snap(2.6, 1)).toBe(3)
    expect(snap(0.37, 0.25)).toBe(0.25)
  })
  it('avoids floating-point noise', () => {
    expect(snap(0.1 + 0.2, 0.1)).toBe(0.3)
    expect(snap(1.005, 0.001)).toBe(1.005)
  })
  it('defaults to whole numbers', () => {
    expect(snap(-1.6)).toBe(-2)
  })
})

describe('formatNumber', () => {
  it('formats to fixed digits', () => {
    expect(formatNumber(Math.PI)).toBe('3.142')
    expect(formatNumber(5, 0)).toBe('5')
  })
  it('passes strings through', () => {
    expect(formatNumber('aligned')).toBe('aligned')
  })
  it('shows a dash for non-finite numbers', () => {
    expect(formatNumber(NaN)).toBe('—')
    expect(formatNumber(Infinity)).toBe('—')
  })
})

describe('renderInlineTex', () => {
  it('renders $…$ with KaTeX and leaves the rest as text', () => {
    const html = renderInlineTex('Draw $\\mathbf{w}$ now')
    expect(html.startsWith('Draw ')).toBe(true)
    expect(html).toContain('class="katex"')
    expect(html.endsWith(' now')).toBe(true)
  })
  it('escapes HTML outside maths', () => {
    expect(renderInlineTex('<b>x</b> & y')).toBe('&lt;b&gt;x&lt;/b&gt; &amp; y')
  })
  it('keeps punctuation after maths on the same line', () => {
    const html = renderInlineTex('so $x = 1$, then')
    expect(html).toMatch(/^so <span style="white-space:nowrap"><span class="katex">.*<\/span>,<\/span> then$/)
  })
  it('leaves a lone dollar sign alone', () => {
    expect(renderInlineTex('costs $5')).toBe('costs $5')
  })
})

describe('roundTo', () => {
  it('rounds decimal halves up, like on paper', async () => {
    const { roundTo } = await import('~/utils/math')
    expect(roundTo(2.05 * 3.5)).toBe(7.18)
    expect(roundTo(1.005)).toBe(1.01)
    expect(roundTo(-7.175)).toBe(-7.18)
    expect(roundTo(0.1 + 0.2)).toBe(0.3)
    expect(roundTo(5, 0)).toBe(5)
    expect(roundTo(Infinity)).toBe(Infinity)
  })
})
