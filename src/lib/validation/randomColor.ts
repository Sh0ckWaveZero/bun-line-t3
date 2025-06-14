import { getDeterministicRandom, getDeterministicAlpha } from '../utils/safe-random';

interface RandomColorOptions {
  seed?: number | string | null;
  count?: number | null;
  hue?: number | string;
  luminosity?: string;
  format?: string;
}

interface ColorInfo {
  hueRange: [number, number],
  lowerBounds: [number, number][],
  saturationRange: [number, number],
  brightnessRange: [number, number]
}

// Seed to get repeatable colors
let seed: any = null;

// Shared color dictionary
const colorDictionary: any = {};

// check if a range is taken
const colorRanges: any[] = [];

export default function randomColor(options: RandomColorOptions = {}): string | string[] {
  let seed: number | null;

  if (options.seed !== undefined && options.seed !== null && options.seed === parseInt(String(options.seed), 10)) {
    seed = options.seed as number;
  } else if (typeof options.seed === 'string') {
    seed = stringToInteger(options.seed);
  } else if (options.seed !== undefined && options.seed !== null) {
    throw new TypeError('The seed value must be an integer or string');
  } else {
    seed = null;
  }

  if (options.count !== null && options.count !== undefined) {
    const totalColors = options.count;
    const colors: string[] = [];

    for (let i = 0; i < options.count; i++) {
      colorRanges.push(false);
    }
    options.count = null;

    while (totalColors > colors.length) {
      const color = randomColor(options);

      if (seed !== null) {
        options.seed = seed;
      }

      colors.push(color as string);
    }

    options.count = totalColors;

    return colors;
  }

  const H = pickHue(options);
  const S = pickSaturation(H, options as any);
  const B = pickBrightness(H, S, options as any);

  return setFormat([H, S, B], options as any) as string;
}

const pickHue = (options: RandomColorOptions): number => {
  if (colorRanges.length > 0) {
    const hueRange: number[] = getRealHueRange(options.hue) as number[];
    let hue: number = randomWithin(hueRange as any);
    const step: number = ((hueRange[1] as number) - (hueRange[0] as number)) / colorRanges.length;
    let j: number = Math.floor((hue - (hueRange[0] as number)) / step);

    if (colorRanges[j] === true) {
      j = (j + 2) % colorRanges.length;
    } else {
      colorRanges[j] = true;
    }

    const min = ((hueRange[0] as number) + j * step) % 359;
    const max = ((hueRange[0] as number) + (j + 1) * step) % 359;

    hue = randomWithin([min, max]);

    if (hue < 0) {
      hue = 360 + hue;
    }
    return hue;
  } else {
    const hueRange: number[] = getHueRange(options.hue as string | number);
    let hue: number = randomWithin(hueRange as any);

    if (hue < 0) {
      hue = 360 + hue;
    }

    return hue;
  }
};

const pickSaturation = (hue: number, options: {
  hue?: string;
  luminosity?: 'bright' | 'dark' | 'light' | 'random';
}): number => {
  if (options.hue === 'monochrome') {
    return 0;
  }

  if (options.luminosity === 'random') {
    return randomWithin([0, 100]);
  }

  const saturationRange = getSaturationRange(hue);

  let sMin = saturationRange[0];
  let sMax = saturationRange[1];

  switch (options.luminosity) {
    case 'bright':
      sMin = 55;
      break;
    case 'dark':
      sMin = sMax - 10;
      break;
    case 'light':
      sMax = 55;
      break;
  }

  return randomWithin([sMin, sMax]);
}

const pickBrightness = (H: number, S: number, options: { luminosity: 'dark' | 'light' | 'random' }) => {
  let bMin = getMinimumBrightness(H, S);
  let bMax = 100;

  switch (options.luminosity) {
    case 'dark':
      bMax = bMin + 20;
      break;
    case 'light':
      bMin = (bMax + bMin) / 2;
      break;
    case 'random':
      bMin = 0;
      bMax = 100;
      break;
  }

  return randomWithin([bMin, bMax]);
};


