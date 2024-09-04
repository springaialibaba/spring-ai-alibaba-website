# Culor
> Just another color converter.

[![https://nodei.co/npm/culor.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/culor.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/culor)

## Installation

npm:

```sh
npm install culor
```

yarn:

```sh
yarn add culor
```

## Usage example

```js
import {color} from 'culor'

const color_name = color('red')
const color_hex = color('#ff5555')
const color_hex_short = color('#f55')
const color_rgb = color('rgb(255, 85, 85)')
const color_rgba = color('rgba(255, 85, 85, .7)')
const color_hsl = color('hsl(360deg, 100%, 67%)')
const color_hsla = color('hsla(400grad, 100%, 67%, .7)')
```

```js
import {RGB, RGBA, HSL, HSLA} from 'culor'

const rgb = RGB('255', 85, 85)
const rgba = RGBA(255, '85', 85, .7)
const hsl = HSL(360, '100%', .67)
const hsla = HSLA('360deg', 1, '67%', .7)
```

```js
const c = color('#00ff00ff')
c.Hex()      // '#00ff00'
c.HexA()     // '#00ff00ff'
c.RGB()      // 'rgb(0, 255, 0)'
c.RGBA()     // 'rgba(0, 255, 0, 1)'
c.HSL()      // 'hsl(120, 100%, 50%)'
c.HSLA()     // 'hsla(120, 100%, 50%, 1)'
c.keyword()  // 'lime'
```

## Syntax

`color(csscolor)`  
`RGB(R, G, B)`  
`RGBA(R, G, B, A)`  
`HSL(H, S, L)`  
`HSLA(H, S, L, A)`  

### Parameters

|    Key   |  Type  | Value |
|:--------|:------|:-----|
| `csscolor` | `String` | Color keywords, rgb(), rgba(), hsl(), hsla() or Hexadecimal notation in [css <color> data type](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value). |
| `R`        | `Number` `String` | red, [0, 255] |
| `G`        | `Number` `String` | green, [0, 255] |
| `B`        | `Number` `String` | blue, [0, 255] |
| `H`        | `String` | hue [angel](https://developer.mozilla.org/en-US/docs/Web/CSS/angle) |
| `S`        | `Number` `String` | saturation can be a number [0, 1], or a string between '0%' and '100%' |
| `L`        | `Number` `String` | lightness can be a number [0, 1], or a string between '0%' and '100%' |
| `A`        | `Number` `String` | alpha can be a number [0, 1], or a string between '0' and '1' |

### Functions

| Key | Type | Value |
|:--------|:------|:-----|
| `.Hex()` | `String` | #RRGGBB |
| `.HexA()` | `String` | #RRGGBBAA |
| `.RGB()` | `String` | rgb(r, g, b) |
| `.RGBA()` | `String` | rgba(r, g, b, a) |
| `.HSL()` | `String` | hsl(h, s, l) |
| `.HSLA()` | `String` | hsla(h, s, l, a) |
| `.keyword()` | `String` | color keyword or undefined |

## To-Do

- [ ] support rgb() / rgba() percentage unit.
- [x] .Hex(A) .RGB(A) .HSL(A)
- [x] HSLA2RGB -> HSL2RGB
- [x] .keyword

## Contributing

1. [Fork it](https://github.com/gaoryrt/culor/fork)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request