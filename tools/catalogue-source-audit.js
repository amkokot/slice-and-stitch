import { readdirSync } from 'node:fs'
import { auditPaintedPng } from './painted-asset-audit.js'
const root = new URL('../assets/characters-v3/modular-v4/source/', import.meta.url)
const selected = process.argv.slice(2)
for (const filename of readdirSync(root).filter((name) => name.startsWith('catalogue-') && name.endsWith('.png') && (!selected.length || selected.some((key) => name.includes(key))))) {
  const audit = auditPaintedPng(new URL(filename, root))
  console.log(JSON.stringify({ filename, bounds: audit.bounds[32], left: audit.boundsIn(0, 512), right: audit.boundsIn(512, 1024) }))
}