const setFormat = (hsv: number[], options: { format: string, alpha?: number }) => {
  switch (options.format) {
    case 'hsvArray':
      return hsv;

    case 'hslArray':
      return HSVtoHSL(hsv);

    case 'hsl':
      const hsl = HSVtoHSL(hsv);
      return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;

    case 'hsla':
      const hslColor = HSVtoHSL(hsv);
      const alpha = options.alpha || getDeterministicAlpha();
      return `hsla(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2]}%, ${alpha})`;

    case 'rgbArray':
      return HSVtoRGB(hsv as any);

    case 'rgb':
      const rgb = HSVtoRGB(hsv as any);
      return `rgb(${rgb.join(', ')})`;

    case 'rgba':
      const rgbColor = HSVtoRGB(hsv as any);
      const alpha2 = options.alpha || getDeterministicAlpha();
      return `rgba(${rgbColor.join(', ')}, ${alpha2})`;

    default:
      return HSVtoHex(hsv);
  }
}

const getMinimumBrightness = (H: number, S: number): number => {
  const colorInfo = getColorInfo(H);
  if (typeof colorInfo === 'string') {
    return 0;
  }

  const lowerBounds = colorInfo.lowerBounds;

  for (let i = 0; i < lowerBounds.length - 1; i++) {
    const [s1, v1] = lowerBounds[i] as [number, number];
    const [s2, v2] = lowerBounds[i + 1] as [number, number];

    if (S >= s1 && S <= s2) {
      const m = (v2 - v1) / (s2 - s1);
      const b = v1 - m * s1;

      return m * S + b;
    }
  }

  return 0;
};



const getHueRange = (colorInput: string | number): [number, number] => {
  if (typeof parseInt(colorInput.toString()) === 'number') {
    const number = parseInt(colorInput.toString());
    if (number < 360 && number > 0) {
      return [number, number];
    }
  }

  if (typeof colorInput === 'string') {
    if (colorDictionary[colorInput]) {
      const color = colorDictionary[colorInput];
      if (color.hueRange) {
        return color.hueRange;
      }
    } else if (colorInput.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
      const hue = HexToHSB(colorInput)[0];
      return [hue, hue];
    }
  }
  return [0, 360];
}

const getSaturationRange = (hue: number): [number, number] => {
  const colorInfo = getColorInfo(hue);
  if (typeof colorInfo === 'string') {
    throw new Error('Color not found');
  }
  return colorInfo.saturationRange;
}

const getColorInfo = (hue: number): ColorInfo | string => {
  // Maps red colors to make picking hue easier
  if (hue >= 334 && hue <= 360) {
    hue -= 360;
  }

  for (const colorName in colorDictionary) {
    const color = colorDictionary[colorName];
    if (color.hueRange && hue >= color.hueRange[0] && hue <= color.hueRange[1]) {
      return color;
    }
  }
  return 'Color not found';
}

const randomWithin = (range: [number, number]): number => {
  if (seed === null) {
    //generate deterministic number to prevent hydration mismatch
    const golden_ratio = 0.618033988749895;
    let r = getDeterministicRandom(30); // 30-minute intervals for stability
    r += golden_ratio;
    r %= 1;
    return Math.floor(range[0] + r * (range[1] + 1 - range[0]));
  } else {
    //Seeded random algorithm from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
    const max = range[1] || 1;
    const min = range[0] || 0;
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280.0;
    return Math.floor(min + rnd * (max - min));
  }
}

const HSVtoHex = (hsv: number[]): string => {
  const rgb = HSVtoRGB(hsv as [number, number, number]);

  const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };

  const hex = '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);

  return hex;
};

const defineColor = (name: string, hueRange: number[] | null, lowerBounds: any): void => {
  const sMin = lowerBounds[0][0];
  const sMax = lowerBounds[lowerBounds.length - 1][0];
  const bMin = lowerBounds[lowerBounds.length - 1][1];
  const bMax = lowerBounds[0][1];

  colorDictionary[name] = {
    hueRange,
    lowerBounds,
    saturationRange: [sMin, sMax],
    brightnessRange: [bMin, bMax]
  };
};

