import { expect, test, type Page } from '@playwright/test'
import { visit } from './helpers'

/** Phase 4: Softmax and Gradient Descent, plus a smoke test for every ready concept. */

const goToStep = (page: Page, i: number) => page.evaluate((s) => (window as any).__aiviz.goToStep(s), i)
const caption = (page: Page) => page.locator('.caption')

async function open(page: Page, path: string) {
  await visit(page, path)
  await page.locator('svg.scene.ready').waitFor()
}

test.describe('every ready concept', () => {
  for (const path of ['/foundations/vectors', '/foundations/dot-product', '/foundations/cosine-similarity', '/foundations/matrix-multiplication', '/foundations/derivatives-chain-rule', '/learning-basics/supervised-learning', '/learning-basics/loss-function', '/learning-basics/maximum-likelihood', '/learning-basics/cross-entropy', '/learning-basics/overfitting', '/learning-basics/regularization', '/learning-basics/training-curve', '/transformers-llms/softmax', '/optimisation/gradient-descent', '/transformers-llms/temperature', '/optimisation/learning-rate']) {
    test(`${path} plays through every step without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => {
        if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('[player]'))) errors.push(m.text())
      })
      await open(page, path)
      const total = Number((await page.locator('.player .pill').textContent())!.split('/')[1])
      for (let i = 0; i < total; i++) {
        await goToStep(page, i)
        await expect(page.locator('.player .pill')).toHaveText(`${i + 1} / ${total}`)
        await expect(caption(page)).not.toBeEmpty()
      }
      await expect(page.locator('.log-body .line')).toHaveCount(total)
      expect(errors).toEqual([])
    })
  }
})

test.describe('softmax', () => {
  test('worked example: Paris gets 80.4%', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('Paris')
    await expect(page.locator('[data-el="prob-val-0"]')).toHaveText('80.4%')
    await expect(page.locator('[data-el="exp-val-0"]')).toHaveText('54.6')
    await expect(page.locator('[data-el="top-row"]')).toHaveCSS('opacity', '1')
  })

  test('temperature step rescales the logit bars in place', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await page.getByRole('button', { name: 'Creative (T = 2)' }).click()
    await goToStep(page, 0)
    const bar = page.locator('[data-el="scaled-bar-0"]')
    const before = Number(await bar.getAttribute('width'))
    await goToStep(page, 1)
    await expect(caption(page)).toContainText('squeezes')
    await expect(page.locator('[data-el="scaled-val-0"]')).toHaveText('2.00')
    expect(Number(await bar.getAttribute('width'))).toBeCloseTo(before / 2, 1)
  })

  test('presets: low temperature sharpens, tied scores are uniform', async ({ page }) => {
    await open(page, '/transformers-llms/softmax')
    await goToStep(page, 5)
    await page.getByRole('button', { name: 'Confident (T = 0.5)' }).click()
    await expect(page.locator('[data-el="prob-val-0"]')).toHaveText('96.8%')
    await expect(caption(page)).toContainText('almost certain')
    await page.getByRole('button', { name: 'Tied scores' }).click()
    for (let i = 0; i < 4; i++) await expect(page.locator(`[data-el="prob-val-${i}"]`)).toHaveText('25.0%')
  })
})

test.describe('gradient descent', () => {
  test('default run converges to the bowl minimum', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 3)
    await expect(caption(page)).toContainText('= -0.75') // θ₁ worked out
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('bottom of a valley')
    await expect(page.locator('.log-body .line').last()).toContainText('converged')
  })

  test('learning-rate presets tell three different stories', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 5)

    await page.getByRole('button', { name: 'Too small', exact: true }).click()
    await expect(caption(page)).toContainText('progress is slow')

    await page.getByRole('button', { name: 'Too large', exact: true }).click()
    await expect(caption(page)).toContainText('too large')
    await expect(page.locator('[data-el="off-label"]')).toContainText('off the chart')
    await expect(page.locator('[data-el="off-label"]')).toHaveCSS('opacity', '1')

    await page.getByRole('button', { name: 'Wrong valley', exact: true }).click()
    await expect(caption(page)).toContainText('local minimum')
  })

  test('changing the learning rate keeps the step and redraws the path', async ({ page }) => {
    await open(page, '/optimisation/gradient-descent')
    await goToStep(page, 4)
    const slider = page.getByRole('slider', { name: /Learning rate/ })
    await slider.focus()
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft') // 0.50 → 0.40
    await expect(page.locator('.player .pill')).toHaveText('5 / 6')
    await expect(page.locator('.readouts dd').first()).toHaveText('0.40')
    await expect(page.locator('[data-el="pt-5"]')).toHaveCSS('opacity', '1')
  })
})

test.describe('temperature', () => {
  test('default T = 0.5: Paris rises from 80.4% to 96.8%, samples add up to 20', async ({ page }) => {
    await open(page, '/transformers-llms/temperature')
    await goToStep(page, 1)
    await expect(page.locator('[data-el="ghost-val-0"]')).toHaveText('80.4%')
    // No spoiler: the new probabilities and the winner are still hidden.
    await expect(page.locator('[data-el="prob-bar-0"]')).toHaveCSS('opacity', '0')
    await expect(page.locator('[data-el="top-row"]')).toHaveCSS('opacity', '0')

    await goToStep(page, 2)
    await expect(caption(page)).toContainText('from 1.8 to 3.6')

    await goToStep(page, 6)
    await expect(page.locator('[data-el="prob-val-0"]')).toHaveText('96.8%')
    await expect(caption(page)).toContainText('greedy')
    await expect(page.locator('[data-el^="dot-"].dot')).toHaveCount(20)
    await expect(page.locator('[data-el="top-row"]')).toHaveCSS('opacity', '1')
  })

  test('presets: hot spreads out, the open-ended prompt is almost uniform', async ({ page }) => {
    await open(page, '/transformers-llms/temperature')
    await goToStep(page, 6)
    await page.getByRole('button', { name: 'Hot (T = 2.5)' }).click()
    await expect(caption(page)).toContainText('More variety')
    await page.getByRole('button', { name: 'Open-ended prompt' }).click()
    await expect(page.locator('[data-el="prompt"]')).toContainText('The old house was')
    await expect(caption(page)).toContainText('almost washed out')
    await expect(page.locator('.player .pill')).toHaveText('7 / 7')
  })
})

test.describe('learning rate', () => {
  test('default: crawls, settles, blows up', async ({ page }) => {
    await open(page, '/optimisation/learning-rate')
    await goToStep(page, 2)
    await expect(caption(page)).toContainText('0.35, 2.45, 7.18')
    // Verdicts stay hidden until the last step.
    await expect(page.locator('[data-el="status-0"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 7)
    await expect(page.locator('[data-el="status-0"]')).toHaveText('crawls')
    await expect(page.locator('[data-el="status-1"]')).toHaveText('settles')
    await expect(page.locator('[data-el="status-2"]')).toHaveText('blows up')
    await expect(page.locator('[data-el="status-2"]')).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-el="factor-1"]')).toContainText('0.30')
  })

  test('the edge at 2: η = 2 bounces forever, η = 2.1 diverges', async ({ page }) => {
    await open(page, '/optimisation/learning-rate')
    await page.getByRole('button', { name: 'The edge at 2' }).click()
    await goToStep(page, 4)
    await expect(caption(page)).toContainText('bounces between the same two points')
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('blows up')
  })

  test('changing one panel keeps the step', async ({ page }) => {
    await open(page, '/optimisation/learning-rate')
    await goToStep(page, 6)
    const slider = page.getByRole('slider', { name: /middle panel/ })
    await slider.focus()
    await page.keyboard.press('End') // η₂ = 2.2
    await expect(page.locator('.player .pill')).toHaveText('7 / 8')
    await expect(page.locator('[data-el="factor-1"]')).toContainText('1.20')
  })
})

/* Phase 6 Batch 2: Foundations. */

test.describe('vectors', () => {
  test('worked example: the ledger fills in step by step, nothing early', async ({ page }) => {
    await open(page, '/foundations/vectors')
    await goToStep(page, 4)
    await expect(page.locator('[data-el="row-sum"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 7)
    await expect(page.locator('[data-el="row-len"]')).toContainText('3.61')
    await expect(page.locator('[data-el="row-sum"]')).toContainText('(4, 1)')
    await expect(page.locator('[data-el="row-ka"]')).toContainText('(6, 4)')
    await expect(page.locator('[data-el="row-unit"]')).toContainText('(0.83, 0.55)')
  })

  test('presets: cancelling out leaves no sum arrow; k = −1 flips', async ({ page }) => {
    await open(page, '/foundations/vectors')
    await page.getByRole('button', { name: 'Cancel out' }).click()
    await goToStep(page, 5)
    await expect(caption(page)).toContainText('cancel out')
    await expect(page.locator('[data-el="sum"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Flip (k = −1)' }).click()
    await goToStep(page, 6)
    await expect(caption(page)).toContainText('opposite way')
  })
})

test.describe('cosine similarity', () => {
  test('default: cos θ = 0.707, and stretching b changes only the dot product', async ({ page }) => {
    await open(page, '/foundations/cosine-similarity')
    await goToStep(page, 5)
    await expect(page.locator('[data-el="gauge-dot"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="cos-text"]')).toContainText('0.707')
    await expect(page.locator('[data-el="dot-2"]')).toContainText('10')
    const k = page.getByRole('slider', { name: /Stretch b/ })
    await k.focus()
    await page.keyboard.press('End') // k = 3
    await expect(page.locator('.player .pill')).toHaveText('7 / 7')
    await expect(page.locator('[data-el="dot-2"]')).toContainText('15')
    await expect(page.locator('[data-el="cos-text"]')).toContainText('0.707')
  })

  test('presets: perpendicular and opposite', async ({ page }) => {
    await open(page, '/foundations/cosine-similarity')
    await goToStep(page, 6)
    await page.getByRole('button', { name: 'Perpendicular' }).click()
    await expect(caption(page)).toContainText('perpendicular')
    await page.getByRole('button', { name: 'Opposite' }).click()
    await expect(caption(page)).toContainText('exactly opposite')
    await expect(page.locator('[data-el="cos-text"]')).toContainText('−1')
  })
})

test.describe('matrix multiplication', () => {
  test('one dot product per row, output cells fill in order', async ({ page }) => {
    await open(page, '/foundations/matrix-multiplication')
    await goToStep(page, 2)
    await expect(page.locator('[data-el="work-1"]')).toContainText('1·3 + 2·1 = 5')
    await expect(page.locator('[data-el="y-cell-0-0"]')).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-el="y-cell-1-0"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 4)
    await expect(page.locator('[data-el="y-cell-1-0"]')).toHaveText('1')
    await expect(page.locator('[data-el="A-row-0"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 7)
    await expect(caption(page)).toContainText('shear')
    await expect(page.locator('[data-el="mix"]')).toContainText('3·(1, 0) + 1·(2, 1)')
  })

  test('presets: rotation and collapse', async ({ page }) => {
    await open(page, '/foundations/matrix-multiplication')
    await goToStep(page, 7)
    await page.getByRole('button', { name: 'Rotate 90°' }).click()
    await expect(caption(page)).toContainText('rotation')
    await expect(page.locator('[data-el="y-cell-0-0"]')).toHaveText('−1')
    await page.getByRole('button', { name: 'Collapse' }).click()
    await expect(caption(page)).toContainText('squashed onto a line')
    await expect(page.locator('[data-el="det"]')).toContainText('areas × 0')
  })
})

test.describe('derivatives and chain rule', () => {
  test('default: (2x + 1)² at x = 1, slopes appear one at a time, dy/dx = 6 × 2 = 12', async ({ page }) => {
    await open(page, '/foundations/derivatives-chain-rule')
    await goToStep(page, 3)
    await expect(page.locator('[data-el="rise-label-g"]')).toHaveText('Δu = 1')
    await expect(page.locator('[data-el="mult-g"]')).toHaveText('× 2')
    await expect(page.locator('[data-el="mult-f"]')).toHaveCSS('opacity', '0')
    await expect(page.locator('[data-el="result"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="rise-label-f"]')).toHaveText('Δy = 7')
    await expect(page.locator('[data-el="result"]')).toContainText('6 × 2')
    await expect(page.locator('[data-el="result"]')).toContainText('= 12')
  })

  test('presets: a tiny nudge measures 12.2; the neuron multiplies a small sigmoid slope', async ({ page }) => {
    await open(page, '/foundations/derivatives-chain-rule')
    await goToStep(page, 6)
    await page.getByRole('button', { name: 'Tiny nudge' }).click()
    await expect(page.locator('.log-body .line').last()).toContainText('Δy/Δx = 12.2')
    await page.getByRole('button', { name: 'Neuron: σ(2x + 1)' }).click()
    await expect(page.locator('.player .pill')).toHaveText('7 / 7')
    await expect(page.locator('[data-el="result"]')).toContainText('0.197 × 2')
    await expect(page.locator('[data-el="result"]')).toContainText('= 0.393')
  })
})

/* Phase 6 Batch 3: Learning Basics. */

test.describe('learning basics', () => {
  test('supervised learning: 4.5 h → 73; 12 h is flagged as impossible', async ({ page }) => {
    await open(page, '/learning-basics/supervised-learning')
    await goToStep(page, 4)
    await expect(page.locator('[data-el="q-pt"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="q-label"]')).toHaveText('73?')
    await page.getByRole('button', { name: 'Far outside (12 h)' }).click()
    await expect(page.locator('[data-el="q-label"]')).toHaveText('118?')
    await expect(caption(page)).toContainText('impossible')
  })

  test('loss function: MSE 30.17 for the default line, 1.67 for the best', async ({ page }) => {
    await open(page, '/learning-basics/loss-function')
    await goToStep(page, 4)
    await expect(page.locator('[data-el="bar-mine-label"]')).toContainText('30.17')
    await expect(page.locator('[data-el="worst-label"]')).toContainText('81')
    await expect(page.locator('[data-el="bar-best-label"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="bar-best-label"]')).toContainText('1.67')
    await page.getByRole('button', { name: 'One outlier' }).click()
    await expect(page.locator('[data-el="worst-label"]')).toContainText('361')
  })

  test('maximum likelihood: the peak is at the mean, 3.4', async ({ page }) => {
    await open(page, '/learning-basics/maximum-likelihood')
    await goToStep(page, 3)
    await expect(page.locator('[data-el="log"]')).toContainText('8.65')
    await expect(page.locator('[data-el="peak"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 5)
    await expect(page.locator('[data-el="peak"]')).toContainText('3.4')
  })

  test('cross-entropy: Paris 0.22; the right answer is not coloured before its step', async ({ page }) => {
    await open(page, '/learning-basics/cross-entropy')
    await goToStep(page, 0)
    await expect(page.locator('[data-el="answer-mark"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 5)
    await expect(page.locator('[data-el="loss-label"]')).toContainText('0.22')
    await page.getByRole('button', { name: 'Wrong & confident' }).click()
    await expect(page.locator('[data-el="loss-label"]')).toContainText('5.72')
    await expect(caption(page)).toContainText('Confident and wrong')
  })

  test('overfitting: degree 7 memorises, degree 3 is best', async ({ page }) => {
    await open(page, '/learning-basics/overfitting')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="train-err"]')).toContainText('0.0000')
    await expect(page.locator('[data-el="test-err"]')).toContainText('3.20')
    await expect(caption(page)).toContainText('Overfitting')
    await page.getByRole('button', { name: 'Just right (3)' }).click()
    await expect(caption(page)).toContainText('lowest test error')
  })

  test('regularization: λ = 10⁻³ cuts test error to 0.0309', async ({ page }) => {
    await open(page, '/learning-basics/regularization')
    await goToStep(page, 4)
    await expect(page.locator('[data-el="test-err-new"]')).toHaveCSS('opacity', '0')
    await goToStep(page, 7)
    await expect(page.locator('[data-el="test-err-new"]')).toContainText('0.0309')
    await page.getByRole('button', { name: 'Too strong (λ = 1)' }).click()
    await expect(caption(page)).toContainText('too strong')
  })

  test('training curve: best epoch 23 when overfitting; the epoch slider reads values', async ({ page }) => {
    await open(page, '/learning-basics/training-curve')
    await goToStep(page, 6)
    await expect(page.locator('[data-el="best"]')).toContainText('epoch 23')
    await expect(page.locator('[data-el="cur"]')).toContainText('epoch 45')
    await page.getByRole('button', { name: 'Learning rate too high' }).click()
    await expect(caption(page)).toContainText('learning rate that is too high')
  })
})
