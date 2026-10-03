import { garmentEquipmentSlot } from '../garment-slots.js'

const ROOT = '/assets/characters-v3/modular-v4/source'
const painting = (key, options) => Object.freeze({ family: `major-${key}`,
  src: `${ROOT}/catalogue-major-${key}-v1.png`, transform: '',
  referenceLuminance: .81, cleanAlpha: true, ...options })

export const MAJOR_PAINTINGS = Object.freeze({
  'shirt-dress': painting('shirt-dress', {
    onePiece:true, fit:[[0,180,.82],[214,315,.82],[320,365,.91],[505,505,.8],[690,690,1.1],[1000,910,.84],[1339,1100,.8],[1536,1230,.8]],
    thumbnailBox:'155 190 720 1175',
    neutralTrim:'M517 516m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM517 578m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM517 762m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM517 872m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM517 994m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM517 1130m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0Z',
  }),
  sundress: painting('sundress', {
    onePiece:true, fit:[[0,230,1.1],[171,335,1.1],[310,425,1.12],[550,690,1.25],[850,900,.95],[1366,1170,.76],[1536,1280,.76]],
    thumbnailBox:'90 150 840 1240',
  }),
  sweatshirt: painting('sweatshirt', {
    fit:[[0,140,.7,140],[334,345,.7,345],[450,390,.7,390],[850,630,.72,650,.62],[1085,790,.74,805,.56],[1536,1030,.74,1000,.56]],
    thumbnailBox:'15 310 995 830', coversArms:true,
    visibleContour:'M0 0H399V364Q512 375 635 364V0H1024V1536H0Z',
  }),
  culottes: painting('culottes', {
    fit:[[0,535,.97],[304,690,.97],[600,835,.88],[710,885,.82],[1000,1030,.77],[1258,1150,.74],[1536,1290,.74]],
    thumbnailBox:'115 285 795 995',
    neutralTrim:'M529 354m-16 0a16 16 0 1 0 32 0a16 16 0 1 0-32 0Z',
  }),
  'bucket-hat': painting('bucket-hat', {
    transform:'translate(261.12 -56) scale(.49 .29)', thumbnailBox:'100 180 825 510', coversCrown:true,
  }),
  'western-shirt': painting('western-shirt', {
    fit:[[0,150,.64,150],[299,315,.64,315],[435,365,.64,365],[900,690,.68,690],[1120,800,.7,805,.53],[1183,845,.7,835,.53],[1536,1035,.7,1020,.53]],
    thumbnailBox:'5 280 1015 930', coversArms:true,
    neutralTrim:'M362 631m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM674 632m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM521 630m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM521 733m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM521 839m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM521 945m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM521 1048m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z',
  }),
  'puffer-jacket': painting('puffer-jacket', {
    fit:[[0,150,.64,150],[292,305,.64,305],[440,365,.64,365],[840,675,.7,675,.59],[1080,795,.7,805,.54],[1536,1050,.7,1075,.54]],
    thumbnailBox:'5 270 1015 875', coversArms:true, cropped:true,
    visibleContour:'M0 0H452V365H575V0H1024V1536H0Z',
    neutralTrim:'M442 370H458L449 1088H427ZM568 370H581L608 1088H590Z',
  }),
  leggings: painting('leggings', {
    fit:[[0,555,1.02],[240,690,1.02],[365,755,.95],[600,875,.82],[990,1090,.7],[1288,1320,.72],[1536,1460,.72]],
    thumbnailBox:'250 220 525 1090', coversLegs:true,
  }),
})

const slots = { 'shirt-dress':'top', sundress:'top', sweatshirt:'top', culottes:'bottom',
  'bucket-hat':'accessory', 'western-shirt':'top', 'puffer-jacket':'outerwear', leggings:'bottom' }
export function majorGarmentAsset(garment = {}) {
  return slots[garment.cut] === garmentEquipmentSlot(garment) ? MAJOR_PAINTINGS[garment.cut] || null : null
}
