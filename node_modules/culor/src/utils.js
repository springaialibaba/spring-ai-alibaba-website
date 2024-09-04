const isStr = a => Object.prototype.toString.call(a) === '[object String]'
const isNum = a => !isNaN(parseFloat(a)) && isFinite(a)

const parse = ({sys = 10, max = 255, fn = parseInt}) => str => {
  const rtn = fn(str, sys)
  if (rtn < 0 || rtn > max) throw new Error(str + ' is not between ' + 0 + ' and ' + max)
  return rtn
}

/**
 * number to HexString
 * @param {Number} hex
 * 0x444 -> '#000444'
 * 1092  -> '#000444'
 */
const num2str = hex => {
  if (hex <= 0xfff) console.warn('three-digit form hex color may cause problem (0xfff === 0x000fff)')
  let rtn = hex.toString(16)
  while (rtn.length < 6) rtn = '0' + rtn
  return '#' + rtn
}

/**
 * angleString to turn
 * 'When written as a unitless <number>, it is interpreted as degrees'
 * https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla()
 * @param {String} str angle string
 * '360'       -> 1
 * '720deg'    -> 1
 * '3.1416rad' -> 0.4984096197865795
 * '800grad'   -> 1
 * '1turn'     -> 1
 */
const agl2trn = str => {
  const mt = /^(-?\d+(?:\.\d+)?|\.\d+)(.*?)$/.exec(str)
  const deObj = {
    deg: 360,
    rad: 2 * Math.PI,
    grad: 400,
    turn: 1,
    '': 360
  }
  if (!mt) throw new Error(str + ' is not an angle')
  return (parseFloat(mt[1]) / deObj[mt[2].toLowerCase()]) % 1
}

/**
 * percentString to decimalNumber
 * @param {String} str
 * '123.4%' -> 1.234
 * '200%' -> 2
 * '200' -> false
 */
const per2bin = str => {
  if (!isStr(str)) throw new Error(str + ' is not a string')
  const mt = /^(\d+(?:\.\d+)?|\.\d+)%$/.exec(str)
  if (!mt) return false
  return mt[1] / 100
}

/**
 * http://www.easyrgb.com/en/math.php
 * @param {Number} H [0, 1)
 * @param {Number} S [0, 1)
 * @param {Number} L [0, 1)
 * @param {Number} A [0, 1)
 */
const HSL2RGB = (H, S, L) => {
  const Hue2RGB = (v1, v2, vH) => {
    if (vH < 0) vH += 1
    if (vH > 1) vH -= 1
    if (6 * vH < 1) return v1 + (v2 - v1) * 6 * vH
    if (2 * vH < 1) return v2
    if (3 * vH < 2) return v1 + (v2 - v1) * (2 / 3 - vH) * 6
    return v1
  }
  let R, G, B, t1
  if (S == 0) {
    R = L * 255
    G = L * 255
    B = L * 255
  } else {
    if (L < 0.5) t1 = L * (1 + S)
    else t1 = L + S - S * L
    const t0 = 2 * L - t1
    R = 255 * Hue2RGB(t0, t1, H + 1 / 3)
    G = 255 * Hue2RGB(t0, t1, H)
    B = 255 * Hue2RGB(t0, t1, H - 1 / 3)
  }
  return [R, G, B]
}

const RGB2HSL = (R, G, B) => {
  let H, S, L
  const [r, g, b] = [R / 255, G / 255, B / 255]
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  const del = max - min

  L = (max + min) / 2

  if (del === 0) return [0, 0, L]
  else {
    S = del / (L < .5 ? (max + min) : (2 - max - min))

    if (r === max) H = (g - b) / del
    else if (g === max) H = 2 + (b - r) / del
    else if (b === max) H = 4 + (r - g) / del
    H = Math.min(H / 6, 1)

    if (H < 0) H += 1
    return [H, S, L]
  }
}

export { isStr, isNum, parse, agl2trn, HSL2RGB, RGB2HSL, num2str, per2bin }
