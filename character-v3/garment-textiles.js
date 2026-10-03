// Small, seamless native-SVG textiles. They are clipped to the painting's
// alpha before fitting, so body previews and inventory thumbnails agree.
export function garmentTextileDefinition(id, design) {
  if (design.mode !== 'overlay' || design.key === 'solid') return ''
  const ink = /^#[0-9a-f]{6}$/i.test(String(design.secondary)) ? design.secondary : '#eee0c3'
  const motifs = {
    stripe: '<path d="M20 0V80M60 0V80" stroke-width="9"/>',
    pinstripe: '<path d="M20 0V80M60 0V80" stroke-width="1.8"/>',
    check: '<path d="M20 0V80M60 0V80M0 20H80M0 60H80" stroke-width="3"/><path d="M24 0V80M64 0V80M0 24H80M0 64H80" stroke-width="1" opacity=".55"/>',
    floral: '<g fill="currentColor" stroke="none"><g transform="translate(21 23)"><ellipse ry="9" rx="3.6" cy="-6"/><ellipse ry="9" rx="3.6" cy="-6" transform="rotate(60)"/><ellipse ry="9" rx="3.6" cy="-6" transform="rotate(120)"/><circle r="3"/></g><g transform="translate(62 62) scale(.72)"><ellipse ry="9" rx="3.6" cy="-6"/><ellipse ry="9" rx="3.6" cy="-6" transform="rotate(60)"/><ellipse ry="9" rx="3.6" cy="-6" transform="rotate(120)"/><circle r="3"/></g><path d="M28 40q14-13 11-21q-14 3-11 21ZM50 64q-12-12-14-4q6 11 14 4Z"/></g><path d="M25 32q-2 12 6 18M60 70q-5 8-10 8" stroke-width="1.5"/>',
    herringbone: '<path d="M0 0l20 20L0 40l20 20L0 80M20 0l20 20-20 20 20 20-20 20M40 0l20 20-20 20 20 20-20 20M60 0l20 20-20 20 20 20-20 20" stroke-width="2"/>',
    twill: '<path d="M-40 40L40-40M0 80L80 0M40 120L120 40" stroke-width="2"/>',
    denim: '<path d="M-40 40L40-40M0 80L80 0M40 120L120 40" stroke-width="2.5"/><path d="M0 0V80M20 0V80M40 0V80M60 0V80" stroke-width=".8" opacity=".45"/>',
    slub: '<path d="M5 12h23m10 0h35M2 28h11m18 1h43M9 49h45m9 1h14M0 69h30m16 0h30" stroke-width="1.4"/><path d="M15 6v11M58 33v9M31 63v11" stroke-width=".8"/>',
    weave: '<path d="M0 10H80M0 30H80M0 50H80M0 70H80M10 0V80M30 0V80M50 0V80M70 0V80" stroke-width="1"/>',
    cord: '<path d="M8 0V80M24 0V80M40 0V80M56 0V80M72 0V80" stroke-width="3"/><path d="M11 0V80M27 0V80M43 0V80M59 0V80M75 0V80" stroke-width=".8" opacity=".5"/>',
    cable: '<path d="M20-20q-20 20 0 40t0 40t0 40M20-20q20 20 0 40t0 40t0 40M60-20q-20 20 0 40t0 40t0 40M60-20q20 20 0 40t0 40t0 40" stroke-width="2"/><path d="M40 0V80M0 0V80" stroke-width="1"/>',
    jersey: '<path d="M0 10q5 10 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0M0 30q5 10 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0M0 50q5 10 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0M0 70q5 10 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0" stroke-width="1"/>',
    tweed: '<path d="M4 0v18m0 12v18m0 12v18M20 15v18m0 12v18M36 0v18m0 12v18m0 12v18M52 15v18m0 12v18M68 0v18m0 12v18m0 12v18M0 20h80M0 60h80" stroke-width="2"/>',
    velvet: '<path d="M8 6l2 3M29 22l2 4M57 9l1 3M17 57l2 4M64 64l1 3M45 44l2 3" stroke-width="1.5"/>',
    leather: '<path d="M9 12q5-4 9 0m21 9q4 3 9 0m17-9q2 4-1 7M19 48q5 3 9-1m15 18q4-3 8 0m17-18q2 4-1 7" stroke-width="1"/>',
    sheer: '<path d="M0 10H80M0 30H80M0 50H80M0 70H80M10 0V80M30 0V80M50 0V80M70 0V80" stroke-width=".7"/>',
    suede: '<path d="M9 11l2 1m14 10l2-1m27-13l1 2m17 10l-2 1M13 47l1 2m22 16l2-1m19-19l2 1m14 21l-2 1" stroke-width="2" stroke-linecap="round"/>',
    satin: '<path d="M-20 80L60 0M20 80L100 0" stroke-width="14" opacity=".32"/>',
    brocade: '<path d="M40 7q-16 18 0 32q16-14 0-32Zm0 33q-27-27-31-2q6 16 31 2Zm0 0q27-27 31-2q-6 16-31 2Zm0 1q-18 14-8 28q8 5 8-28Zm0 0q18 14 8 28q-8 5-8-28Z" stroke-width="1.7"/><path d="M40 2V78" stroke-width="1"/>',
    lace: '<path d="M0 0q20 35 40 0q20 35 40 0M0 40q20 35 40 0q20 35 40 0M0 80q20-35 40 0q20-35 40 0" stroke-width="2"/><circle cx="20" cy="28" r="9" stroke-width="1.5"/><circle cx="60" cy="68" r="9" stroke-width="1.5"/>',
    handmade: '<path d="M10 12l5 2m21 10l5-2m20-9l5 2M12 51l5-2m22 18l5 2m18-21l5-2" stroke-width="2"/>',
  }
  const marks = motifs[design.key]
  return marks ? `<pattern id="${id}-pattern" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(${design.scale})"><g color="${ink}" stroke="${ink}" fill="none">${marks}</g></pattern>` : ''
}

export function garmentContourFilter(design) {
  const { color, width, opacity } = design
  // An inward, feathered edge. It never grows alpha outside the cutout or
  // draws a hard stroke around a person's skin/face.
  return `<feMorphology in="cloth" operator="erode" radius="${width}" result="interior"/><feComposite in="cloth" in2="interior" operator="out" result="edge"/><feGaussianBlur in="edge" stdDeviation=".65" result="soft-edge"/><feComposite in="soft-edge" in2="cloth" operator="in" result="inner-edge"/><feFlood flood-color="${color}" flood-opacity="${opacity}"/><feComposite in2="inner-edge" operator="in" result="contour"/><feComposite in="contour" in2="cloth" operator="atop"/>`
}
