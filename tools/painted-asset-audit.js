// Read-only PNG diagnostics. No image pixels are changed by this utility.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

export function auditPaintedPng(path) {
  const png = readFileSync(path)
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) throw new Error(`Expected non-interlaced RGBA8 PNG: ${path}`)
  const chunks = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * 4
  const pixels = Buffer.alloc(stride * height)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const offset = y * stride + x
      const left = x >= 4 ? pixels[offset - 4] : 0
      const up = y ? pixels[offset - stride] : 0
      const upperLeft = y && x >= 4 ? pixels[offset - stride - 4] : 0
      const prediction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : undefined
      if (prediction === undefined) throw new Error(`Unsupported PNG filter ${filter}`)
      pixels[offset] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255
    }
  }
  const bounds = Object.fromEntries([1, 32, 128, 240].map((alpha) => [alpha, { minX: width, minY: height, maxX: -1, maxY: -1, count: 0 }]))
  const thresholds = [1, 32, 128, 240]
  const boxes = thresholds.map((threshold) => bounds[threshold])
  const rows = {}
  for (let y = 0; y < height; y++) {
    let min = width, max = -1
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      for (let index = 0; index < thresholds.length; index++) if (alpha >= thresholds[index]) {
        const box = boxes[index]
        box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x)
        box.minY = Math.min(box.minY, y); box.maxY = Math.max(box.maxY, y); box.count++
      }
      if (alpha >= 240) { min = Math.min(min, x); max = Math.max(max, x) }
    }
    if (y % 50 === 0 && max >= min) rows[y] = [min, max]
  }
  const boundsIn = (minX, maxX, threshold = 32) => {
    const box = { minX: width, minY: height, maxX: -1, maxY: -1 }
    for (let y = 0; y < height; y++) for (let x = minX; x < maxX; x++) if (pixels[(y * width + x) * 4 + 3] >= threshold) {
      box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x)
      box.minY = Math.min(box.minY, y); box.maxY = Math.max(box.maxY, y)
    }
    return box
  }
  return { width, height, bounds, rows, boundsIn, alphaAt: (x, y) => pixels[(y * width + x) * 4 + 3] }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const path of process.argv.slice(2)) console.log(JSON.stringify({ path, ...auditPaintedPng(path) }))
}
