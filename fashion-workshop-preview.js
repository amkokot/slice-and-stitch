import { registeredGarmentAsset, renderRegisteredGarment } from './character-v3/registered-garments.js'
import { fashionGarmentDraft, constructionRecipe, effectiveSchematic } from './fashion-construction.js'
import { garmentSlotLabel } from './ui-copy.js'
const escape = value => String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')

export function fashionProductPainting(garment,id='atelier-product') {
  const asset=registeredGarmentAsset(garment)
  return asset?renderRegisteredGarment(asset,{id,...garment.palette,pattern:garment.pattern,outline:garment.outline,colorPattern:garment.colorPattern,customization:garment.customization,thumbnail:true}):''
}

export function fashionProductPreview(fashion, id='atelier-product') {
  const garment=fashionGarmentDraft(fashion)
  const recipe=constructionRecipe(effectiveSchematic(fashion),fashion.fabric)
  const svg=fashionProductPainting(garment,id)
  return `<div class="fashion-product-proof" data-construction-family="${recipe.family}"><div class="fashion-product-art" role="img" aria-label="${escape(garment.name)} finished garment preview">${svg}</div><div><small>FINISHED LOOK</small><b>${escape(recipe.label)}</b><span>${garmentSlotLabel(garment.slot)} · ${fashion.fabric?escape(fashion.fabric.fiber):'Choose a suitable material'}</span><ol>${recipe.seams.map((seam,index)=>`<li${fashion.step==='sew'&&index===(fashion.seamIndex||0)?' aria-current="step"':''}>${escape(seam.label)}${index<(fashion.seamScores||[]).length?' ✓':''}</li>`).join('')}</ol></div></div>`
}
