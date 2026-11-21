import type { Rect, Vec } from './plane'

/**
 * Matrix helpers: grid layout for drawing a matrix as cells, plus the 2×2
 * maths used by the Matrix Multiplication concept.
 */

export type Mat2 = [[number, number], [number, number]]

export const matVec = (A: Mat2, v: Vec): Vec => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]
export const det2 = (A: Mat2) => A[0][0] * A[1][1] - A[0][1] * A[1][0]
export const column = (A: Mat2, j: 0 | 1): Vec => [A[0][j], A[1][j]]

/** Inverse of a 2×2 matrix, or null when it is singular. */
export function inverse2(A: Mat2): Mat2 | null {
  const d = det2(A)
  if (Math.abs(d) < 1e-12) return null
  return [
    [A[1][1] / d, -A[0][1] / d],
    [-A[1][0] / d, A[0][0] / d],
  ]
}

export type MatrixKind = 'identity' | 'collapse' | 'rotation' | 'reflection' | 'stretch' | 'shear' | 'general'

/** What a 2×2 matrix does to the plane, in plain words. */
export function classify2(A: Mat2, eps = 1e-9): MatrixKind {
  const [[a, b], [c, d]] = A
  const near = (u: number, v: number) => Math.abs(u - v) < eps
  const det = det2(A)
  if (near(det, 0)) return 'collapse'
  if (near(a, 1) && near(b, 0) && near(c, 0) && near(d, 1)) return 'identity'
  // Orthogonal: columns are unit length and perpendicular.
  if (near(a * a + c * c, 1) && near(b * b + d * d, 1) && near(a * b + c * d, 0)) return det > 0 ? 'rotation' : 'reflection'
  if (near(b, 0) && near(c, 0)) return 'stretch'
  if (near(a, 1) && near(d, 1) && (near(b, 0) || near(c, 0))) return 'shear'
  return 'general'
}

export interface GridCell extends Rect { r: number; c: number; cx: number; cy: number }

export interface GridLayout extends Rect {
  cells: GridCell[]
  /** Highlight boxes around each row and each column (slightly larger than the cells). */
  rows: Rect[]
  cols: Rect[]
  /** Square-bracket paths either side of the grid. */
  bracket: { left: string; right: string }
}

/** Cells for an m × n matrix whose top-left cell starts at (x, y). */
export function gridLayout(m: number, n: number, x: number, y: number, cell = 40, gap = 4): GridLayout {
  const w = n * cell + (n - 1) * gap
  const h = m * cell + (m - 1) * gap
  const cells: GridCell[] = []
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      const cx0 = x + c * (cell + gap)
      const cy0 = y + r * (cell + gap)
      cells.push({ r, c, x: cx0, y: cy0, w: cell, h: cell, cx: cx0 + cell / 2, cy: cy0 + cell / 2 })
    }
  const o = 3 // highlight outset
  const rows = Array.from({ length: m }, (_, r) => ({ x: x - o, y: y + r * (cell + gap) - o, w: w + 2 * o, h: cell + 2 * o }))
  const cols = Array.from({ length: n }, (_, c) => ({ x: x + c * (cell + gap) - o, y: y - o, w: cell + 2 * o, h: h + 2 * o }))
  const bx = 7 // bracket distance from the cells
  const arm = 6
  const top = y - 4
  const bot = y + h + 4
  const L = x - bx
  const R = x + w + bx
  return {
    x,
    y,
    w,
    h,
    cells,
    rows,
    cols,
    bracket: {
      left: `M${L + arm} ${top} H${L} V${bot} H${L + arm}`,
      right: `M${R - arm} ${top} H${R} V${bot} H${R - arm}`,
    },
  }
}
