import { garmentEquipmentSlot } from '../garment-slots.js'
const ROOT = '/assets/characters-v3/modular-v4/source'
const painting = (key, options) => Object.freeze({ family: key, src: `${ROOT}/catalogue-${key}-v1.png`,
  transform: '', thumbnailBox: '100 100 825 1360', referenceLuminance: .81, cleanAlpha: true, ...options })

// Anchor rows register the neck, waist and hem independently. One painting
// remains one garment; the identity/body recipe never receives per-item offsets.
export const CATALOGUE_PAINTINGS = Object.freeze({
  'top-halter': painting('top-halter', { transform:'translate(174.08 229.8) scale(.66 .44)', thumbnailBox:'215 185 595 975', visibleContour:'M0 0H421V258Q512 275 602 258V0H1024V1536H0Z' }),
  'top-shell': painting('top-shell', { transform:'translate(133.12 128.4) scale(.74 .56)', thumbnailBox:'225 340 575 790', visibleContour:'M0 0H380V361Q389 457 512 468Q635 457 642 361V0H1024V1536H0Z' }),
  'outer-double-blazer': painting('outer-double-blazer', { fit:[[0,180,.64],[300,315,.64],[430,365,.64],[880,690,.64],[1100,780,.56],[1189,835,.6],[1536,1010,.6]], thumbnailBox:'5 280 1015 930', coversArms:true, tucksWaist:true }),
  'outer-peacoat': painting('outer-peacoat', { fit:[[0,190,.64,190],[224,315,.64,315],[360,365,.64,365],[900,690,.64,690],[1160,855,.56,780],[1220,895,.6,810],[1536,1040,.6,958]], thumbnailBox:'5 205 1015 1040', coversArms:true, tucksWaist:true }),
  'bottom-paperbag': painting('bottom-paperbag', { fit:[[0,520,.98],[285,680,.98],[460,790,.8],[1000,1135,.71],[1353,1320,.68],[1536,1420,.68]], thumbnailBox:'250 265 545 1110', coversLegs:true }),
  'bottom-jogger': painting('bottom-jogger', { fit:[[0,580,.9],[184,690,.9],[380,790,.86],[950,1130,.8],[1307,1320,.77],[1536,1430,.77]], thumbnailBox:'220 165 585 1165', coversLegs:true }),
  'bottom-sailor': painting('bottom-sailor', { fit:[[0,600,.92],[146,690,.92],[420,875,.85],[980,1120,.73],[1416,1330,.68],[1536,1410,.68]], thumbnailBox:'190 125 660 1310', coversLegs:true }),
  'apron-leather': painting('apron-leather', { fit:[[0,200,.68],[195,335,.68],[350,435,.68],[670,690,.68],[1376,1070,.68],[1536,1170,.68]], thumbnailBox:'205 170 615 1230' }),
  'shoes-mule': painting('shoes-mule', { src:`${ROOT}/catalogue-shoes-mule-v2.png`, thumbnailBox:'100 1090 825 275', parts:[
    {key:'left',clip:[0,1000,512,536],transform:'translate(200 873.6) scale(.48 .4)',clearOpening:true,skinOpening:'M390 1060L435 1120Q412 1150 347 1220Q282 1249 220 1225L307 1155Z',textureBox:[210,1050,235,205],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(328 873.6) scale(.48 .4)',clearOpening:true,skinOpening:'M634 1060L589 1120Q612 1150 677 1220Q742 1249 804 1225L717 1155Z',textureBox:[579,1050,235,205],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-slingback': painting('shoes-slingback', { thumbnailBox:'85 970 855 445', parts:[
    {key:'left',clip:[0,900,512,636],transform:'translate(200 950.3) scale(.48 .33)',wornCutout:'M395 998Q404 990 416 997L418 1009Q409 1002 401 1011Z',skinOpening:'M409 1000Q355 998 269 1150L194 1235Q201 1270 305 1255Q384 1240 413 1070Z',textureBox:[180,985,255,295],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,900,512,636],transform:'translate(333 950.3) scale(.48 .33)',wornCutout:'M629 998Q620 990 608 997L606 1009Q615 1002 623 1011Z',skinOpening:'M615 1000Q669 998 755 1150L830 1235Q823 1270 719 1255Q640 1240 611 1070Z',textureBox:[589,985,255,295],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-t-strap': painting('shoes-t-strap', { thumbnailBox:'90 920 845 460', parts:[
    {key:'left',clip:[0,850,512,686],transform:'translate(222.64 970.33) scale(.48 .324)',wornCutout:'M292 930Q346 930 403 936L403 971Q353 965 293 977Z',skinOpening:'M293 960Q345 948 408 965L419 1065Q397 1163 353 1220Q292 1250 201 1220L252 1115Z',textureBox:[185,945,245,295],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,850,512,686],transform:'translate(308.4 970.33) scale(.48 .324)',wornCutout:'M732 930Q678 930 621 936L621 971Q671 965 731 977Z',skinOpening:'M731 960Q679 948 616 965L605 1065Q627 1163 671 1220Q732 1250 823 1220L772 1115Z',textureBox:[594,945,245,295],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-monk': painting('shoes-monk', { thumbnailBox:'65 1015 890 435', parts:[
    {key:'left',clip:[0,950,512,586],transform:'translate(223.6 953.7) scale(.48 .32)',skinOpening:'M397 1040Q332 1023 265 1100Q318 1105 366 1129Q398 1110 397 1040Z',textureBox:[250,1025,170,125],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,950,512,586],transform:'translate(308.9 953.7) scale(.48 .32)',skinOpening:'M627 1040Q692 1023 759 1100Q706 1105 658 1129Q626 1110 627 1040Z',textureBox:[604,1025,170,125],sampleBox:[608,1180,35,70]}
  ] }),
  'dress-shift': painting('dress-shift', { onePiece: true, fit: [[0,0,.7],[265,320,.7],[700,690,1],[1370,1040,.74],[1536,1160,.74]] }),
  'dress-wrap': painting('dress-wrap', { onePiece: true, fit: [[0,0,.7],[135,320,.7],[550,690,.78],[1395,1150,.66],[1536,1230,.66]] }),
  'dress-gown': painting('dress-gown', { onePiece: true, fit: [[0,0,1],[160,340,1.04],[430,690,1.15],[1440,1390,.9],[1536,1460,.9]] }),
  'suit-jumpsuit': painting('suit-jumpsuit', { onePiece: true, fit: [[0,0,.8],[135,320,.74],[550,690,1],[1405,1325,.92],[1536,1422,.92]] }),
  'top-camisole': painting('top-camisole', { transform: 'translate(168.96 175) scale(.67 .54)', thumbnailBox: '240 270 545 840' }),
  'top-peasant': painting('top-peasant', { transform: 'translate(179.2 124) scale(.65 .6)', thumbnailBox: '30 340 965 740' }),
  'top-turtleneck': painting('top-turtleneck', { transform: 'translate(194.56 138.18) scale(.62 .58)', thumbnailBox: '40 260 950 855', coversArms: true }),
  'top-henley': painting('top-henley', { transform: 'translate(204.8 145.2) scale(.6 .56)', thumbnailBox: '25 320 975 840', coversArms: true }),
  'outer-hoodie': painting('outer-hoodie', { fit: [[0,160,.6],[300,310,.6],[450,365,.6],[850,590,.6],[1130,760,.6],[1200,790,.6],[1536,972,.6]], thumbnailBox: '0 280 1024 930', coversArms: true }),
  'outer-bomber': painting('outer-bomber', { fit: [[0,150,.62],[320,315,.62],[440,355,.62],[850,600,.62],[1100,760,.62],[1150,790,.62],[1536,1002,.62]], thumbnailBox: '0 300 1024 880', coversArms: true }),
  'outer-trench': painting('outer-trench', { fit: [[0,250,.64],[120,315,.64],[260,365,.64],[600,650,.64],[880,790,.64],[1430,1160,.64],[1536,1225,.64]], thumbnailBox: '20 100 990 1350', coversArms: true }),
  'outer-coat': painting('outer-coat', { fit: [[0,250,.64],[120,315,.64],[260,365,.64],[600,650,.64],[930,790,.64],[1430,1170,.64],[1536,1235,.64]], thumbnailBox: '40 100 950 1350', coversArms: true }),
  'bottom-denim': painting('bottom-denim', { transform: 'translate(153.6 561) scale(.7 .57)', thumbnailBox: '230 205 585 1150', referenceLuminance: .52 }),
  'bottom-tailored': painting('bottom-tailored', { transform: 'translate(71.68 529.4) scale(.86 .62)', thumbnailBox: '250 240 530 1060' }),
  'bottom-wrap': painting('bottom-wrap', { transform: 'translate(122.88 510.5) scale(.76 .51)', thumbnailBox: '170 330 700 970' }),
  'bottom-tiered': painting('bottom-tiered', { transform: 'translate(153.6 520) scale(.7 .52)', thumbnailBox: '90 305 860 965' }),
  'bottom-circle': painting('bottom-circle', { transform: 'translate(153.6 462) scale(.7 .52)', thumbnailBox: '35 415 960 815' }),
  'bottom-maxi': painting('bottom-maxi', { transform: 'translate(163.84 532) scale(.68 .6)', thumbnailBox: '70 240 890 1180' }),
  'shoes-oxford': painting('shoes-oxford', { thumbnailBox: '175 1190 680 270', parts: [
    {key:'left',clip:[0,1000,512,536],transform:'translate(192 692) scale(.55 .5)'},
    {key:'right',clip:[512,1000,512,536],transform:'translate(265 692) scale(.55 .5)'}
  ] }),
  'shoes-mary-jane': painting('shoes-mary-jane', { thumbnailBox: '110 1120 800 340', parts: [
    {key:'left',clip:[0,1000,512,536],transform:'translate(227 792) scale(.5 .43)',skinOpening:'M384 1147Q343 1160 270 1228L195 1305Q267 1350 351 1317Q390 1267 417 1217Z',textureBox:[185,1135,245,230],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(295 792) scale(.5 .43)',skinOpening:'M633 1147Q674 1160 747 1228L822 1305Q750 1350 666 1317Q627 1267 600 1217Z',textureBox:[587,1135,245,230],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-pump': painting('shoes-pump', { thumbnailBox: '165 1060 715 355', parts: [
    {key:'left',clip:[0,1000,512,536],transform:'translate(190 720) scale(.56 .5)',skinOpening:'M411 1080C380 1075 289 1190 250 1270Q237 1305 359 1298C410 1247 435 1114 411 1080Z',textureBox:[230,1065,240,270],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(253 720) scale(.56 .5)',skinOpening:'M632 1080C663 1075 754 1190 793 1270Q806 1305 684 1298C633 1247 608 1114 632 1080Z',textureBox:[573,1065,240,270],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-sandal': painting('shoes-sandal', { thumbnailBox: '135 1105 740 380', parts: [
    {key:'left',clip:[0,1000,512,536],transform:'translate(200 769) scale(.59 .44)',wornCutout:'M282 1124Q322 1118 359 1125L359 1158Q323 1158 290 1161Z',skinOpening:'M309 1138Q360 1130 383 1160L374 1280Q328 1340 247 1354L171 1403Q250 1430 327 1410L400 1290L388 1180Z',textureBox:[155,1125,255,315],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(218 769) scale(.59 .44)',wornCutout:'M721 1124Q682 1118 647 1125L647 1158Q683 1158 713 1161Z',skinOpening:'M715 1138Q664 1130 641 1160L650 1280Q696 1340 777 1354L853 1403Q774 1430 697 1410L624 1290L636 1180Z',textureBox:[614,1125,255,315],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-tall-boot': painting('shoes-tall-boot', { thumbnailBox: '215 765 610 660',
    // The painted calf bends inward below the knee; do not expose that old
    // silhouette beside a straight boot shaft. Preserve skin above its lip.
    bodyOcclusion:'M290 1066H470V1360H290ZM552 1066H722V1360H552Z', parts: [
    {key:'left',clip:[0,700,512,836],transform:'translate(124 550) scale(.72 .62)',wornCutout:'M330 782Q383 800 438 784L443 806Q390 825 326 801Z'},
    {key:'right',clip:[512,700,512,836],transform:'translate(172 550) scale(.72 .62)',wornCutout:'M694 782Q641 800 586 784L581 806Q634 825 698 801Z'}
  ] }),
  'shoes-clog': painting('shoes-clog', { thumbnailBox: '145 1175 735 250', parts: [
    {key:'left',clip:[0,1000,512,536],transform:'translate(209 779) scale(.55 .45)',skinOpening:'M326 1200Q398 1181 441 1218L412 1297L302 1263Z',textureBox:[285,1175,175,150],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(270 779) scale(.55 .45)',skinOpening:'M698 1200Q626 1181 583 1218L612 1297L722 1263Z',textureBox:[564,1175,175,150],sampleBox:[608,1180,35,70]}
  ] }),
  'top-corset': painting('top-corset', { transform:'translate(179.2 216) scale(.65 .453)', thumbnailBox:'185 280 655 945' }),
  'outer-capelet': painting('outer-capelet', { transform:'translate(184.32 143) scale(.64 .55)', thumbnailBox:'0 330 1024 610', coversArms:false, innerSleeveClip:'cape' }),
  'apron-smock': painting('apron-smock', { transform:'translate(163.84 231) scale(.68 .6)', thumbnailBox:'190 155 645 1175' }),
  'bottom-petal': painting('bottom-petal', { transform:'translate(133.12 544.65) scale(.74 .51)', thumbnailBox:'75 265 875 995' }),
  'hat-beret': painting('hat-beret', { transform:'translate(126.5 -25.5) scale(.75 .49)', thumbnailBox:'240 50 550 340', coversCrown:true }),
  'hat-brim': painting('hat-brim', { transform:'translate(215.04 -90) scale(.58 .26)', thumbnailBox:'15 345 1000 540', coversCrown:true }),
  'hat-cloche': painting('hat-cloche', { transform:'translate(245.76 -122) scale(.52 .3)', thumbnailBox:'115 330 795 585', coversCrown:true }),
  'hat-cap': painting('hat-cap', { transform:'translate(256 -115) scale(.5 .3)', thumbnailBox:'90 375 845 540', coversCrown:true }),
  headband: painting('headband', { transform:'translate(266.24 -78) scale(.48 .32)', thumbnailBox:'125 255 780 620',
    hairTransforms:{buzz:'translate(307.2 -64) scale(.4 .27)'} }),
  turban: painting('turban', { transform:'translate(199.68 -89) scale(.61 .34)', thumbnailBox:'155 260 715 550', coversCrown:true,
    hairVisibility:'M-120 84H62Q80 60 120 46Q160 60 178 84H360V360H-120Z',
    // The wrap covers this higher tuck line. Retain the painting's own rounded
    // curl outline at the temples instead of carving new diagonal side edges.
    hairVisibilityByStyle:{afro:'M-120 52H360V360H-120Z'} }),
  'bag-tote': painting('bag-tote', { transform:'translate(629 710.5) scale(.25)', thumbnailBox:'120 175 790 1180' }),
  'bag-satchel': painting('bag-satchel', { thumbnailBox:'75 65 875 1365', parts:[
    {key:'strap',clip:[110,340,330,485],transform:'translate(629 107) scale(.22 .77)'},
    {key:'pouch',clip:[0,810,1024,726],transform:'translate(615 318) scale(.3 .44)'}
  ] }),
  'bag-clutch': painting('bag-clutch', { transform:'translate(640 692) scale(.23)', thumbnailBox:'40 475 945 555' }),
  tie: painting('tie', { transform:'translate(307.2 274.5) scale(.4 .25)', thumbnailBox:'330 200 365 1185', layer:'neck', visibleContour:'M0 330H422L450 355Q512 394 574 355L602 330H1024V1536H0Z' }),
  bow: painting('bow', { transform:'translate(409.6 275) scale(.2 .14)', thumbnailBox:'105 505 815 505', layer:'neck' }),
  collar: painting('collar', { transform:'translate(358.4 274) scale(.3 .13)', thumbnailBox:'185 380 655 525', layer:'neck' }),
  brooch: painting('brooch', { transform:'translate(587 388) scale(.11)', thumbnailBox:'225 455 655 555' }),
  fascinator: painting('fascinator', { transform:'translate(522 -6) scale(.19 .18)', thumbnailBox:'160 70 775 840' }),
  gloves: painting('gloves', { thumbnailBox:'145 460 735 555', coversHands:true, parts:[
    {key:'left',clip:[0,400,512,700],transform:'translate(157 365) scale(.45 .49)'},
    {key:'right',clip:[512,400,512,700],transform:'translate(404 365) scale(.45 .49)'}
  ] }),
  'dress-shirt': painting('dress-shirt', { onePiece:true, fit:[[0,0,.72],[156,320,.72],[600,690,1.14],[1410,1160,.66],[1536,1230,.66]] }),
  'top-tunic': painting('top-tunic', { transform:'translate(179.2 162.75) scale(.65 .565)', thumbnailBox:'30 285 965 1000', longTop:true }),
  belt: painting('belt', { transform:'translate(240.64 436.5) scale(.53 .39)', thumbnailBox:'150 670 720 205' }),
  'outer-tailcoat': painting('outer-tailcoat', { fit:[[0,240,.62],[150,315,.62],[280,365,.62],[880,690,.62],[1030,790,.62],[1365,1110,.62],[1536,1220,.62]], thumbnailBox:'0 130 1024 1250', coversArms:true, cropped:true }),
  'bottom-origami': painting('bottom-origami', { transform:'translate(143.36 606.42) scale(.72 .42)', thumbnailBox:'225 180 600 1200' }),
  'bag-handbag': painting('bag-handbag', { transform:'translate(640 664) scale(.23 .3)', thumbnailBox:'80 300 870 915' }),
  'shoes-espadrille': painting('shoes-espadrille', { thumbnailBox:'70 1060 890 375', parts:[
    {key:'left',clip:[0,1000,512,536],transform:'translate(252 883) scale(.42 .38)',skinOpening:'M391 1090Q331 1083 253 1165L225 1210Q290 1250 378 1230L418 1132Z',textureBox:[210,1070,230,190],sampleBox:[375,1180,35,70]},
    {key:'right',clip:[512,1000,512,536],transform:'translate(340 883) scale(.42 .38)',skinOpening:'M633 1090Q693 1083 771 1165L799 1210Q734 1250 646 1230L606 1132Z',textureBox:[584,1070,230,190],sampleBox:[608,1180,35,70]}
  ] }),
  'shoes-lace-boot': painting('shoes-lace-boot', { thumbnailBox:'45 900 935 485', parts:[
    {key:'left',clip:[0,850,512,686],transform:'translate(264 671.2) scale(.4 .55)'},
    {key:'right',clip:[512,850,512,686],transform:'translate(346 671.2) scale(.4 .55)'}
  ] }),
})

export function catalogueGarmentAsset(garment, registered) {
  const cut = String(garment.cut || '').toLowerCase()
  const slot = garmentEquipmentSlot(garment)
  const key = {
    'shift-dress': 'dress-shift', 'shirt-dress': 'dress-shirt', 'tea-dress': 'dress-wrap',
    'wrap-dress': 'dress-wrap', sundress: 'dress-gown', 'column-gown': 'dress-gown',
    'bias-gown': 'dress-gown', 'couture-gown': 'dress-gown', jumpsuit: 'suit-jumpsuit',
    camisole:'top-camisole', 'shell-top':'top-shell', halter:'top-halter',
    'peasant-blouse':'top-peasant', 'organza-blouse':'top-peasant',
    henley:'top-henley', turtleneck:'top-turtleneck', hoodie:'outer-hoodie',
    'bomber-jacket':'outer-bomber', 'trench-coat':'outer-trench', coat:'outer-coat',
    peacoat:'outer-peacoat', 'double-breasted-blazer':'outer-double-blazer', 'opera-coat':'outer-coat', 'architect-coat':'outer-coat', 'runway-coat':'outer-coat',
    pants: garment.pattern === 'denim' ? 'bottom-denim' : 'bottom-tailored', jeans:'bottom-denim','carpenter-jeans':'bottom-denim',
    'peg-trouser':'bottom-tailored','paperbag-trouser':'bottom-paperbag','sailor-trouser':'bottom-sailor','tuxedo-trouser':'bottom-tailored',
    jodhpurs:'bottom-tailored','cavalry-trouser':'bottom-tailored','bespoke-trouser':'bottom-tailored',joggers:'bottom-jogger',
    'wrap-skirt':'bottom-wrap','bias-skirt':'bottom-wrap','asym-skirt':'bottom-wrap',
    'tiered-skirt':'bottom-tiered','circle-skirt':'bottom-circle','maxi-skirt':'bottom-maxi',
    'godet-skirt':'bottom-maxi','mermaid-skirt':'bottom-maxi','bustle-skirt':'bottom-tiered',
    'mary-janes':'shoes-mary-jane','t-strap-heels':'shoes-t-strap',
    'monk-shoes':'shoes-monk','wingtip-shoes':'shoes-oxford','bespoke-oxfords':'shoes-oxford',
    'spectator-pumps':'shoes-pump','velvet-pumps':'shoes-pump','opera-pumps':'shoes-pump',slingbacks:'shoes-slingback','sculpted-heels':'shoes-pump','ribbon-heels':'shoes-pump',
    'platform-sandals':'shoes-sandal','silk-sandals':'shoes-sandal','knee-boots':'shoes-tall-boot','riding-boots':'shoes-tall-boot','embroidered-boots':'shoes-tall-boot',
    clogs:'shoes-clog',mules:'shoes-mule',espadrilles:'shoes-espadrille','lace-up-boots':'shoes-lace-boot',
    'corset-top':'top-corset',capelet:'outer-capelet','atelier-cape':'outer-capelet',
    'cobbler-apron':'apron-smock','studio-smock':'apron-smock','leather-apron':'apron-leather',
    'petal-skirt':'bottom-petal',
    beret:'hat-beret','veiled-beret':'hat-beret','bucket-hat':'hat-cloche',cloche:'hat-cloche','pillbox-hat':'hat-beret','newsboy-cap':'hat-cap',
    'wide-brim-hat':'hat-brim','picture-hat':'hat-brim',headband:'headband',turban:'turban',
    tote:'bag-tote',satchel:'bag-satchel',handbag:'bag-handbag',clutch:'bag-clutch','box-bag':'bag-clutch',
    necktie:'tie','bow-tie':'bow',collar:'collar',gloves:'gloves',brooch:'brooch','flower-brooch':'brooch',fascinator:'fascinator',
    belt:'belt',tunic:'top-tunic',tailcoat:'outer-tailcoat','origami-skirt':'bottom-origami',
  }[cut]
  const reused = { blouse:'button-shirt','bowling-shirt':'camp-shirt','western-shirt':'button-shirt',sweatshirt:'knit-pullover',
    'tuxedo-jacket':'soft-blazer','tapestry-jacket':'chore-jacket','bespoke-jacket':'soft-blazer',
    skirt:'pleated-midi',shorts:'tailored-shorts',culottes:'wide-trousers',
    'service-apron':'bib-apron',pinafore:'bib-apron','pinafore-dress':'crossback-apron','split-apron':'crossback-apron',
    'bistro-apron':'waist-apron','sommelier-apron':'waist-apron','leather-apron':'bib-apron','couture-apron':'crossback-apron','master-apron':'crossback-apron',
    boots:'ankle-boots' }[cut]
  const base = key ? CATALOGUE_PAINTINGS[key] : registered[reused]
  if (!base) return null
  const expectedSlot = base.onePiece || base.family.startsWith('top-') || ['button-shirt','camp-shirt','knit-pullover'].includes(base.family) ? 'top'
    : base.family.startsWith('outer-') || ['soft-blazer','chore-jacket'].includes(base.family) ? 'outerwear'
    : base.family.startsWith('bottom-') || ['pleated-midi','tailored-shorts','wide-trousers'].includes(base.family) ? 'bottom'
    : base.family.startsWith('apron-') || base.family.includes('apron') ? 'apron'
    : base.family.startsWith('shoes-') || base.family === 'ankle-boots' ? 'shoes' : 'accessory'
  if (slot !== expectedSlot && !(slot === 'apron' && cut === 'atelier-cape')) return null
  // Intentional family adaptations, not new bespoke paintings. The catalogue
  // retains its cut, textile, pattern and colours; length variants fit this rig.
  if (cut === 'sundress') return { ...base, fit: [[0,0,1],[160,340,1.04],[430,690,1.15],[1440,1100,.75],[1536,1150,.75]] }
  if (cut === 'culottes') return { ...base, transform:'translate(49.44 436) scale(.88 .395)' }
  return base
}