const loadColorBounds = (): void => {
  defineColor(
    'monochrome',
    null,
    [[0, 0], [100, 0]]
  );

  defineColor(
    'red',
    [-26, 18],
    [[20, 100], [30, 92], [40, 89], [50, 85], [60, 78], [70, 70], [80, 60], [90, 55], [100, 50]]
  );

  defineColor(
    'orange',
    [18, 46],
    [[20, 100], [30, 93], [40, 88], [50, 86], [60, 85], [70, 70], [100, 70]]
  );

  defineColor(
    'yellow',
    [46, 62],
    [[25, 100], [40, 94], [50, 89], [60, 86], [70, 84], [80, 82], [90, 80], [100, 75]]
  );

  defineColor(
    'green',
    [62, 178],
    [[30, 100], [40, 90], [50, 85], [60, 81], [70, 74], [80, 64], [90, 50], [100, 40]]
  );

  defineColor(
    'blue',
    [178, 257],
    [[20, 100], [30, 86], [40, 80], [50, 74], [60, 60], [70, 52], [80, 44], [90, 39], [100, 35]]
  );

  defineColor(
    'purple',
    [257, 282],
    [[20, 100], [30, 87], [40, 79], [50, 70], [60, 65], [70, 59], [80, 52], [90, 45], [100, 42]]
  );

  defineColor(
    'pink',
    [282, 334],
    [[20, 100], [30, 90], [40, 86], [60, 84], [80, 80], [90, 75], [100, 73]]
  );
};

const HSVtoRGB = (hsv: [number, number, number]): [number, number, number] => {
  // this doesn't work for the values of 0 and 360
  // here's the hacky fix
  let h = hsv[0];
  if (h === 0) {
    h = 1;
  }
  if (h === 360) {
    h = 359;
  }

  // Rebase the h,s,v values
  h = h / 360;
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;

  const h_i = Math.floor(h * 6);
  const f = h * 6 - h_i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 256;
  let g = 256;
  let b = 256;

  switch (h_i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  const result = [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  return result as [number, number, number];
};

const HexToHSB = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  hex = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex;

  const red = parseInt(hex.substr(0, 2), 16) / 255;
  const green = parseInt(hex.substr(2, 2), 16) / 255;
  const blue = parseInt(hex.substr(4, 2), 16) / 255;

  const cMax = Math.max(red, green, blue);
  const delta = cMax - Math.min(red, green, blue);
  const saturation = cMax ? (delta / cMax) : 0;

  switch (cMax) {
    case red: return [60 * (((green - blue) / delta) % 6) || 0, saturation, cMax];
    case green: return [60 * (((blue - red) / delta) + 2) || 0, saturation, cMax];
    case blue: return [60 * (((red - green) / delta) + 4) || 0, saturation, cMax];
    default: return [0, 0, 0]; // Provide a default return value
  }
}


const HSVtoHSL = (hsv: any): number[] => {
  const h = hsv[0];
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const k = (2 - s) * v;

  return [
    h,
    Math.round((s * v) / (k < 1 ? k : 2 - k) * 10000) / 100,
    (k / 2) * 100,
  ];
};

const stringToInteger = (string: string): number => {
  let total = 0;
  for (let i = 0; i !== string.length; i++) {
    if (total >= Number.MAX_SAFE_INTEGER) break;
    total += string.charCodeAt(i);
  }
  return total;
}

// get The range of given hue when options.count!=0
const getRealHueRange = (colorHue: any): number[] | undefined => {
  if (!isNaN(colorHue)) {
    const number = parseInt(colorHue);

    if (number < 360 && number > 0) {
      return (getColorInfo(colorHue) as { hueRange: number[] }).hueRange;
    }
  } else if (typeof colorHue === 'string') {
    if (colorDictionary[colorHue]) {
      const color = colorDictionary[colorHue];

      if (color.hueRange) {
        return color.hueRange;
      }
    } else if (colorHue.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
      const hue = HexToHSB(colorHue)[0];
      return (getColorInfo(hue) as { hueRange: number[] }).hueRange;
    }
  }
  return undefined;
};


// Populate the color dictionary
loadColorBounds();