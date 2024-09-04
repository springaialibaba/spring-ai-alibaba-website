import colors from 'css-color-names'
import { isStr, isNum, parse, agl2trn, HSL2RGB, RGB2HSL, num2str, per2bin } from './utils'
const invalid = str => {throw new Error('invalid input: ' + str)}


const hex = parse({sys: 16})
const dec = parse({})
const bin = parse({max: 1, fn: parseFloat})
const any = s => isStr(s) ? per2bin(s) : bin(s)

function rgb(r, g, b) {
  return [dec(r), dec(g), dec(b), 1]
}

function rgba(r, g, b, a) {
  return [dec(r), dec(g), dec(b), bin(a) || 1]
}

function hsl(h, s, l) {
  return HSL2RGB(agl2trn(h), any(s), any(l)).concat(1)
}

function hsla(h, s, l, a) {
  return HSL2RGB(agl2trn(h), any(s), any(l)).concat(bin(a) || 1)
}

const str2RGBAArr = str => {
  const _mArr = [
    {
      reg: /^#([0-9a-f]{1})([0-9a-f]{1})([0-9a-f]{1})$/,
      fn: mt => {
        const A = mt[1]
        const B = mt[2]
        const C = mt[3]
        return [hex(A + A), hex(B + B), hex(C + C), 1]
      }
    },
    {
      reg: /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/,
      fn: mt => [hex(mt[1]), hex(mt[2]), hex(mt[3]), 1]
    },
    {
      reg: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
      fn: ([_, ...args]) => rgb(...args)
    },
    {
      reg: /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/,
      fn: mt => [hex(mt[1]), hex(mt[2]), hex(mt[3]), hex(mt[4]) / 255]
    },
    {
      reg: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d+(?:\.\d+)?|\.\d+)\)$/,
      fn: ([_, ...args]) => rgba(...args)
    },
    {
      reg: /^hsl\((.+?),\s*(.+?),\s*(.+?)\)$/,
      fn: m => HSL2RGB(agl2trn(m[1]), per2bin(m[2]), per2bin(m[3])).concat(1)
    },
    {
      reg: /^hsla\((.+?),\s*(.+?),\s*(.+?),\s*(\d+(?:\.\d+)?|\.\d+)\)$/,
      fn: m => HSL2RGB(agl2trn(m[1]), per2bin(m[2]), per2bin(m[3])).concat(bin(m[4]))
    }
  ]
  for (let o of _mArr) {
    let m = o.reg.exec(str)
    if (m) return o.fn(m)
  }
  const rtn = colors[str]
  if (rtn) {
    const o = _mArr[1]
    return o.fn(o.reg.exec(rtn))
  }
  invalid(str)
}

function color(str) {
  if (isStr(str)) return new Color(str2RGBAArr(str.toLowerCase()))
  else if (isNum(str)) {
    if (str > 0xffffff || str < 0) invalid(str)
    return new Color(str2RGBAArr(num2str(str)))
  } else invalid(str)
}

const RGB = (...args) => new Color(rgb(...args))
const RGBA = (...args) => new Color(rgba(...args))
const HSL = (...args) => new Color(hsl(...args))
const HSLA = (...args) => new Color(hsla(...args))

function Color(rgba) {
  this.r = rgba[0]
  this.g = rgba[1]
  this.b = rgba[2]
  this.a = rgba[3]
  const toHex = num => {
    let rtn = Math.round(num).toString(16)
    while (rtn.length < 2) rtn = '0' + rtn
    return rtn
  }
  const r = Math.round
  this.Hex = () => '#' + toHex(this.r) + toHex(this.g) + toHex(this.b)
  this.HexA = () => this.Hex() + toHex(this.a * 255)
  this.RGB = () => `rgb(${r(this.r)}, ${r(this.g)}, ${r(this.b)})`
  this.RGBA = () => `rgba(${r(this.r)}, ${r(this.g)}, ${r(this.b)}, ${this.a})`
  const [h, s, l] = RGB2HSL(this.r, this.g, this.b)
  this.HSL = () => `hsl(${r(h * 360)}, ${r(s * 100)}%, ${r(l * 100)}%)`
  this.HSLA = () => `hsla(${r(h * 360)}, ${r(s * 100)}%, ${r(l * 100)}%, ${this.a})`
  this.keyword = () => {
    const hex = this.Hex()
    for (let i in colors) {
      if (colors[i] === hex) return i
    }
    console.warn('no matched color')
  }
}

export {
  color,
  RGB,
  RGBA,
  HSL,
  HSLA
}
