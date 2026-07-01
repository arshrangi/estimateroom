// ABOUTME: Enforces the client JS performance budget (NFR4). Fails if total gzipped client JS exceeds the limit.
// ABOUTME: Runs in CI after `nuxt build` so every PR is measured against the budget from the start.
import { readdir, readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const DIR = '.output/public/_nuxt'
const LIMIT = 200 * 1024 // ~200 KB gzip (NFR4)
const kb = (n) => `${(n / 1024).toFixed(1)} KB`

async function jsFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    console.error(`FAIL: ${dir} not found. Run \`nuxt build\` first.`)
    process.exit(1)
  }
  const files = []
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) files.push(...(await jsFiles(p)))
    else if (e.name.endsWith('.js')) files.push(p)
  }
  return files
}

const files = await jsFiles(DIR)
let total = 0
for (const f of files) total += gzipSync(await readFile(f)).length

console.log(`Client JS (gzipped): ${kb(total)} across ${files.length} files (limit ${kb(LIMIT)})`)
if (total > LIMIT) {
  console.error(`FAIL: exceeds the ~200 KB budget by ${kb(total - LIMIT)}`)
  process.exit(1)
}
console.log('PASS: within budget')
