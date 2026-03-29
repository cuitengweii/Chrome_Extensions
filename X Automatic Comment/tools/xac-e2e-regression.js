const fs = require('fs')
const os = require('os')
const path = require('path')
let chromium
try {
  ({ chromium } = require('playwright'))
} catch (error) {
  console.error('Missing dependency: playwright')
  console.error('Install once with: npm install --prefix C:\\Temp\\xac-playwright-runtime playwright')
  console.error('Then run with: $env:NODE_PATH=\"C:\\Temp\\xac-playwright-runtime\\node_modules\"; node tools/xac-e2e-regression.js')
  process.exit(2)
}

const EXTENSION_PATH = path.resolve(__dirname, '..')
const START_TIMEOUT_MS = 60000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function parseCountLabel(text) {
  const normalized = normalizeText(text)
  const m = normalized.match(/(\d+)(?:\s*\/\s*(\d+))?/) || normalized.match(/run\s+(\d+)/i)
  if (!m) return { raw: normalized, count: null, max: null }
  return {
    raw: normalized,
    count: Number(m[1]),
    max: m[2] != null ? Number(m[2]) : null
  }
}

async function ensurePanelOpen(page) {
  const fallbacks = [
    null,
    'https://x.com/search?q=playwright&src=typed_query&f=live',
    'https://x.com/explore',
    'https://x.com/home',
    'https://x.com'
  ]

  let lastError = null
  for (const target of fallbacks) {
    if (target) {
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: START_TIMEOUT_MS })
      } catch (_error) {
        // continue and still try to detect panel on current page
      }
    }

    try {
      await page.waitForSelector('#xac-root', { timeout: 15000 })
      const collapsed = await page.$eval('#xac-root', (el) => el.classList.contains('collapsed')).catch(() => false)
      if (collapsed) {
        await page.click('#xac-t').catch(() => {})
        await sleep(300)
      }
      await page.waitForSelector('#xac-run-toggle', { timeout: 20000 })
      return
    } catch (error) {
      lastError = error
      await sleep(1000)
    }
  }

  throw lastError || new Error('Failed to detect xac panel on any X page')
}

async function captureExecutionState(page) {
  return page.evaluate(() => {
    const toggle = document.querySelector('#xac-run-toggle')
    const status = document.querySelector('#xac-status')
    const indicator = document.querySelector('#xac-ind')
    const indicatorLabel = document.querySelector('#xac-ind-l')
    const maxInput = document.querySelector('#xac-max')
    const singleToggleCount = document.querySelectorAll('#xac-run-toggle').length
    const legacyButtons = [
      document.querySelector('#xac-run-start'),
      document.querySelector('#xac-run-stop'),
      document.querySelector('#xac-start-auto'),
      document.querySelector('#xac-stop-auto')
    ].filter(Boolean).length
    const compactOnly = {
      openOptions: document.querySelectorAll('#xac-open-options').length,
      openSearch: document.querySelectorAll('#xac-open-search').length,
      profileSelect: document.querySelectorAll('#xac-p').length,
      searchInclude: document.querySelectorAll('#xac-search-include-a').length,
      sparkUrl: document.querySelectorAll('#xac-spark-url').length
    }

    return {
      toggleText: (toggle?.textContent || '').trim(),
      statusText: (status?.textContent || '').trim(),
      indicatorShown: indicator ? indicator.classList.contains('show') : false,
      indicatorText: (indicatorLabel?.textContent || '').trim(),
      maxValue: maxInput ? String(maxInput.value || '') : '',
      singleToggleCount,
      legacyButtons,
      compactOnly
    }
  })
}

