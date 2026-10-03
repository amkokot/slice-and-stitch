// Keep the previous dressed preview visible while a newly chosen PNG loads.
// In particular, never flash the unclothed base between wardrobe selections.
const pendingAssets = new Map()
export async function preloadPaintedPreview(markup) {
  const template = document.createElement('template')
  template.innerHTML = markup
  const urls = new Set([...template.content.querySelectorAll('img[src], image[href]')].map((image) => image.getAttribute('src') || image.getAttribute('href')).filter((url) => url?.includes('/assets/')))
  await Promise.all([...urls].map((url) => {
    if (!pendingAssets.has(url)) pendingAssets.set(url, new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = resolve
      image.onerror = () => { pendingAssets.delete(url); reject(new Error(`Cannot load painted preview: ${url}`)) }
      image.src = url
    }))
    return pendingAssets.get(url)
  }))
}
