// ABOUTME: WCAG 2.1 contrast gate for the design tokens in app/assets/css/main.css.
// ABOUTME: Parses light (@theme) and dark (.dark) custom properties and asserts the AA pairs; exit 1 on failure.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../app/assets/css/main.css', import.meta.url), 'utf8')

function parseBlock(startMarker) {
  const start = css.indexOf(startMarker)
  const open = css.indexOf('{', start)
  let depth = 1
  let i = open + 1
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  const body = css.slice(open + 1, i - 1)
  const tokens = {}
  for (const m of body.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[m[1]] = m[2]
  }
  return tokens
}

function luminance(hex) {
  const chan = (v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255)
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// [foreground, background] pairs that must meet AA for text (4.5:1).
const TEXT_PAIRS = [
  ['ink', 'bg'], ['ink', 'surface'], ['ink', 'surface-2'], ['ink', 'row-you'],
  ['ink-soft', 'bg'], ['ink-soft', 'surface'], ['ink-soft', 'surface-2'],
  ['ink-muted', 'bg'], ['ink-muted', 'surface'],
  ['accent-fg', 'accent'],
  ['accent-ink', 'bg'], ['accent-ink', 'surface'], ['accent-ink', 'accent-bg'],
  ['ok', 'bg'], ['ok', 'surface'],
  ['danger', 'bg'], ['danger', 'surface'], ['danger', 'danger-bg'],
]

// Focus-ring pairs that must meet AA for non-text (3:1).
const RING_PAIRS = [
  ['accent-ink', 'bg'], ['accent-ink', 'surface'], ['accent-ink', 'surface-2'],
]

// '.dark {' (not '.dark') so the @custom-variant line near the top can't match first.
const themes = { light: parseBlock('@theme'), dark: parseBlock('.dark {') }
let failures = 0

for (const [themeName, tokens] of Object.entries(themes)) {
  console.log(`\n${themeName}`)
  const check = (fg, bg, min, kind) => {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`  MISSING ${fg} or ${bg}`)
      failures++
      return
    }
    const ratio = contrast(tokens[fg], tokens[bg])
    const ok = ratio >= min
    if (!ok) failures++
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${kind} ${fg} on ${bg}: ${ratio.toFixed(2)}:1 (min ${min})`)
  }
  for (const [fg, bg] of TEXT_PAIRS) check(fg, bg, 4.5, 'text')
  for (const [fg, bg] of RING_PAIRS) check(fg, bg, 3.0, 'ring')
}

if (failures > 0) {
  console.error(`\n${failures} contrast failure(s)`)
  process.exit(1)
}
console.log('\nAll contrast pairs pass')
