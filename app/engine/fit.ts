/**
 * Small model-fitting helpers for the Learning Basics concepts: least squares
 * (a line, or a ridge-regularised polynomial), mean squared error and the
 * normal density. Pure and deterministic, so they are unit-tested.
 */

/** Solves A·x = b by Gaussian elimination with partial pivoting. A is n × n. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]!])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r
    ;[M[c], M[p]] = [M[p]!, M[c]!]
    const piv = M[c]![c]!
    if (Math.abs(piv) < 1e-14) throw new Error('singular system')
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r]![c]! / piv
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!
    }
  }
  return M.map((row, i) => row[n]! / row[i]!)
}

export const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length

/** Mean squared error between predictions and targets. */
export function mse(pred: number[], y: number[]): number {
  return mean(pred.map((p, i) => (p - y[i]!) ** 2))
}

/** Least-squares line y = w·x + b. */
export function linearFit(xs: number[], ys: number[]): { w: number; b: number } {
  const mx = mean(xs)
  const my = mean(ys)
  let sxy = 0
  let sxx = 0
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i]! - my)
    sxx += (x - mx) ** 2
  })
  const w = sxx ? sxy / sxx : 0
  return { w, b: my - w * mx }
}

export interface PolyModel {
  degree: number
  lambda: number
  /** Coefficients on t = the input rescaled to [−1, 1] (keeps the system well conditioned). */
  coef: number[]
  predict: (x: number) => number
}

/**
 * Polynomial least squares with an L2 (ridge) penalty λ·Σ cₖ² on every
 * coefficient except the constant. `range` is the input range mapped to [−1, 1].
 */
export function polyFit(xs: number[], ys: number[], degree: number, lambda = 0, range: [number, number] = [Math.min(...xs), Math.max(...xs)]): PolyModel {
  const [lo, hi] = range
  const toT = (x: number) => (2 * (x - lo)) / (hi - lo || 1) - 1
  const n = degree + 1
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const rhs = new Array<number>(n).fill(0)
  xs.forEach((x, i) => {
    const t = toT(x)
    const pw = Array.from({ length: n }, (_, k) => t ** k)
    for (let r = 0; r < n; r++) {
      rhs[r]! += pw[r]! * ys[i]!
      for (let c = 0; c < n; c++) A[r]![c]! += pw[r]! * pw[c]!
    }
  })
  for (let k = 1; k < n; k++) A[k]![k]! += lambda * xs.length
  const coef = solve(A, rhs)
  const predict = (x: number) => {
    const t = toT(x)
    let v = 0
    for (let k = n - 1; k >= 0; k--) v = v * t + coef[k]!
    return v
  }
  return { degree, lambda, coef, predict }
}

export function normalPdf(x: number, mu: number, sigma: number): number {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI))
}
