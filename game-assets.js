// Manifests retain stable repository paths. Browser renderers resolve them
// against this module, not the domain root or a nested fitting-room page.
export function assetUrl(path,base) {
  if(!path) return ''
  if(!base && typeof document==='undefined') return path
  return new URL(String(path).replace(/^\//,''),base || new URL('./',import.meta.url)).href
}