async function createContext(userDataDir) {
  const args = [
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`
  ]

  try {
    const headed = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      viewport: { width: 1366, height: 900 },
      args
    })
    return { context: headed, mode: 'headed' }
  } catch (error) {
    const headless = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      viewport: { width: 1366, height: 900 },
      args
    })
    const reason = error && error.message ? error.message.split('\n')[0] : 'unknown'
    return { context: headless, mode: `headless-fallback (${reason})` }
  }
}

async function gotoXPage(page) {
  const urls = [
    'https://x.com/search?q=playwright&src=typed_query&f=live',
    'https://x.com/explore',
    'https://x.com/home',
    'https://x.com'
  ]
  let lastError
  for (const target of urls) {
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: START_TIMEOUT_MS })
      return
    } catch (error) {
      const current = String(page.url() || '')
      const onX = current.includes('://x.com') || current.includes('://www.x.com')
      const interrupted = String(error && error.message ? error.message : '').includes('interrupted by another navigation')
      if (onX && interrupted) {
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
        return
      }
      lastError = error
    }
  }
  throw lastError || new Error('Unable to open any X page')
}

async function run() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xac-e2e-'))
  const checks = []
  let context
  let launchMode = 'unknown'

  try {
    const launch = await createContext(userDataDir)
    context = launch.context
    launchMode = launch.mode

    let page = context.pages()[0]
    if (!page) page = await context.newPage()

    await gotoXPage(page)
    await ensurePanelOpen(page)

    const initial = await captureExecutionState(page)

    checks.push({
      id: 'single-toggle-button',
      pass: initial.singleToggleCount === 1 && initial.legacyButtons === 0,
      detail: { singleToggleCount: initial.singleToggleCount, legacyButtons: initial.legacyButtons }
    })

    checks.push({
      id: 'compact-sidebar-scope',
      pass:
        initial.compactOnly.openOptions === 1 &&
        initial.compactOnly.openSearch === 1 &&
        initial.compactOnly.profileSelect === 0 &&
        initial.compactOnly.searchInclude === 0 &&
        initial.compactOnly.sparkUrl === 0,
      detail: initial.compactOnly
    })

    await page.fill('#xac-max', '2')
    await page.dispatchEvent('#xac-max', 'change')

    await page.click('#xac-run-toggle')
    await sleep(1200)
    const running1 = await captureExecutionState(page)

    checks.push({
      id: 'status-after-start',
      pass: normalizeText(running1.toggleText) !== normalizeText(initial.toggleText) && running1.indicatorShown,
      detail: {
        beforeToggle: initial.toggleText,
        afterToggle: running1.toggleText,
        status: running1.statusText,
        indicatorShown: running1.indicatorShown
      }
    })

    await page.click('#xac-run-toggle')
    await sleep(500)
    const stopped1 = await captureExecutionState(page)

    checks.push({
      id: 'status-after-stop',
      pass: normalizeText(stopped1.toggleText) === normalizeText(initial.toggleText) && !stopped1.indicatorShown,
      detail: {
        toggleText: stopped1.toggleText,
        status: stopped1.statusText,
        indicatorShown: stopped1.indicatorShown
      }
    })

    await page.click('#xac-run-toggle')
    await sleep(1200)
    const running2 = await captureExecutionState(page)

    const countInfoRunning2 = parseCountLabel(running2.indicatorText)
    checks.push({
      id: 'count-visible-on-rerun',
      pass: running2.indicatorShown && Number.isFinite(countInfoRunning2.count),
      detail: {
        indicatorText: running2.indicatorText,
        parsed: countInfoRunning2
      }
    })

    const stopBtnVisible = await page.locator('#xac-ind-s').isVisible().catch(() => false)
    if (stopBtnVisible) {
      await page.click('#xac-ind-s')
    } else {
      await page.click('#xac-run-toggle')
    }
    await sleep(500)

    const stopped2 = await captureExecutionState(page)
    checks.push({
      id: 'stop-consistency-via-indicator-or-toggle',
      pass: !stopped2.indicatorShown && normalizeText(stopped2.toggleText) === normalizeText(initial.toggleText),
      detail: {
        toggleText: stopped2.toggleText,
        status: stopped2.statusText,
        indicatorShown: stopped2.indicatorShown
      }
    })

    const passed = checks.every((c) => c.pass)
    const report = {
      passed,
      launchMode,
      url: page.url(),
      checks
    }

    console.log(JSON.stringify(report, null, 2))
    process.exitCode = passed ? 0 : 1
  } finally {
    if (context) await context.close().catch(() => {})
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
}

run().catch((error) => {
  console.error('xac-e2e-regression: FAIL')
  console.error(error && error.stack ? error.stack : String(error))
  process.exit(1)
})
