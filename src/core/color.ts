/**
 * 颜色换算与 WCAG 对比度计算（纯函数，全部本地计算）。
 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface WcagResult {
  ratio: number;
  /** 正常字号是否满足 AA（>= 4.5） */
  aa: boolean;
  /** 正常字号是否满足 AAA（>= 7） */
  aaa: boolean;
  /** 大字号是否满足 AA（>= 3） */
  aaLarge: boolean;
  /** 大字号是否满足 AAA（>= 4.5） */
  aaaLarge: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeChannel(value: number): number {
  return clamp(Math.round(value), 0, 255);
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (channel: number) => normalizeChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(input: string): RgbColor | null {
  const value = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }
  return null;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (hn < 60) {
    rn = c;
    gn = x;
  } else if (hn < 120) {
    rn = x;
    gn = c;
  } else if (hn < 180) {
    gn = c;
    bn = x;
  } else if (hn < 240) {
    gn = x;
    bn = c;
  } else if (hn < 300) {
    rn = x;
    bn = c;
  } else {
    rn = c;
    bn = x;
  }

  return {
    r: normalizeChannel((rn + m) * 255),
    g: normalizeChannel((gn + m) * 255),
    b: normalizeChannel((bn + m) * 255),
  };
}

/**
 * 解析多种颜色写法：#rgb、#rrggbb、rgb()、rgba()、hsl()、hsla()。
 */
export function parseColor(input: string): RgbColor | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const hex = hexToRgb(value);
  if (hex) return hex;

  const rgbMatch = value.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/);
  if (rgbMatch) {
    return {
      r: normalizeChannel(Number(rgbMatch[1])),
      g: normalizeChannel(Number(rgbMatch[2])),
      b: normalizeChannel(Number(rgbMatch[3])),
    };
  }

  const hslMatch = value.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/);
  if (hslMatch) {
    return hslToRgb({
      h: Number(hslMatch[1]),
      s: Number(hslMatch[2]),
      l: Number(hslMatch[3]),
    });
  }

  return null;
}

export function formatRgb({ r, g, b }: RgbColor): string {
  return `rgb(${normalizeChannel(r)}, ${normalizeChannel(g)}, ${normalizeChannel(b)})`;
}

export function formatHsl({ h, s, l }: HslColor): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: RgbColor): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

/** WCAG 2.x 对比度，范围 1 ~ 21 */
export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateWcag(foreground: RgbColor, background: RgbColor): WcagResult {
  const ratio = contrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export function formatColor(color: RgbColor, format: ColorFormat): string {
  switch (format) {
    case 'rgb':
      return formatRgb(color);
    case 'hsl':
      return formatHsl(rgbToHsl(color));
    default:
      return rgbToHex(color);
  }
}
